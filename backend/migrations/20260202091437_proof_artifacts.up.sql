-- Add up migration script here
CREATE TABLE IF NOT EXISTS proof_artifacts (
    id SERIAL PRIMARY KEY,
    circuit_id INTEGER REFERENCES circuits(id) ON DELETE CASCADE UNIQUE,
    vk_json TEXT NOT NULL,
    wasm_path TEXT NOT NULL,
    zkey_path TEXT NOT NULL,
    witness_js_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups by circuit_id
CREATE INDEX idx_proof_artifacts_circuit_id ON proof_artifacts(circuit_id);
