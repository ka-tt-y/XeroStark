//! POST /register-deployment — record a client-side contract deployment.

use std::sync::Arc;

use rocket::{State, post, serde::json::Json};
use serde::Deserialize;
use serde_json::{Value, json};
use tracing::info;

use crate::db::{Db, DeploymentType};
use crate::routes::errors::AppError;
use crate::routes::response::ApiResponse;

#[derive(Deserialize)]
pub struct RegisterDeployment {
    circuit_hash: String,
    class_hash: String,
    contract_address: String,
    tx_hash: Option<String>,
    deployed_by: Option<String>,
}

#[post("/register-deployment", data = "<input>")]
pub async fn register_deployment(
    db: &State<Arc<Db>>,
    input: Json<RegisterDeployment>,
) -> Result<Json<ApiResponse<Value>>, AppError> {
    info!(
        "Registering deployment for circuit hash: {}",
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

    db.insert_deployment(
        circuit_data.circuit.id,
        DeploymentType::User,
        &input.contract_address,
        &input.class_hash,
        None,
        input.tx_hash.as_deref(),
        input.deployed_by.as_deref(),
    )
    .await?;

    info!(
        "Registered deployment for circuit {} at {}",
        input.circuit_hash, input.contract_address
    );

    Ok(Json(ApiResponse {
        success: true,
        message: "Deployment registered successfully".to_string(),
        data: json!({
            "circuit_hash": input.circuit_hash,
            "deployed_address": input.contract_address,
            "class_hash": input.class_hash,
        }),
    }))
}
