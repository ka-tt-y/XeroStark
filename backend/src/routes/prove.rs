//! POST /prove — generate a Groth16 proof for a compiled circuit.

use std::path::PathBuf;
use std::sync::Arc;

use rocket::{State, post, serde::json::Json};
use serde::Deserialize;
use serde_json::{Value, json};
use tokio::process::Command;
use tracing::{error, info};

use crate::config::AppState;
use crate::db::Db;
use crate::routes::errors::AppError;
use crate::routes::response::ApiResponse;

#[derive(Deserialize)]
pub struct ProveInput {
    pub circuit_hash: String,
    pub inputs: Value,
}

#[post("/prove", data = "<input>")]
pub async fn prove(
    state: &State<AppState>,
    db: &State<Arc<Db>>,
    input: Json<ProveInput>,
) -> Result<Json<ApiResponse<Value>>, AppError> {
    info!(
        "Starting proof generation for circuit hash: {}",
        input.circuit_hash
    );

    let circuit_data = db
        .get_circuit_by_hash(&input.circuit_hash)
        .await
        .map_err(|_| {
            AppError::not_found(format!(
                "Circuit not found for hash: {}",
                input.circuit_hash
            ))
        })?;

    let wasm_path = PathBuf::from(&circuit_data.artifact.wasm_path);
    let zkey_path = PathBuf::from(&circuit_data.artifact.zkey_path);
    let witness_js_path = PathBuf::from(&circuit_data.artifact.witness_js_path);
    let vk_json = &circuit_data.artifact.vk_json;
    let deployed_address = circuit_data
        .deployment
        .as_ref()
        .and_then(|d| d.contract_address.as_ref())
        .map(|s| s.as_str())
        .unwrap_or("Not deployed");

    // Write inputs to a temporary file
    let proof_dir = state.cache_dir.lock().await.clone().join("temp_prove");
    let input_path = proof_dir.join(format!("{}_input.json", input.circuit_hash));

    tokio::fs::create_dir_all(&proof_dir).await?;

    tokio::fs::write(&input_path, serde_json::to_string(&input.inputs).unwrap()).await?;

    // Generate witness
    let witness_path = proof_dir.join("witness.wtns");
    let witness_js_parent = witness_js_path
        .parent()
        .expect("Failed to get witness_js parent");
    let witness_js_file = witness_js_parent.join("generate_witness.js");

    info!("Generating witness using wasm");
    let witness_output = Command::new("node")
        .arg(&witness_js_file)
        .arg(&wasm_path)
        .arg(&input_path)
        .arg(&witness_path)
        .output()
        .await?;

    if !witness_output.status.success() {
        let stderr = String::from_utf8_lossy(&witness_output.stderr).to_string();
        error!("Witness generation failed: {}", stderr);
        return Err(AppError::bad_request("Error generating witness"));
    }

    // Generate proof
    info!("Generating proof using snarkjs");
    let proof_path = proof_dir.join("proof.json");
    let public_path = proof_dir.join("public.json");

    let proof_output = Command::new("snarkjs")
        .arg("groth16")
        .arg("prove")
        .arg(&zkey_path)
        .arg(&witness_path)
        .arg(&proof_path)
        .arg(&public_path)
        .output()
        .await?;

    if !proof_output.status.success() {
        let stderr = String::from_utf8_lossy(&proof_output.stderr).to_string();
        error!("Proof generation failed: {}", stderr);
        return Err(AppError::internal(format!(
            "Proof generation failed: {}",
            stderr
        )));
    }

    // Prepare vk for calldata generation
    let vk_temp_path = proof_dir.join("vk_for_calldata.json");
    tokio::fs::write(&vk_temp_path, vk_json).await?;

    let proof_str = tokio::fs::read_to_string(&proof_path).await?;
    let public_str = tokio::fs::read_to_string(&public_path).await?;

    // Generate garaga calldata
    let call_data_dir = state.cache_dir.lock().await.clone().join("calldata");
    tokio::fs::create_dir_all(&call_data_dir).await?;

    let calldata_output = Command::new("garaga")
        .env("NO_COLOR", "1")
        .arg("calldata")
        .arg("--system")
        .arg("groth16")
        .arg("--proof")
        .arg(&proof_path)
        .arg("--vk")
        .arg(&vk_temp_path)
        .arg("--public-inputs")
        .arg(&public_path)
        .arg("--output-path")
        .arg(&call_data_dir)
        .output()
        .await?;

    if !calldata_output.status.success() {
        let stderr = String::from_utf8_lossy(&calldata_output.stderr).to_string();
        error!("garaga gen-calldata failed: {}", stderr);
        return Err(AppError::internal(format!(
            "Calldata generation failed: {}",
            stderr
        )));
    } else {
        info!(
            "Generated calldata successfully: {}",
            String::from_utf8_lossy(&calldata_output.stdout)
        );
    }

    // Clean up temp files
    let _ = tokio::fs::remove_file(&input_path).await;
    let _ = tokio::fs::remove_file(&witness_path).await;
    let _ = tokio::fs::remove_file(&vk_temp_path).await;

    Ok(Json(ApiResponse {
        success: true,
        message: "Proof generated successfully".to_string(),
        data: json!({
            "verifier_address": deployed_address,
            "public_signals": public_str,
            "proof": proof_str,
            "circuit_hash": input.circuit_hash,
            "output_signals": circuit_data.artifact.output_signals.unwrap_or_default(),
            "public_input_signals": circuit_data.artifact.public_input_signals.unwrap_or_default(),
            "output_descriptions": circuit_data.artifact.output_descriptions,
            "public_input_descriptions": circuit_data.artifact.public_input_descriptions,
        }),
    }))
}
