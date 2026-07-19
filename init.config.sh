#!/usr/bin/env bash
# init.config.sh — Comandos específicos del proyecto. Editar al instalar.

PROJECT_NAME="ODC"

# Binarios que deben existir en PATH
# node es necesario para las verificaciones de feature_list.json en init.sh
REQUIRED_TOOLS=("node")

# Variables de entorno críticas, ej: ("DATABASE_URL" "JWT_SECRET")
REQUIRED_ENV_VARS=()

# Stack aún por definir — rellenar cuando el proyecto tenga manifest
INSTALL_CMD=""
BUILD_CMD=""
TEST_CMD=""
LINT_CMD=""    # vacío = saltar
