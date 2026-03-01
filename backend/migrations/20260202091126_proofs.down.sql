-- migrate:down
DROP INDEX IF EXISTS idx_proofs_shared_token;
DROP INDEX IF EXISTS idx_proofs_circuit_id;
DROP TABLE IF EXISTS proofs CASCADE;
DROP TYPE IF EXISTS proof_verification_status_;