//! Simple in-memory rate limiter using Rocket request fairing.

use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::Arc;
use std::time::{Duration, Instant};

use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::Status;
use rocket::{Data, Request};
use tokio::sync::Mutex;
use tracing::warn;

/// Per-IP bucket.
struct Bucket {
    tokens: u32,
    last_refill: Instant,
}

/// Token-bucket rate limiter shared across all requests.
pub struct RateLimiter {
    buckets: Arc<Mutex<HashMap<IpAddr, Bucket>>>,
    /// Maximum tokens.
    capacity: u32,
    /// Tokens added per second.
    refill_rate: f64,
}

impl RateLimiter {
    pub fn new(requests_per_minute: u32) -> Self {
        Self {
            buckets: Arc::new(Mutex::new(HashMap::new())),
            capacity: requests_per_minute * 2, // allow 2× burst
            refill_rate: requests_per_minute as f64 / 60.0,
        }
    }
}

#[rocket::async_trait]
impl Fairing for RateLimiter {
    fn info(&self) -> Info {
        Info {
            name: "Rate Limiter",
            kind: Kind::Request,
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _data: &mut Data<'_>) {
        // Skip rate limiting for OPTIONS (CORS preflight) and health checks
        let path = request.uri().path().as_str();
        if request.method() == rocket::http::Method::Options || path == "/api/v1/health" {
            return;
        }

        let ip = match request.client_ip() {
            Some(ip) => ip,
            None => return, // can't rate-limit without an IP
        };

        // Heavier weight for write endpoints
        let cost: u32 = if path.contains("/setup")
            || path.contains("/prove")
            || path.contains("/verify")
        {
            5
        } else {
            1
        };

        let mut buckets = self.buckets.lock().await;
        let now = Instant::now();

        let bucket = buckets.entry(ip).or_insert(Bucket {
            tokens: self.capacity,
            last_refill: now,
        });

        // Refill tokens based on elapsed time
        let elapsed = now.duration_since(bucket.last_refill).as_secs_f64();
        let refill = (elapsed * self.refill_rate) as u32;
        if refill > 0 {
            bucket.tokens = (bucket.tokens + refill).min(self.capacity);
            bucket.last_refill = now;
        }

        if bucket.tokens >= cost {
            bucket.tokens -= cost;
        } else {
            warn!("Rate limit exceeded for IP: {} Try ", ip);
            // Set a local cache value the catcher can see
            request.local_cache(|| RateLimited(true));
        }

        // Periodic cleanup: remove stale entries (every ~100 requests)
        if buckets.len() > 1000 {
            let cutoff = now - Duration::from_secs(300);
            buckets.retain(|_, b| b.last_refill > cutoff);
        }
    }
}

pub struct RateLimited(pub bool);

use rocket::request::{FromRequest, Outcome};

#[rocket::async_trait]
impl<'r> FromRequest<'r> for &'r RateLimited {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let limited = request.local_cache(|| RateLimited(false));
        if limited.0 {
            Outcome::Error((Status::TooManyRequests, ()))
        } else {
            Outcome::Success(limited)
        }
    }
}
