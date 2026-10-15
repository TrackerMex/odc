-- Apply with writes stopped, then restart every backend before reopening writes.
-- A prior backend can overwrite rows without incrementing this version.
BEGIN;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;
COMMIT;
