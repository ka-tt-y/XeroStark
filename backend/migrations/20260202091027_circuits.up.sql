-- migrate:up
CREATE TYPE circuit_type_ AS ENUM ('circom', 'noir');
CREATE TABLE IF NOT EXISTS circuits (
    id SERIAL PRIMARY KEY,
    hash VARCHAR(128) NOT NULL UNIQUE,
    name VARCHAR(128),
    description TEXT,
    code TEXT,
    circuit_type circuit_type_ NOT NULL,
    created_by VARCHAR(128),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups by hash (primary cache key)
CREATE INDEX idx_circuits_hash ON circuits(hash);
