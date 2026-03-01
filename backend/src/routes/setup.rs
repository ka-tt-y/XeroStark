//! POST /setup — compile a circom circuit, generate a Groth16 verifier,
//! declare it on Starknet, and return the class hash for client-side deploy.

use std::sync::Arc;

use rocket::{post, serde::json::Json, State};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use tracing::info;

use crate::config::AppState;
use crate::db::Db;
use crate::routes::errors::AppError;
use crate::routes::response::ApiResponse;
use crate::services::compiler::{build_and_declare_verifier, compile_and_setup};
use crate::utils::{extract_input_signals, extract_output_signals, extract_public_input_signals, generate_circuit_description, generate_input_descriptions, generate_output_descriptions};

#[post("/setup?<address>&<is_public>&<force_redeploy>", data = "<circuit>")]
pub async fn setup(
    circuit: String,
    state: &State<AppState>,
    db: &State<Arc<Db>>,
    address: Option<String>,
    is_public: Option<bool>,
    force_redeploy: Option<bool>,
) -> Result<Json<ApiResponse<Value>>, AppError> {
    let is_public = is_public.unwrap_or(true);
    let force_redeploy = force_redeploy.unwrap_or(false);
    let circuit_str = circuit.clone();
    let circuit_bytes = circuit.into_bytes();

    let mut hasher = Sha256::new();
    hasher.update(&circuit_bytes);
    info!("Computing hash for the circuit");
    let circuit_hash = format!("{:x}", hasher.finalize());

    // if circuit already exists in DB 
    // check if we can skip compilation and just return the verifier and deployment info
    if db.circuit_exists(&circuit_hash).await? {
        info!("Circuit hash exists in database, checking for proof artifacts");

        if let Ok(circuit_data) = db.get_circuit_by_hash(&circuit_hash).await {
            let deployed_address = circuit_data
                .deployment
                .as_ref()
                .and_then(|d| d.contract_address.clone())
                .unwrap_or_default();

            // Return cached result if already deployed (and no force redeploy)
            if !deployed_address.is_empty() && !force_redeploy {
                let vk_json = circuit_data.artifact.vk_json.clone();
                let input_signals = circuit_data.artifact.input_signals.clone().unwrap_or_default();
                let input_descriptions = circuit_data.artifact.input_descriptions.clone();
                return Ok(Json(ApiResponse {
                    success: true,
                    message: "Circuit already setup, returning verifier".to_string(),
                    data: json!({
                        "verifier": vk_json,
                        "deployed_address": deployed_address,
                        "circuit_hash": circuit_hash,
                        "input_signals": input_signals,
                        "input_descriptions": input_descriptions,
                    }),
                }));
            }

            // Has artifacts but no deployment — rebuild verifier for client-side deploy
            info!("Circuit has artifacts but no deployment — rebuilding verifier contract");
            let vk_json_str = circuit_data.artifact.vk_json.clone();
            let input_signals = circuit_data.artifact.input_signals.clone().unwrap_or_default();
            let input_descriptions = circuit_data.artifact.input_descriptions.clone();

            let vk_tmp_path = state
                .cache_dir
                .lock()
                .await
                .join(format!("vk_{}.json", circuit_hash));
            tokio::fs::write(&vk_tmp_path, &vk_json_str).await?;

            let class_hash =
                build_and_declare_verifier(state.inner(), &vk_tmp_path, &circuit_hash).await?;
            let _ = tokio::fs::remove_file(&vk_tmp_path).await;

            return Ok(Json(ApiResponse {
                success: true,
                message: "Contract declared. Deploy from your wallet.".to_string(),
                data: json!({
                    "circuit_hash": circuit_hash,
                    "input_signals": input_signals,
                    "input_descriptions": input_descriptions,
                    "class_hash": class_hash,
                }),
            }));
        }

        info!("Circuit exists but has no proof artifacts — proceeding with full setup");
    }

    let (vk_json_str, wasm_path, zkey_path_final, witness_js_path) =
        compile_and_setup(state.inner(), &circuit_bytes, &circuit_hash).await?;

    // Write vk to temp file for garaga
    let vk_tmp_path = state
        .cache_dir
        .lock()
        .await
        .join(format!("vk_{}.json", circuit_hash));
    tokio::fs::write(&vk_tmp_path, &vk_json_str).await?;

    let class_hash =
        build_and_declare_verifier(state.inner(), &vk_tmp_path, &circuit_hash).await?;
    let _ = tokio::fs::remove_file(&vk_tmp_path).await;

    // Extract input, output, and public-input signals
    let input_signals = extract_input_signals(&circuit_str);
    info!("Extracted input signals: {:?}", input_signals);
    let output_signals = extract_output_signals(&circuit_str);
    info!("Extracted output signals: {:?}", output_signals);
    let public_input_signals = extract_public_input_signals(&circuit_str);
    info!("Extracted public input signals: {:?}", public_input_signals);

    let circuit_name = {
        let name_re = regex::Regex::new(r"template\s+(\w+)").ok();
        name_re
            .and_then(|re| re.captures(&circuit_str))
            .and_then(|caps| caps.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_else(|| "User Circuit".to_string())
    };

    // Generate description + input/output/public-input signal descriptions in parallel
    let (circuit_description, input_descriptions, output_descriptions, public_input_descriptions) = {
        let desc_fut = generate_circuit_description(&state.http_client, &circuit_name, &circuit_str);
        let input_desc_fut = if !input_signals.is_empty() {
            Some(generate_input_descriptions(&state.http_client, &circuit_name, &circuit_str, &input_signals))
        } else {
            None
        };
        let output_desc_fut = if !output_signals.is_empty() {
            Some(generate_output_descriptions(&state.http_client, &circuit_name, &circuit_str, &output_signals))
        } else {
            None
        };
        // Public input descriptions — reuse the input description generator for only the public subset
        let pub_input_desc_fut = if !public_input_signals.is_empty() {
            Some(generate_input_descriptions(&state.http_client, &circuit_name, &circuit_str, &public_input_signals))
        } else {
            None
        };

        let desc_result = desc_fut.await;
        let input_desc_result = match input_desc_fut {
            Some(fut) => fut.await.ok(),
            None => None,
        };
        let output_desc_result = match output_desc_fut {
            Some(fut) => fut.await.ok(),
            None => None,
        };
        let pub_input_desc_result = match pub_input_desc_fut {
            Some(fut) => fut.await.ok(),
            None => None,
        };

        let circuit_desc = match desc_result {
            Ok(desc) => {
                info!("Generated circuit description: {}", &desc[..desc.len().min(80)]);
                Some(desc)
            }
            Err(e) => {
                info!("Could not generate circuit description (non-fatal): {}", e);
                None
            }
        };

        (circuit_desc, input_desc_result, output_desc_result, pub_input_desc_result)
    };

    // Persist circuit + artifacts
    let circuit_id = db
        .upsert_circuit_for_setup(
            &circuit_hash,
            &circuit_str,
            crate::db::CircuitType::Circom,
            Some(&circuit_name),
            circuit_description.as_deref(),
            address.as_deref(),
            is_public,
        )
        .await?;
    info!("Circuit ID for setup: {}", circuit_id);

    // Serialize description maps to JSON values for DB storage
    let input_desc_json = input_descriptions
        .as_ref()
        .map(|m| serde_json::to_value(m).unwrap_or_default());
    let output_desc_json = output_descriptions
        .as_ref()
        .map(|m| serde_json::to_value(m).unwrap_or_default());
    let pub_input_desc_json = public_input_descriptions
        .as_ref()
        .map(|m| serde_json::to_value(m).unwrap_or_default());

    db.insert_proof_artifact(
        circuit_id,
        &vk_json_str,
        wasm_path.to_str().unwrap(),
        zkey_path_final.to_str().unwrap(),
        witness_js_path.to_str().unwrap(),
        &input_signals,
        &output_signals,
        &public_input_signals,
        output_desc_json.as_ref(),
        pub_input_desc_json.as_ref(),
        input_desc_json.as_ref(),
    )
    .await?;

    Ok(Json(ApiResponse {
        success: true,
        message: "Contract declared. Deploy from your wallet.".to_string(),
        data: json!({
            "circuit_hash": circuit_hash,
            "input_signals": input_signals,
            "input_descriptions": input_descriptions,
            "output_signals": output_signals,
            "output_descriptions": output_descriptions,
            "public_input_signals": public_input_signals,
            "public_input_descriptions": public_input_descriptions,
            "class_hash": class_hash,
        }),
    }))
}
