mod config;
mod db;
mod rate_limit;
mod routes;
mod services;
mod utils;

use std::path::PathBuf;
use std::sync::Arc;

use rocket::serde::json::{Json, Value};
use rocket::{Build, Request, Rocket, catch, catchers, routes};
use tracing::info;

use crate::config::{AppState, Cors};
use crate::db::Db;
use crate::db::database::DatabaseConnection;
use crate::rate_limit::RateLimiter;
use crate::services::cache::TemplateCache;

#[rocket::launch]
async fn rocket() -> Rocket<Build> {
    tracing_subscriber::fmt::init();
    dotenv::from_filename(".secrets").ok();
    dotenv::dotenv().ok();

    // Uses a simple ptau file for all circuits, since we're not doing any trusted
    // setup ceremonies or circuit-specific contributions at this time. In the future
    // we may want to support multiple ptau files for different circuit families,
    // but this is sufficient for now.
    let ptau_path = PathBuf::from(std::env::var("PTAU_PATH").expect("PTAU_PATH not set"));
    let app_state = AppState::new(ptau_path);

    let db_user = std::env::var("DB_USER").expect("DB_USER not set");
    let db_password = std::env::var("DB_PASSWORD").expect("DB_PASSWORD not set");
    let db_host = std::env::var("DB_HOST").expect("DB_HOST not set");
    let db_port = std::env::var("DB_PORT").expect("DB_PORT not set");
    let db_name = std::env::var("DB_NAME").expect("DB_NAME not set");

    let connection = DatabaseConnection::new(
        db_user,
        db_password,
        db_host,
        db_port.parse::<u16>().expect("DB port is not valid"),
        db_name,
        5,
    );
    let db = Db::new(connection)
        .await
        .expect("Failed to establish database connection");
    let db = Arc::new(db);

    let template_cache = Arc::new(TemplateCache::load(&db).await);
    info!("Template cache loaded from database");

    let figment = rocket::Config::figment()
        .merge(("port", 8000))
        .merge(("cli_colors", false))
        .merge(("limits.string", "5 MiB"))
        .merge(("limits.json", "5 MiB"));

    rocket::custom(figment)
        .manage(app_state)
        .manage(db)
        .manage(template_cache)
        .attach(Cors)
        .attach(RateLimiter::new(60)) // 60 requests/minute per IP
        .register(
            "/",
            catchers![
                bad_request,
                not_found,
                unprocessable_entity,
                too_many_requests,
                internal_error
            ],
        )
        .mount(
            "/api/v1",
            routes![
                health,
                options_handler,
                routes::setup::setup,
                routes::prove::prove,
                routes::verify::verify_onchain,
                routes::verify::register_proof,
                routes::deployments::register_deployment,
                routes::circuits::get_public_circuits,
                routes::circuits::get_platform_stats,
                routes::circuits::get_templates,
                routes::circuits::get_user_circuits,
                routes::circuits::get_user_proofs,
                routes::circuits::get_user_deployments,
                routes::circuits::share_proof,
                routes::circuits::get_shared_proof,
                routes::circuits::get_circuit_details,
            ],
        )
        .mount(
            "/api/v1/circuits/",
            routes![
                routes::circuits::list_circuit_templates,
                routes::circuits::fetch_content,
            ],
        )
        .mount("/api/v1", routes![routes::paymaster::paymaster_proxy])
}

#[rocket::get("/health")]
async fn health() -> Json<Value> {
    Json(serde_json::json!({"status": "ok"}))
}

//Catchers

#[catch(400)]
fn bad_request(req: &Request) -> Json<Value> {
    Json(serde_json::json!({
        "success": false,
        "message": format!("Bad request: {}", req.uri())
    }))
}

#[catch(404)]
fn not_found(req: &Request) -> Json<Value> {
    Json(serde_json::json!({
        "success": false,
        "message": format!("Resource not found: {}", req.uri())
    }))
}

#[catch(422)]
fn unprocessable_entity(_req: &Request) -> Json<Value> {
    Json(serde_json::json!({
        "success": false,
        "message": "Invalid request data. Please check your input."
    }))
}

#[catch(429)]
fn too_many_requests(_req: &Request) -> Json<Value> {
    Json(serde_json::json!({
        "success": false,
        "message": "Too many requests. Please slow down and try again shortly."
    }))
}

#[catch(500)]
fn internal_error(_req: &Request) -> Json<Value> {
    Json(serde_json::json!({
        "success": false,
        "message": "Internal server error. Please try again later."
    }))
}

/// CORS preflight handler
#[rocket::options("/<_..>")]
async fn options_handler() -> &'static str {
    ""
}
