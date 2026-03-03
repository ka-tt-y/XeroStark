use std::env::current_dir;
use std::path::PathBuf;
use std::sync::Arc;

use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::Header;
use rocket::{Request, Response};
use tokio::sync::Mutex;

/// CORS fairing — adds permissive CORS headers to every response.
pub struct Cors;

#[rocket::async_trait]
impl Fairing for Cors {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, _request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new(
            "Access-Control-Allow-Methods",
            "POST, GET, OPTIONS, DELETE",
        ));
        response.set_header(Header::new(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization",
        ));
    }
}

/// Shared application state for the circom toolchain.
#[derive(Clone)]
pub struct AppState {
    pub cache_dir: Arc<Mutex<PathBuf>>,
    pub ptau_path: PathBuf,
    /// Directories passed via `-l` to the circom compiler so that
    /// `include` statements (e.g. circomlib) resolve correctly.
    pub circom_libs: Vec<PathBuf>,
    pub http_client: reqwest::Client,
    /// Base URL of the frontend (for generating share links)
    pub frontend_url: String,
}

impl AppState {
    pub fn new(ptau_path: PathBuf) -> Self {
        let cache_dir = {
            let mut dir = current_dir().expect("Failed to return current dir");
            dir.push("xergo_cache");
            std::fs::create_dir_all(&dir).expect("Failed to create cache directory");
            dir
        };

        // Clean up stale temp directories from previous runs
        if let Ok(entries) = std::fs::read_dir(&cache_dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with("temp_prove") || name.starts_with("temp_verify") {
                    let _ = std::fs::remove_dir_all(entry.path());
                    tracing::info!("Cleaned up stale temp dir: {}", name);
                }
            }
        }

        // Build list of circom include paths for `-l` flags.
        let cwd = current_dir().expect("Failed to get cwd");
        let node_modules = cwd.join("node_modules");
        let circomlib_circuits = node_modules.join("circomlib").join("circuits");

        let mut circom_libs: Vec<PathBuf> = Vec::new();
        if node_modules.is_dir() {
            circom_libs.push(node_modules);
        }
        if circomlib_circuits.is_dir() {
            circom_libs.push(circomlib_circuits.clone());
            if let Ok(entries) = std::fs::read_dir(&circomlib_circuits) {
                for entry in entries.flatten() {
                    if entry.path().is_dir() {
                        circom_libs.push(entry.path());
                    }
                }
            }
        }

        let http_client = reqwest::Client::builder()
            .user_agent("xerostark/0.1.0")
            .build()
            .expect("Failed to build HTTP client");

        let frontend_url =
            std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());

        Self {
            cache_dir: Arc::new(Mutex::new(cache_dir)),
            ptau_path,
            circom_libs,
            http_client,
            frontend_url,
        }
    }
}
