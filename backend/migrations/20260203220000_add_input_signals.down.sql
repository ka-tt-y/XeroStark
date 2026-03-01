-- Remove input_signals column from proof_artifacts table
ALTER TABLE proof_artifacts DROP COLUMN IF EXISTS input_signals;
