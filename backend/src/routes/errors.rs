//! Centralized error type for route handlers.

use rocket::Request;
use rocket::http::Status;
use rocket::response::{self, Responder};

use crate::routes::response::json_error;

#[derive(Debug)]
pub struct AppError {
    pub status: Status,
    pub message: String,
}

impl AppError {
    pub fn not_found(msg: impl Into<String>) -> Self {
        Self {
            status: Status::NotFound,
            message: msg.into(),
        }
    }

    pub fn bad_request(msg: impl Into<String>) -> Self {
        Self {
            status: Status::BadRequest,
            message: msg.into(),
        }
    }

    pub fn internal(msg: impl Into<String>) -> Self {
        Self {
            status: Status::InternalServerError,
            message: msg.into(),
        }
    }
}

/// Rocket `Responder` — returns a JSON error body with the appropriate HTTP status.
impl<'r> Responder<'r, 'static> for AppError {
    fn respond_to(self, req: &'r Request<'_>) -> response::Result<'static> {
        json_error(self.status, &self.message).respond_to(req)
    }
}

impl From<crate::db::errors::DatabaseError> for AppError {
    fn from(err: crate::db::errors::DatabaseError) -> Self {
        tracing::error!("Database error: {}", err);
        Self {
            status: Status::InternalServerError,
            message: format!("Database error: {}", err),
        }
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        tracing::error!("JSON error: {}", err);
        Self {
            status: Status::BadRequest,
            message: format!("Invalid JSON: {}", err),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        tracing::error!("IO error: {}", err);
        Self {
            status: Status::InternalServerError,
            message: "Internal server error".to_string(),
        }
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        tracing::error!("HTTP client error: {}", err);
        Self {
            status: Status::BadGateway,
            message: format!("External service error: {}", err),
        }
    }
}

impl From<String> for AppError {
    fn from(msg: String) -> Self {
        Self {
            status: Status::InternalServerError,
            message: msg,
        }
    }
}

impl From<&str> for AppError {
    fn from(msg: &str) -> Self {
        Self {
            status: Status::InternalServerError,
            message: msg.to_string(),
        }
    }
}

impl From<Box<dyn std::error::Error>> for AppError {
    fn from(err: Box<dyn std::error::Error>) -> Self {
        tracing::error!("Error: {}", err);
        Self {
            status: Status::InternalServerError,
            message: format!("{}", err),
        }
    }
}
