use rocket::http::Status;
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

/// Standard API response wrapper used by all endpoints.
#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    #[serde(flatten)]
    pub data: T,
}

/// Build a JSON error response with an HTTP status code.
/// Rocket uses the status from the `Custom` wrapper; the body is always JSON.
pub fn json_error(status: Status, msg: &str) -> (Status, Json<ApiResponse<Value>>) {
    (
        status,
        Json(ApiResponse {
            success: false,
            message: msg.to_string(),
            data: json!({}),
        }),
    )
}
