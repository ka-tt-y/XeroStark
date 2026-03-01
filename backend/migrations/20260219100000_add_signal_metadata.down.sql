ALTER TABLE proof_artifacts
    DROP COLUMN IF EXISTS output_signals,
    DROP COLUMN IF EXISTS public_input_signals,
    DROP COLUMN IF EXISTS output_descriptions,
    DROP COLUMN IF EXISTS public_input_descriptions;
