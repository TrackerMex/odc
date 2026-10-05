BEGIN;
CREATE TABLE IF NOT EXISTS odc_file_uploads (
  id uuid PRIMARY KEY,
  "orderId" uuid NOT NULL,
  "expectedVersion" integer NOT NULL,
  field varchar NOT NULL,
  "publicId" varchar NOT NULL UNIQUE,
  state varchar NOT NULL DEFAULT 'pending',
  "uploadConfirmed" boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  "lastOutcome" varchar,
  "nextAttemptAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS odc_file_uploads_due ON odc_file_uploads (state, "nextAttemptAt");
COMMIT;
