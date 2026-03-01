CREATE TYPE deployment_type_ AS ENUM ('system', 'user');
CREATE TYPE deployment_status_ AS ENUM ('pending', 'confirmed', 'failed');

CREATE TABLE IF NOT EXISTS deployments (
    id SERIAL PRIMARY KEY NOT NULL,
    circuit_id INTEGER REFERENCES circuits(id) ON DELETE CASCADE NOT NULL,
    deployment_type deployment_type_ NOT NULL,
    deployed_by_address VARCHAR(128),
    tx_hash VARCHAR(128),
    contract_address VARCHAR(128),
    class_hash VARCHAR(128), -- Starknet class hash from declaration
    available_endpoints TEXT[], -- Array of available endpoints
    status deployment_status_ DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for finding latest successful deployment by circuit_id
CREATE INDEX idx_deployments_circuit_status ON deployments(circuit_id, status, created_at DESC);
-- Index for looking up by contract address
CREATE INDEX idx_deployments_contract_address ON deployments(contract_address);