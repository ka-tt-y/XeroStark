CREATE TYPE proof_verification_status_ AS ENUM ('pending', 'verified', 'failed');

CREATE TABLE IF NOT EXISTS proofs (
    id SERIAL PRIMARY KEY NOT NULL,
    circuit_id INTEGER REFERENCES circuits(id) ON DELETE CASCADE NOT NULL,
    proof_data JSONB NOT NULL,
    calldata TEXT, -- Proof calldata for contract verification
    tx_hash VARCHAR(128),
    tx_status VARCHAR(32),
    public_inputs JSONB,
    verification_status proof_verification_status_ DEFAULT 'pending' NOT NULL,
    shared_token VARCHAR(64) UNIQUE, -- For shareable verification links
    created_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for finding proofs by circuit
CREATE INDEX idx_proofs_circuit_id ON proofs(circuit_id, created_at DESC);
-- Index for shared token lookups
CREATE INDEX idx_proofs_shared_token ON proofs(shared_token) WHERE shared_token IS NOT NULL;