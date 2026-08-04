#!/usr/bin/env bash
# Putzerfisch-Deploy – läuft auf dem Server, aufgerufen von GitHub Actions
# per SSH (oder manuell). Idempotent: kann beliebig oft laufen.
#
#   git pull -> Image bauen -> Container neu starten -> Healthcheck
#   Schlägt der Healthcheck fehl, wird auf das vorherige Image zurückgerollt.
set -euo pipefail

cd "$(dirname "$0")/.."   # Projekt-Root (/opt/putzerfisch)

echo "==> Code aktualisieren"
git pull --ff-only origin main

echo "==> Datenverzeichnis sicherstellen (DB + Uploads)"
mkdir -p data

echo "==> Vorheriges Image sichern (für Rollback)"
docker tag putzerfisch-app:latest putzerfisch-app:previous 2>/dev/null || true

echo "==> Image bauen"
docker compose build app

echo "==> Container neu starten"
docker compose up -d

echo "==> Healthcheck (max. 60 s)"
for i in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:4321/api/health >/dev/null 2>&1; then
    echo "==> OK: App läuft."
    docker image prune -f >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 3
done

echo "==> Healthcheck fehlgeschlagen – Rollback auf vorheriges Image"
docker tag putzerfisch-app:previous putzerfisch-app:latest
docker compose up -d --no-build --force-recreate

if curl -fsS http://127.0.0.1:4321/api/health >/dev/null 2>&1; then
  echo "==> Rollback erfolgreich – neues Image war defekt."
else
  echo "==> ROLLBACK FEHLGESCHLAGEN – bitte manuell prüfen (docker compose ps / logs)."
fi
exit 1
