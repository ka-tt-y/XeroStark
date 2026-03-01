# ─── Stage 1: Build the Rust backend ───────────────────────────────
FROM rust:1.84-bookworm AS builder

# Install system dependencies for circom compilation and snarkjs
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    curl \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install circom compiler
RUN git clone https://github.com/iden3/circom.git /tmp/circom \
    && cd /tmp/circom \
    && cargo build --release \
    && cp target/release/circom /usr/local/bin/circom \
    && rm -rf /tmp/circom

# Install snarkjs globally
RUN npm install -g snarkjs

WORKDIR /app

# Copy manifests first for dependency caching
COPY Cargo.toml Cargo.lock* ./

# Create a dummy main.rs to cache dependency compilation
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release 2>/dev/null || true
RUN rm -rf src

# Copy the actual source code
COPY src/ src/
COPY migrations/ migrations/

# Touch main.rs so cargo rebuilds it
RUN touch src/main.rs

# Build the actual application
RUN cargo build --release

# ─── Stage 2: Runtime image ───────────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    nodejs \
    npm \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install circom in runtime (needed for circuit compilation)
RUN git clone https://github.com/iden3/circom.git /tmp/circom \
    && cd /tmp/circom \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && . /root/.cargo/env \
    && cargo build --release \
    && cp target/release/circom /usr/local/bin/circom \
    && rm -rf /tmp/circom /root/.cargo /root/.rustup

# Install snarkjs globally
RUN npm install -g snarkjs

WORKDIR /app

# Copy the compiled binary
COPY --from=builder /app/target/release/backend /app/backend

# Copy ptau file (required for circuit setup)
COPY powersOfTau28_hez_final_15.ptau /app/powersOfTau28_hez_final_15.ptau

# Copy package.json and install circomlib (needed for circuit includes)
COPY package.json /app/package.json
RUN npm install --production

# Copy migrations for sqlx
COPY migrations/ /app/migrations/

# Create cache directory
RUN mkdir -p /app/xergo_cache

# Expose Rocket port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["/app/backend"]
