#!/usr/bin/env bash
# Start the root docker compose stack, automatically remapping any host ports
# that are already allocated.
#
# Usage:
#   ./scripts/compose-up.sh
#   ./scripts/compose-up.sh --build -d
#   ./scripts/compose-up.sh down -v

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARGS=("$@")
if [[ ${#ARGS[@]} -eq 0 ]]; then
  ARGS=(up --build)
fi

# Port allocation only matters when publishing ports (up / run / create).
NEED_PORTS=1
case "${ARGS[0]}" in
  down|stop|kill|rm|logs|ps|config|images|version|help)
    NEED_PORTS=0
    ;;
esac

if (( NEED_PORTS )); then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/scripts/allocate-ports.sh"
fi

COMPOSE_FILES=(--env-file .env)
if [[ -f .env.docker.ports ]]; then
  COMPOSE_FILES+=(--env-file .env.docker.ports)
fi

exec docker compose "${COMPOSE_FILES[@]}" "${ARGS[@]}"
