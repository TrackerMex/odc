#!/usr/bin/env bash
# init.config.sh — Comandos específicos del proyecto. Editar al instalar.

PROJECT_NAME="ODC"

# Binarios que deben existir en PATH
# node es necesario para las verificaciones de feature_list.json en init.sh
REQUIRED_TOOLS=("node" "pnpm")

# Variables de entorno críticas
REQUIRED_ENV_VARS=("DATABASE_URL" "JWT_SECRET")

INSTALL_CMD="(cd backend && pnpm install) && (cd frontend && pnpm install)"
BUILD_CMD="(cd backend && pnpm build) && (cd frontend && pnpm build)"
TEST_CMD="(cd backend && pnpm test) && (cd frontend && pnpm test --passWithNoTests)"
LINT_CMD="(cd backend && pnpm lint)"
