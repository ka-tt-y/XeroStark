-- migrate:down
DROP INDEX IF EXISTS idx_proof_artifacts_circuit_id;
DROP TABLE IF EXISTS proof_artifacts CASCADE;