-- Add input_signals column to proof_artifacts table
ALTER TABLE proof_artifacts ADD COLUMN IF NOT EXISTS input_signals TEXT[] DEFAULT '{}';
