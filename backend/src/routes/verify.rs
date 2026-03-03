//! POST /verify — generate calldata for on-chain verification.
//! POST /register-proof — register a verified proof after on-chain tx.

use std::sync::Arc;

use rocket::{State, post, serde::json::Json};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tokio::process::Command;
use tracing::{error, info};

use crate::config::AppState;
use crate::db::Db;
use crate::routes::errors::AppError;
use crate::routes::response::ApiResponse;

#[derive(Serialize, Deserialize, Debug)]
pub struct VerifyInput {
    pub circuit_hash: String,
    pub proof: String,
    pub public_signals: String,
    pub created_by: Option<String>,
}

/// Generate calldata for on-chain proof verification.
/// The frontend submits the actual transaction from the user's wallet.
#[post("/verify", data = "<input>")]
pub async fn verify_onchain(
    state: &State<AppState>,
    db: &State<Arc<Db>>,
    input: Json<VerifyInput>,
) -> Result<Json<ApiResponse<Value>>, AppError> {
    info!(
        "Generating verify calldata for circuit hash: {}",
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

    let deployed_address = circuit_data
        .deployment
        .as_ref()
        .and_then(|d| d.contract_address.as_ref())
        .ok_or_else(|| {
            AppError::bad_request(
                "No deployed verifier contract found for this circuit. Please redeploy.",
            )
        })?;

    // Check for already-verified identical proof
    if let Ok(existing_id) = db
        .get_existing_verified_proof(circuit_data.circuit.id, &input.proof)
        .await
    {
        info!(
            "This exact proof already verified for circuit {} (proof_id={})",
            input.circuit_hash, existing_id.0
        );
        return Ok(Json(ApiResponse {
            success: true,
            message: "Proof already verified on-chain for these inputs".to_string(),
            data: json!({
                "verified": true,
                "contract_address": deployed_address,
                "transaction_hash": existing_id.1,
                "proof_id": existing_id.0,
                "already_verified": true,
            }),
        }));
    }

    let vk_json = &circuit_data.artifact.vk_json;

    // Write proof / vk / public inputs to a unique temp dir
    let request_id = uuid::Uuid::new_v4().to_string();
    let verify_dir = state
        .cache_dir
        .lock()
        .await
        .clone()
        .join(format!("temp_verify_{}", request_id));
    tokio::fs::create_dir_all(&verify_dir).await?;

    let proof_path = verify_dir.join("proof.json");
    let vk_path = verify_dir.join("vk.json");
    let public_path = verify_dir.join("public.json");

    tokio::fs::write(&proof_path, &input.proof).await?;
    tokio::fs::write(&vk_path, vk_json).await?;
    tokio::fs::write(&public_path, &input.public_signals).await?;

    info!("Generating calldata for contract: {}", deployed_address);

    let calldata_output = Command::new("garaga")
        .env("NO_COLOR", "1")
        .arg("calldata")
        .arg("--system")
        .arg("groth16")
        .arg("--proof")
        .arg(&proof_path)
        .arg("--vk")
        .arg(&vk_path)
        .arg("--public-inputs")
        .arg(&public_path)
        .arg("--format")
        .arg("starkli")
        .output()
        .await?;

    let stdout = String::from_utf8_lossy(&calldata_output.stdout);
    let stderr = String::from_utf8_lossy(&calldata_output.stderr);

    if !calldata_output.status.success() {
        let stderr_str = stderr.to_string();
        error!("garaga calldata failed: {}", stderr_str);
        let _ = tokio::fs::remove_dir_all(&verify_dir).await;
        return Err(AppError::internal(format!(
            "Calldata generation failed: {}",
            stderr_str
        )));
    }

    info!("Generated verify calldata successfully");
    let _ = tokio::fs::remove_dir_all(&verify_dir).await;

    let calldata: Vec<String> = stdout
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();

    if calldata.is_empty() {
        error!(
            "garaga calldata produced empty output. stdout: {}, stderr: {}",
            stdout, stderr
        );
        return Err(AppError::internal(
            "Calldata generation produced empty output",
        ));
    }

    info!(
        "Calldata has {} elements (including length prefix)",
        calldata.len()
    );

    Ok(Json(ApiResponse {
        success: true,
        message: "Calldata generated. Please approve the transaction in your wallet.".to_string(),
        data: json!({
            "calldata": calldata,
            "contract_address": deployed_address,
            "circuit_id": circuit_data.circuit.id,
        }),
    }))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RegisterProofInput {
    pub circuit_hash: String,
    pub proof: String,
    pub public_signals: String,
    pub tx_hash: String,
    pub created_by: Option<String>,
}

/// Register a proof after the user has submitted the on-chain verification tx.
#[post("/register-proof", data = "<input>")]
pub async fn register_proof(
    db: &State<Arc<Db>>,
    input: Json<RegisterProofInput>,
) -> Result<Json<ApiResponse<Value>>, AppError> {
    info!(
        "Registering verified proof for circuit hash: {}",
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

    let deployed_address = circuit_data
        .deployment
        .as_ref()
        .and_then(|d| d.contract_address.as_ref())
        .cloned()
        .unwrap_or_default();

    let proof_id = db
        .insert_verified_proof(
            circuit_data.circuit.id,
            &input.proof,
            &input.public_signals,
            Some(&input.tx_hash),
            input.created_by.as_deref(),
        )
        .await?;

    Ok(Json(ApiResponse {
        success: true,
        message: "Proof registered successfully".to_string(),
        data: json!({
            "verified": true,
            "contract_address": deployed_address,
            "transaction_hash": input.tx_hash,
            "proof_id": proof_id,
        }),
    }))
}
