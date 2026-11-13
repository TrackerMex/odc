#!/usr/bin/env bash
# init.config.sh — Verificación completa; la preparación es un comando explícito.

PROJECT_NAME="ODC"

# Corepack selecciona el pnpm exacto del proyecto, sin depender del pnpm global.
REQUIRED_TOOLS=("node" "corepack")
REQUIRED_ENV_VARS=("DATABASE_URL" "JWT_SECRET")

# Guard de solo lectura: nunca instala. Para preparar: node scripts/dependencies.cjs setup backend
INSTALL_CMD="node scripts/dependencies.cjs check backend && node scripts/dependencies.cjs check frontend"
BUILD_CMD="(cd backend && COREPACK_ENABLE_NETWORK=0 corepack pnpm@10.34.6 build) && (cd frontend && COREPACK_ENABLE_NETWORK=0 corepack pnpm@10.34.6 build)"
TEST_CMD="node --test scripts/*.test.cjs && (cd backend && COREPACK_ENABLE_NETWORK=0 corepack pnpm@10.34.6 test --runInBand) && (cd frontend && COREPACK_ENABLE_NETWORK=0 corepack pnpm@10.34.6 test --passWithNoTests --pool=threads --maxWorkers=2)"
LINT_CMD="(cd backend && COREPACK_ENABLE_NETWORK=0 corepack pnpm@10.34.6 lint)"
