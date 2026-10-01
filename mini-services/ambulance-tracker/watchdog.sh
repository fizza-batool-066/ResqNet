#!/bin/bash
# Watchdog wrapper for the ambulance-tracker mini-service.
# Restarts the service if it dies. Used so the WebSocket stays alive across
# sandbox session restarts.
set -u

SERVICE_DIR="/home/z/my-project/mini-services/ambulance-tracker"
LOG_FILE="/tmp/ambulance-tracker.log"

# Kill any existing process listening on port 3003
if command -v lsof >/dev/null 2>&1; then
  EXISTING_PID=$(lsof -ti:3003 2>/dev/null || true)
  if [ -n "$EXISTING_PID" ]; then
    kill -9 "$EXISTING_PID" 2>/dev/null || true
    sleep 1
  fi
fi

cd "$SERVICE_DIR"

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting ambulance-tracker…" >> "$LOG_FILE"
  bun index.ts >> "$LOG_FILE" 2>&1
  EXIT_CODE=$?
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ambulance-tracker exited (code $EXIT_CODE). Restarting in 3s…" >> "$LOG_FILE"
  sleep 3
done
