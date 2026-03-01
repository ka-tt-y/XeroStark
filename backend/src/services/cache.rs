//! In-memory template cache backed by the database.
//!
//! Templates are loaded once at startup and refreshed automatically
//! when the TTL expires or when explicitly invalidated after writes.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use tokio::sync::RwLock;
use tracing::info;

use crate::db::Db;

/// Returned by the `/circuits/files` endpoint.
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct CircomFile {
    pub path: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

const CACHE_TTL: Duration = Duration::from_secs(86_400); // 24 hours

struct CacheInner {
    files: Vec<CircomFile>,
    code_by_path: HashMap<String, String>,
    last_refreshed: Instant,
}

/// Thread-safe, read-optimised template cache.
pub struct TemplateCache {
    inner: RwLock<CacheInner>,
}

impl TemplateCache {
    /// Build the initial cache by reading templates from the database.
    pub async fn load(db: &Db) -> Self {
        let (files, code_by_path) = Self::fetch_from_db(db).await;
        TemplateCache {
            inner: RwLock::new(CacheInner {
                files,
                code_by_path,
                last_refreshed: Instant::now(),
            }),
        }
    }

    /// Force-refresh the cache (e.g. after a backfill write).
    pub async fn invalidate(&self, db: &Db) {
        let (files, code_by_path) = Self::fetch_from_db(db).await;
        let mut guard = self.inner.write().await;
        guard.files = files;
        guard.code_by_path = code_by_path;
        guard.last_refreshed = Instant::now();
        info!(
            "Template cache invalidated & refreshed ({} entries)",
            guard.files.len()
        );
    }

    /// Return the cached file list.
    ///
    /// If the cache is stale, it is refreshed.
    pub async fn get_files(&self, db: &Arc<Db>) -> Vec<CircomFile> {
        let guard = self.inner.read().await;
        let stale = guard.last_refreshed.elapsed() > CACHE_TTL;
        let files = guard.files.clone();
        drop(guard);

        if stale {
            let (new_files, new_code) = Self::fetch_from_db(db).await;
            let mut guard = self.inner.write().await;

            if guard.last_refreshed.elapsed() > CACHE_TTL {
                guard.files = new_files;
                guard.code_by_path = new_code;
                guard.last_refreshed = Instant::now();
                info!(
                    "Template cache auto-refreshed ({} entries)",
                    guard.files.len()
                );
            }
        }

        files
    }

    /// Look up circuit source code by path from the cache.
    pub async fn get_code(&self, path: &str) -> Option<String> {
        let guard = self.inner.read().await;
        guard.code_by_path.get(path).cloned()
    }

    async fn fetch_from_db(db: &Db) -> (Vec<CircomFile>, HashMap<String, String>) {
        let mut files: Vec<CircomFile> = Vec::new();
        let mut code_by_path: HashMap<String, String> = HashMap::new();

        // 1. Built-in templates
        if let Ok(templates) = db.get_circuits().await {
            for t in templates {
                let path = t
                    .source_path
                    .clone()
                    .unwrap_or_else(|| format!("builtin/{}", t.hash));
                files.push(CircomFile {
                    path: path.clone(),
                    name: t.name.unwrap_or_else(|| "Unknown".to_string()),
                    description: t.description,
                });
                if let Some(code) = t.code {
                    code_by_path.insert(path, code);
                }
            }
        }

        // 2. User-uploaded public circuits with confirmed deployments
        if let Ok(public_circuits) = db.get_public_circuits().await {
            let existing: std::collections::HashSet<String> =
                files.iter().map(|f| f.path.clone()).collect();

            for circuit in public_circuits {
                let path = format!("user/{}", circuit.hash);
                if existing.contains(&path) {
                    continue;
                }
                files.push(CircomFile {
                    path,
                    name: circuit
                        .name
                        .unwrap_or_else(|| format!("circuit_{}", &circuit.hash[..8])),
                    description: circuit.description,
                });
            }
        }

        (files, code_by_path)
    }
}
