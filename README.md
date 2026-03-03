<div align="center">

# XEROSTARK

### Zero-Knowledge Proofs on Starknet — No Gas, No Hassle

[![Rust](https://img.shields.io/badge/Backend-Rust%20%2F%20Rocket-orange?logo=rust)](backend/)
[![React](https://img.shields.io/badge/Frontend-React%20%2F%20TypeScript-blue?logo=react)](frontend/)
[![Starknet](https://img.shields.io/badge/Network-Starknet%20Sepolia-purple)](https://sepolia.voyager.online)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED?logo=docker)](docker-compose.yml)

</div>

---

XeroStark is an end-to-end platform for creating, deploying, and verifying zero-knowledge proofs on Starknet. Write a Circom circuit (or pick a template), compile it, generate a Groth16 proof in your browser, and verify it on-chain — all with **gasless transactions** via Avnu paymaster sponsorship.

## Features

- **Circuit Templates** — A few Pre-built circuits  with AI-generated descriptions
- **Custom Circuit Upload** — Lets user upload any Circom 2.x circuit and compile it on the server
- **Groth16 Proving** — Generate zero-knowledge proofs entirely server-side with snarkjs
- **On-Chain Verification** — Deploy a Starknet verifier contract (via [Garaga](https://github.com/keep-starknet-strange/garaga)) and verify proofs on-chain
- **Gasless Transactions** — All on-chain operations are sponsored through Avnu paymaster. Users pay zero gas
- **Wallet Integration** — Connect with Argent, Braavos, or Cartridge Controller
- **Proof Sharing** — Generate shareable links to verified proofs
- **Poseidon Hash Helper** — Built-in tool for computing Poseidon hashes needed by circuits
- **Dark/Light Theme UI** — Clean, modern interface built with Tailwind CSS

## How It Works

1. User uploads a Circom circuit (or selects a template)
2. Backend compiles with `circom`, runs Groth16 trusted setup with `snarkjs`, generates a Starknet verifier contract with `garaga`, compiles it with `scarb`, and declares the class on Starknet
3. Frontend deploys the verifier contract using the user's wallet (gasless via paymaster)
4. User enters inputs and backend generates a Groth16 proof with `snarkjs`
5. Backend generates calldata with `garaga` and the frontend submits an on-chain verification tx (also gasless)
6. User can generate a shareable link to their verified proof

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend   │────▶│     Backend      │────▶│  PostgreSQL  │
│  React/Vite  │     │  Rust / Rocket   │     │    16-alpine │
│   (nginx)    │     │                  │     └──────────────┘
└──────┬───────┘     │  ┌────────────┐  │
       │             │  │  circom    │  │     ┌──────────────┐
       │             │  │  snarkjs   │  │────▶│   Starknet   │
       │             │  │  garaga    │  │     │   Sepolia     │
       │             │  │  scarb     │  │     └──────────────┘
       │             │  └────────────┘  │
       │             └──────────────────┘
       │                                      ┌──────────────┐
       └─────────────────────────────────────▶│ Avnu Paymaster│
                  (proxied via backend)        └──────────────┘
```

## Quick Start
Visit https://xerostark.xyz to test it out. You can also run it locally by following the steps below.

### Using Docker

#### 1. Clone

```bash
git clone https://github.com/ka-tt-y/XeroStark.git
cd Xerostark
```

#### 2. Configure environment

Create a `.env` file in the project root:

```env
# Database
DB_PASSWORD=your_secure_password
DB_USER=xerostark          # optional, default: xerostark
DB_NAME=xerostark          # optional, default: xerostark

# Starknet (Sepolia testnet)
SEPOLIA_ACCOUNT_PRIVATE_KEY=0x...
SEPOLIA_ACCOUNT_ADDRESS=0x...
SEPOLIA_RPC_URL=https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/YOUR_KEY

# Avnu Paymaster
AVNU_PAYMASTER_API_KEY=your_avnu_api_key

# Groq LLM
GROQ_API_KEY=your_groq_api_key

# Optional overrides
FRONTEND_PORT=8080         # default: 8080
BACKEND_PORT=4000          # default: 4000
FRONTEND_URL=http://localhost:8080
```

#### 3. Build & Run

```bash
docker compose up --build -d
```

The first build takes ~10 minutes. Subsequent builds are cached.

#### 4. Open

- **Frontend:** [http://localhost:8080](http://localhost:8080)
- **Backend API:** [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

### Local Development

#### Backend (Rust)

```bash
cd backend

# Install prerequisites locally (macOS)
brew install circom
npm install -g snarkjs
pip install garaga
curl -sL https://docs.swmansion.com/scarb/install.sh | sh -s -- -v 2.14.0

# Set up database
cp .env.example .env   # edit with your DB credentials
sqlx migrate run

# Run
cargo run
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`.

## API Reference

All endpoints are prefixed with `/api/v1`.

### Core Flow

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/setup` | Upload & compile a Circom circuit, run Groth16 trusted setup, generate & declare Starknet verifier |
| `POST` | `/prove` | Generate a Groth16 proof for given inputs |
| `POST` | `/verify` | Generate calldata for on-chain verification |
| `POST` | `/verify/confirm` | Record a verified proof after on-chain tx |
| `POST` | `/register-deployment` | Register a deployed verifier contract |

### Circuits & Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/templates` | List circuit templates (triggers AI description backfill) |
| `GET` | `/template-files` | List template source files |
| `GET` | `/circuit-source/<name>` | Get circuit source code |
| `GET` | `/circuit/<hash>` | Get circuit details by hash |
| `GET` | `/circuits/public` | List all publicly deployed circuits |
| `GET` | `/stats` | Platform statistics |

### User Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/user/circuits?address=` | User's circuits |
| `GET` | `/user/proofs?address=` | User's proofs |
| `GET` | `/user/deployments?address=` | User's deployments |

### Sharing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/proofs/<id>/share` | Generate a share token/link |
| `GET` | `/proofs/shared/<token>` | View a shared proof |

### Paymaster

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/paymaster` | Proxy to Avnu paymaster (injects API key server-side) |



