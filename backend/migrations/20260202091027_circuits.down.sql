-- migrate:down
DROP INDEX IF EXISTS idx_circuits_hash;
DROP TABLE IF EXISTS circuits CASCADE;
DROP TYPE IF EXISTS circuit_type_;