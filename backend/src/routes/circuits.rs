//! Circuit template and user-circuit query endpoints.

use std::path::PathBuf;
use std::sync::Arc;

use rocket::{State, get, http::Status, post, serde::json::Json};
use tracing::{error, info, warn};

use crate::config::AppState;
use crate::db::{
    CircuitTemplate, CircuitWithDeployment, Db, DeploymentWithCircuit, PlatformStats, ProofDetails,
    ProofWithCircuit,
};
use crate::services::cache::{CircomFile, TemplateCache};
use crate::utils::generate_circuit_description;

/// List all available circuit templates (served from in-memory cache).
#[get("/files")]
pub async fn list_circuit_templates(
    db: &State<Arc<Db>>,
    cache: &State<Arc<TemplateCache>>,
) -> Result<Json<Vec<CircomFile>>, Status> {
    Ok(Json(cache.get_files(db.inner()).await))
}

/// Get the source code of a specific circuit template by path.
#[get("/<path..>")]
pub async fn fetch_content(
    path: PathBuf,
    db: &State<Arc<Db>>,
    cache: &State<Arc<TemplateCache>>,
) -> Result<Json<String>, Status> {
    let path_str = path.display().to_string();
    info!("Fetching content for path: {}", path_str);

    // User-uploaded circuits — fetched from DB on demand
    if let Some(hash) = path_str.strip_prefix("user/") {
        if let Ok(circuit) = db.get_circuit_record_by_hash(hash).await
            && let Some(code) = circuit.code {
                return Ok(Json(code));
            }
        return Err(Status::NotFound);
    }

    // Built-in templates — served from cache
    if let Some(code) = cache.get_code(&path_str).await {
        return Ok(Json(code));
    }

    Err(Status::NotFound)
}

// ── Public / stats / user queries ─────────────────────────────────────

#[get("/public/circuits")]
pub async fn get_public_circuits(
    db: &State<Arc<Db>>,
) -> Result<Json<Vec<CircuitWithDeployment>>, Status> {
    db.get_public_circuits().await.map(Json).map_err(|e| {
        error!("Failed to get public circuits: {}", e);
        Status::InternalServerError
    })
}

#[get("/stats")]
pub async fn get_platform_stats(db: &State<Arc<Db>>) -> Result<Json<PlatformStats>, Status> {
    db.get_platform_stats().await.map(Json).map_err(|e| {
        error!("Failed to get platform stats: {}", e);
        Status::InternalServerError
    })
}

/// Get all circuit templates with AI-generated descriptions.
/// Triggers a background backfill for the first template missing a description.
#[get("/templates")]
pub async fn get_templates(
    state: &State<AppState>,
    db: &State<Arc<Db>>,
    cache: &State<Arc<TemplateCache>>,
) -> Result<Json<Vec<CircuitTemplate>>, Status> {
    let db_inner = Arc::clone(db.inner());
    let cache_inner = Arc::clone(cache.inner());
    let client = state.http_client.clone();
    match db.get_circuits().await {
        Ok(templates) => {
            if templates.iter().any(|t| t.description.is_none()) {
                tokio::spawn(async move {
                    backfill_missing_description(&db_inner, &cache_inner, &client).await;
                });
            }
            Ok(Json(templates))
        }
        Err(e) => {
            error!("Failed to get templates: {}", e);
            Err(Status::InternalServerError)
        }
    }
}

#[get("/user/circuits?<address>")]
pub async fn get_user_circuits(
    address: String,
    db: &State<Arc<Db>>,
) -> Result<Json<Vec<CircuitWithDeployment>>, Status> {
    db.get_user_circuits(&address).await.map(Json).map_err(|e| {
        error!("Failed to get user circuits: {}", e);
        Status::InternalServerError
    })
}

#[get("/user/proofs?<address>")]
pub async fn get_user_proofs(
    address: String,
    db: &State<Arc<Db>>,
) -> Result<Json<Vec<ProofWithCircuit>>, Status> {
    db.get_user_proofs(&address).await.map(Json).map_err(|e| {
        error!("Failed to get user proofs: {}", e);
        Status::InternalServerError
    })
}

#[get("/user/deployments?<address>")]
pub async fn get_user_deployments(
    address: String,
    db: &State<Arc<Db>>,
) -> Result<Json<Vec<DeploymentWithCircuit>>, Status> {
    db.get_user_deployments(&address)
        .await
        .map(Json)
        .map_err(|e| {
            error!("Failed to get user deployments: {}", e);
            Status::InternalServerError
        })
}

/// Get circuit details by hash
#[derive(serde::Serialize)]
pub(crate) struct CircuitDetailsResponse {
    pub circuit_hash: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub deployed_address: Option<String>,
    pub class_hash: Option<String>,
    pub input_signals: Option<Vec<String>>,
    pub output_signals: Option<Vec<String>>,
    pub input_descriptions: Option<serde_json::Value>,
    pub output_descriptions: Option<serde_json::Value>,
}

#[get("/circuit/<circuit_hash>")]
pub async fn get_circuit_details(
    circuit_hash: String,
    db: &State<Arc<Db>>,
) -> Result<Json<CircuitDetailsResponse>, Status> {
    match db.get_circuit_by_hash(&circuit_hash).await {
        Ok(data) => Ok(Json(CircuitDetailsResponse {
            circuit_hash: data.circuit.hash,
            name: data.circuit.name,
            description: data.circuit.description,
            deployed_address: data
                .deployment
                .as_ref()
                .and_then(|d| d.contract_address.clone()),
            class_hash: data.deployment.as_ref().and_then(|d| d.class_hash.clone()),
            input_signals: data.artifact.input_signals,
            output_signals: data.artifact.output_signals,
            input_descriptions: data.artifact.input_descriptions,
            output_descriptions: data.artifact.output_descriptions,
        })),
        Err(e) => {
            error!("Failed to get circuit details for {}: {}", circuit_hash, e);
            Err(Status::NotFound)
        }
    }
}

#[derive(serde::Serialize)]
pub(crate) struct ShareProofResponse {
    success: bool,
    share_url: String,
    share_token: String,
}

#[post("/proofs/<proof_id>/share")]
pub async fn share_proof(
    proof_id: i32,
    db: &State<Arc<Db>>,
    app_state: &State<AppState>,
) -> Result<Json<ShareProofResponse>, Status> {
    match db.generate_proof_share_token(proof_id).await {
        Ok(token) => {
            let share_url = format!("{}/proof/{}", app_state.frontend_url, token);
            Ok(Json(ShareProofResponse {
                success: true,
                share_url,
                share_token: token,
            }))
        }
        Err(e) => {
            error!("Failed to generate share token: {}", e);
            Err(Status::InternalServerError)
        }
    }
}

#[get("/proofs/shared/<token>")]
pub async fn get_shared_proof(
    token: String,
    db: &State<Arc<Db>>,
) -> Result<Json<ProofDetails>, Status> {
    db.get_proof_by_share_token(&token)
        .await
        .map(Json)
        .map_err(|e| {
            error!("Failed to get shared proof: {}", e);
            Status::NotFound
        })
}

/// Background task to backfill missing descriptions for circuit templates.
/// Processes up to 5 templates concurrently per invocation.
async fn backfill_missing_description(
    db: &Arc<Db>,
    cache: &Arc<TemplateCache>,
    client: &reqwest::Client,
) -> bool {
    let templates = match db.get_circuits().await {
        Ok(t) => t,
        Err(_) => return false,
    };

    let missing: Vec<_> = templates
        .iter()
        .filter(|t| t.description.is_none() && t.code.is_some())
        .take(5)
        .collect();

    if missing.is_empty() {
        return false;
    }

    let mut handles = Vec::new();
    for template in &missing {
        let name = template.name.clone().unwrap_or_else(|| "Unknown".to_string());
        let code = template.code.clone().unwrap_or_default();
        let id = template.id;
        let client = client.clone();
        let db_clone = Arc::clone(db);
        handles.push(tokio::spawn(async move {
            match generate_circuit_description(&client, &name, &code).await {
                Ok(desc) => {
                    info!(
                        "Backfilled description for {}: {}",
                        name,
                        &desc[..desc.len().min(80)]
                    );
                    if let Err(e) = db_clone.update_circuit_description(id, &desc).await {
                        error!("Failed to save backfilled description for {}: {}", name, e);
                    }
                    true
                }
                Err(e) => {
                    warn!("Failed to backfill description for {}: {}", name, e);
                    false
                }
            }
        }));
    }

    let mut any_success = false;
    for handle in handles {
        if let Ok(true) = handle.await {
            any_success = true;
        }
    }

    if any_success {
        cache.invalidate(db).await;
    }

    any_success
}
