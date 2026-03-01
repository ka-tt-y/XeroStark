//! Circom circuit compilation service.
//!
//! Wraps the circom CLI, snarkjs setup, and garaga verifier generation
//! into a single high-level function.

use std::path::{Path, PathBuf};

use glob::glob;
use tokio::process::Command;
use tracing::{error, info};

use crate::config::AppState;
use crate::routes::errors::AppError;
use crate::utils::generate_garaga_verifier;

/// Compile a circom circuit, run groth16 setup, and export the verification key.
///
/// Returns `(vk_json_string, wasm_path, zkey_path, witness_js_path)`.
pub async fn compile_and_setup(
    state: &AppState,
    circuit_code: &[u8],
    circuit_hash: &str,
) -> Result<(String, PathBuf, PathBuf, PathBuf), AppError> {
    let circuit_path = {
        let mut dir = state.cache_dir.lock().await.clone();
        dir.push(format!("{}.circom", circuit_hash));
        dir
    };

    info!("Writing circuit file to {:?}", circuit_path);
    tokio::fs::write(&circuit_path, circuit_code).await?;

    // Build directory
    let build_dir = {
        let mut dir = state.cache_dir.lock().await.clone();
        dir.push(format!("build_{}", circuit_hash));
        tokio::fs::create_dir_all(&dir).await?;
        dir
    };

    // Compile with circom
    info!("Compiling circuit using circom compiler");
    let mut circom_cmd = Command::new("circom");
    circom_cmd
        .arg(&circuit_path)
        .arg("--r1cs")
        .arg("--wasm")
        .arg("--sym")
        .arg("-o")
        .arg(&build_dir);
    for lib_path in &state.circom_libs {
        circom_cmd.arg("-l").arg(lib_path);
    }
    let output = circom_cmd.output().await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        error!("Circom compilation failed: {}", stderr);

        let ansi_re = regex::Regex::new(r"\x1b\[[0-9;]*m").unwrap();
        let clean_stderr = ansi_re.replace_all(&stderr, "").to_string();

        if clean_stderr.contains("to be included has not been found")
            || clean_stderr.contains("FileNotFound")
        {
            let include_re =
                regex::Regex::new(r"The file (\S+) to be included has not been found").ok();
            let missing_file = include_re
                .and_then(|re| re.captures(&clean_stderr))
                .and_then(|caps| caps.get(1))
                .map(|m| m.as_str().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            return Err(AppError::bad_request(format!(
                "Circuit compilation failed: the included file '{}' could not be found. \
                 Standard circomlib templates are supported — try using the full path, e.g. \
                 `include \"circomlib/circuits/sha256/sha256_2.circom\";`. \
                 If you are using a non-standard library, it may not be available on the server.",
                missing_file
            )));
        }

        return Err(AppError::internal(format!("Circuit compilation failed: {}", clean_stderr)));
    }

    // Groth16 setup
    let r1cs_path = build_dir.join(format!("{}.r1cs", circuit_hash));
    let zkey_path = build_dir.join(format!("{}.zkey", circuit_hash));
    info!("Setting up the circuit with groth16");

    let setup_output = Command::new("snarkjs")
        .arg("groth16")
        .arg("setup")
        .arg(&r1cs_path)
        .arg(&state.ptau_path)
        .arg(&zkey_path)
        .output()
        .await?;

    if !setup_output.status.success() {
        let stderr = String::from_utf8_lossy(&setup_output.stderr).to_string();
        error!("snarkjs groth16 setup failed: {}", stderr);
        return Err(AppError::internal(format!("Groth16 setup failed: {}", stderr)));
    }

    // Export verification key
    let vk_path = build_dir.join(format!("{}_vk.json", circuit_hash));
    Command::new("snarkjs")
        .arg("zkey")
        .arg("export")
        .arg("verificationkey")
        .arg(&zkey_path)
        .arg(&vk_path)
        .output()
        .await?;
    info!("Exported verification key to {:?}", vk_path);

    let vk_json_str = tokio::fs::read_to_string(&vk_path).await?;

    // Copy artifacts to permanent hash directory
    let hash_dir = state.cache_dir.lock().await.join(circuit_hash);
    tokio::fs::create_dir_all(&hash_dir).await?;

    let wasm_path = hash_dir.join("circuit.wasm");
    let zkey_path_final = hash_dir.join("circuit_final.zkey");
    let witness_js_path = hash_dir.join("generate_witness.js");

    let circom_wasm_path = build_dir
        .join(format!("{}_js", circuit_hash))
        .join(format!("{}.wasm", circuit_hash));
    tokio::fs::copy(&circom_wasm_path, &wasm_path).await?;
    tokio::fs::copy(&zkey_path, &zkey_path_final).await?;

    // Copy witness generation JS files
    let witness_js_src = build_dir.join(format!("{}_js", circuit_hash));
    for js_file in &["generate_witness.js", "witness_calculator.js"] {
        let src = witness_js_src.join(js_file);
        let dst = hash_dir.join(js_file);
        if src.exists() {
            tokio::fs::copy(&src, &dst).await?;
        }
    }
    info!("Copied witness JS files to {:?}", hash_dir);

    // Clean up build directory
    let _ = tokio::fs::remove_dir_all(&build_dir).await;
    let _ = tokio::fs::remove_file(&circuit_path).await;

    Ok((vk_json_str, wasm_path, zkey_path_final, witness_js_path))
}

/// Build the garaga verifier contract, compile with scarb, and declare on Starknet.
///
/// Returns the declared class hash as a hex string.
pub async fn build_and_declare_verifier(
    state: &AppState,
    vk_path: &Path,
    circuit_hash: &str,
) -> Result<String, AppError> {
    let garaga_build_dir = state
        .cache_dir
        .lock()
        .await
        .join(format!("garaga_build_{}", circuit_hash));
    tokio::fs::create_dir_all(&garaga_build_dir).await?;

    let project_name = format!("verifier_{}", circuit_hash);
    let project_dir = generate_garaga_verifier(vk_path, &garaga_build_dir, &project_name)
        .await
        .map_err(|e| AppError::internal(format!("Failed to generate garaga verifier: {}", e)))?;

    // Build with scarb
    info!("Building verifier contract with scarb");
    let scarb_output = Command::new("scarb")
        .arg("build")
        .current_dir(&project_dir)
        .output()
        .await?;

    if !scarb_output.status.success() {
        let stderr = String::from_utf8_lossy(&scarb_output.stderr).to_string();
        error!("scarb build failed: {}", stderr);
        return Err(AppError::internal(format!("Verifier contract build failed: {}", stderr)));
    }

    // Read Sierra and CASM artifacts
    let target_dev = project_dir.join("target").join("dev");
    let sierra_json = read_glob_artifact(
        &target_dev,
        "*_Groth16VerifierBN254.contract_class.json",
        "Sierra",
    )?;
    let casm_json = read_glob_artifact(
        &target_dev,
        "*_Groth16VerifierBN254.compiled_contract_class.json",
        "CASM",
    )?;

    info!(
        "Contract artifacts loaded — Sierra: {} bytes, CASM: {} bytes",
        sierra_json.len(),
        casm_json.len()
    );

    // Declare on Starknet
    let class_hash = crate::services::starknet::declare_contract_class(&sierra_json, &casm_json)
        .await
        .map_err(|e| AppError::internal(format!("Contract declaration failed: {}", e)))?;
    info!("Contract declared with class hash: {}", class_hash);

    // Clean up
    let _ = tokio::fs::remove_dir_all(&garaga_build_dir).await;

    Ok(class_hash)
}

/// Read a contract artifact file matching a glob pattern inside `dir`.
fn read_glob_artifact(dir: &Path, pattern: &str, label: &str) -> Result<String, AppError> {
    let full_pattern = dir.join(pattern);
    let path = glob(full_pattern.to_str().unwrap())
        .map_err(|e| AppError::internal(format!("Glob error: {}", e)))?
        .filter_map(Result::ok)
        .next()
        .ok_or_else(|| {
            AppError::internal(format!("{} artifact not found after build", label))
        })?;

    std::fs::read_to_string(&path).map_err(|e| {
        error!("Failed to read {} artifact: {}", label, e);
        AppError::internal("Failed to read compiled contract")
    })
}
