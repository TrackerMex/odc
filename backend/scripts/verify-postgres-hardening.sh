#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
odc_test_name="odc-hardening-test-$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')"
odc_test_container="$(docker run --rm -d --name "$odc_test_name" \
  -e POSTGRES_USER=odc_test -e POSTGRES_PASSWORD=odc_test -e POSTGRES_DB=odc_test \
  -p 127.0.0.1::5432 postgres:16-alpine)"
trap 'docker rm -f "$odc_test_container" >/dev/null' EXIT
for attempt in {1..40}; do
  if docker exec "$odc_test_container" pg_isready -U odc_test -d odc_test >/dev/null 2>&1; then break; fi
  if [[ "$attempt" == 40 ]]; then echo 'Isolated test PostgreSQL did not start.' >&2; exit 1; fi
  sleep 1
done
odc_test_port="$(docker port "$odc_test_container" 5432/tcp | cut -d: -f2)"
export ODC_TEST_DATABASE_URL="postgres://odc_test:odc_test@127.0.0.1:$odc_test_port/odc_test"
if [[ "$#" == 0 ]]; then set -- odc-concurrent-updates.e2e-spec.ts; fi
pnpm exec jest --config ./test/jest-e2e.json --runInBand "$@"
