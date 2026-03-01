//! Circuit template and user-circuit query endpoints.

use std::path::PathBuf;
use std::sync::Arc;

use rocket::{get, post, http::Status, serde::json::Json, State};
use tracing::{error, info, warn};

use crate::db::{CircuitTemplate, CircuitWithDeployment, Db, DeploymentWithCircuit, PlatformStats, ProofDetails, ProofWithCircuit};
use crate::config::AppState;
use crate::services::cache::{TemplateCache, CircomFile};
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
        if let Ok(circuit) = db.get_circuit_record_by_hash(hash).await {
            if let Some(code) = circuit.code {
                return Ok(Json(code));
            }
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
    db.get_public_circuits()
        .await
        .map(Json)
        .map_err(|e| {
            error!("Failed to get public circuits: {}", e);
            Status::InternalServerError
        })
}

#[get("/stats")]
pub async fn get_platform_stats(
    db: &State<Arc<Db>>,
) -> Result<Json<PlatformStats>, Status> {
    db.get_platform_stats()
        .await
        .map(Json)
        .map_err(|e| {
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
    db.get_user_circuits(&address)
        .await
        .map(Json)
        .map_err(|e| {
            error!("Failed to get user circuits: {}", e);
            Status::InternalServerError
        })
}

#[get("/user/proofs?<address>")]
pub async fn get_user_proofs(
    address: String,
    db: &State<Arc<Db>>,
) -> Result<Json<Vec<ProofWithCircuit>>, Status> {
    db.get_user_proofs(&address)
        .await
        .map(Json)
        .map_err(|e| {
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

// ── Proof sharing ─────────────────────────────────────────────────────

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
) -> Result<Json<ShareProofResponse>, Status> {
    match db.generate_proof_share_token(proof_id).await {
        Ok(token) => {
            let share_url = format!("http://localhost:5174/proof/{}", token);
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
/// Finds the first template missing a description, 
/// generates it using the code and name, saves it to the DB, and invalidates the cache.

async fn backfill_missing_description(db: &Arc<Db>, cache: &Arc<TemplateCache>, client: &reqwest::Client) -> bool {
    let templates = match db.get_circuits().await {
        Ok(t) => t,
        Err(_) => return false,
    };

    let template = match templates
        .iter()
        .find(|t| t.description.is_none() && t.code.is_some())
    {
        Some(t) => t,
        None => return false,
    };

    let name = template.name.as_deref().unwrap_or("Unknown");
    let code = template.code.as_deref().unwrap_or("");

    match generate_circuit_description(client, name, code).await {
        Ok(desc) => {
            info!(
                "Backfilled description for {}: {}",
                name,
                &desc[..desc.len().min(80)]
            );
            if let Err(e) = db.update_circuit_description(template.id, &desc).await {
                error!("Failed to save backfilled description for {}: {}", name, e);
            }
            cache.invalidate(db).await;
            true
        }
        Err(e) => {
            warn!("Failed to backfill description for {}: {}", name, e);
            false
        }
    }
}
