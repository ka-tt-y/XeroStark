-- migrate:down
DROP INDEX IF EXISTS idx_deployments_contract_address;
DROP INDEX IF EXISTS idx_deployments_circuit_status;
DROP TABLE IF EXISTS deployments CASCADE;
DROP TYPE IF EXISTS deployment_status_;
DROP TYPE IF EXISTS deployment_type_;