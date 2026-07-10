#!/bin/bash
# Wrapper — delegates to the canonical install script (Docker build mode)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/../../scripts/install-nginx-modsecurity.sh" --docker-build "$@"
