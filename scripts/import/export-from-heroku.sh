#!/usr/bin/env bash
# Exports the Rails site's database into ./dump using your Heroku login (~/.netrc, as written by
# `heroku login`), then lists the weekly PDFs to copy. Read-only: nothing on Heroku changes.
# The files contain member personal data: dump/ is git-ignored, delete it when you are done.
#
# Usage (from WSL, where psql is installed):
#   bash scripts/import/export-from-heroku.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

app="${HEROKU_APP:-caten-church}"
if [ "${1:-}" = "--stdin" ]; then
  # export-from-heroku.ps1 pipes in `heroku config:get DATABASE_URL` from the Windows CLI
  IFS= read -r DATABASE_URL || true
  DATABASE_URL="${DATABASE_URL%$'\r'}"
else
  config=$(curl -sf --netrc -H 'Accept: application/vnd.heroku+json; version=3' \
    "https://api.heroku.com/apps/$app/config-vars") || {
    echo "Could not read the Heroku config of $app. Log in with \`heroku login\` first," >&2
    echo "or log in on Windows and run scripts/import/export-from-heroku.ps1 instead." >&2
    exit 1
  }
  DATABASE_URL=$(printf '%s' "$config" | sed -n 's/.*"DATABASE_URL": *"\([^"]*\)".*/\1/p')
fi
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set on $app" >&2
  exit 1
fi
export DATABASE_URL
# Heroku Postgres only accepts encrypted connections
case "$DATABASE_URL" in *sslmode=*) ;; *\?*) DATABASE_URL="$DATABASE_URL&sslmode=require" ;; *) DATABASE_URL="$DATABASE_URL?sslmode=require" ;; esac

bash scripts/import/export-postgres.sh dump
echo
echo "Done. Tell Claude the export is in dump/."
