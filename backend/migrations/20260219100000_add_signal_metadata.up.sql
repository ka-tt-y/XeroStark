-- Add columns for output signals, public input signals and their LLM descriptions.
-- These are populated once at setup time so the viewer never needs a live LLM call.

ALTER TABLE proof_artifacts
    ADD COLUMN IF NOT EXISTS output_signals        TEXT[]  DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS public_input_signals   TEXT[]  DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS output_descriptions    JSONB   DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS public_input_descriptions JSONB DEFAULT '{}';
