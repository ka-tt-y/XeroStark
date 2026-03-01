-- Add source_path column to circuits table for tracking GitHub-sourced templates
ALTER TABLE circuits ADD COLUMN IF NOT EXISTS source_path VARCHAR(512) DEFAULT NULL;
