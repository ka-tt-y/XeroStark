use rocket::{State, http::Status, post, serde::json::Json};
use serde_json::Value;
use tracing::{error, info};

use crate::config::AppState;

/// Proxy endpoint for the Avnu paymaster.
/// Forwards JSON-RPC requests to Avnu's paymaster API with the API key
/// This sponsors transaction fees for users, enabling gasless transactions on StarkNet.
#[post("/paymaster", format = "json", data = "<body>")]
pub async fn paymaster_proxy(
    state: &State<AppState>,
    body: Json<Value>,
) -> Result<Json<Value>, Status> {
    let api_key = std::env::var("AVNU_PAYMASTER_API_KEY").unwrap_or_default();
    if api_key.is_empty() {
        error!("AVNU_PAYMASTER_API_KEY is not set — paymaster proxy unavailable");
        return Err(Status::ServiceUnavailable);
    }

    // Use Sepolia endpoint
    let avnu_url = std::env::var("AVNU_PAYMASTER_URL")
        .unwrap_or_else(|_| "https://sepolia.paymaster.avnu.fi".to_string());

    info!(
        "Proxying paymaster request to {} — method: {:?}",
        avnu_url,
        body.get("method")
            .and_then(|m| m.as_str())
            .unwrap_or("unknown")
    );

    let response = state
        .http_client
        .post(&avnu_url)
        .header("Content-Type", "application/json")
        .header("x-paymaster-api-key", &api_key)
        .json(&body.into_inner())
        .send()
        .await
        .map_err(|e| {
            error!("Paymaster proxy request failed: {}", e);
            Status::BadGateway
        })?;

    if !response.status().is_success() {
        let status_code = response.status().as_u16();
        let body_text = response.text().await.unwrap_or_default();
        error!("Paymaster returned error {}: {}", status_code, body_text);
        return Err(Status::new(status_code));
    }

    let result: Value = response.json().await.map_err(|e| {
        error!("Failed to parse paymaster response: {}", e);
        Status::BadGateway
    })?;

    Ok(Json(result))
}
