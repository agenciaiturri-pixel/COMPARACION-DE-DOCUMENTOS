#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
NODE_BIN="${NODE_BIN:-node}"

"${NODE_BIN}" "${PROJECT_ROOT}/scripts/seed-example.mjs" "$@"
