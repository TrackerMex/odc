BEGIN;
CREATE TABLE IF NOT EXISTS auth_login_attempts (
  key varchar(66) PRIMARY KEY,
  attempts integer NOT NULL,
  "expiresAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_login_attempts_expiry ON auth_login_attempts ("expiresAt");
COMMIT;
