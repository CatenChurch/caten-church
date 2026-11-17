#!/usr/bin/env bash
# Copies the weekly PDFs listed in dump/pdf-copies.tsv (written by build-sql.ts) from the
# Rails site's GCS bucket to R2, in two steps so each can run where its tool is installed:
#
#   bash scripts/import/copy-pdfs.sh download           # needs gcloud; files go to dump/pdfs/
#   bash scripts/import/copy-pdfs.sh upload [--local]   # needs wrangler; checks each MD5 first
#
# Both steps can be run again: downloads skip files already there, uploads overwrite.
# Uploads run JOBS at a time (default 6).
set -euo pipefail
cd "$(dirname "$0")/../.."

step="${1:-}"
target="--remote"
[ "${2:-}" = "--local" ] && target="--local"
bucket_gcs="${GCS_BUCKET:-caten-church}"
bucket_r2="${R2_BUCKET:-caten-church}"
wrangler="${WRANGLER:-pnpm exec wrangler}"
jobs="${JOBS:-6}"
work="dump/pdfs"
mkdir -p "$work"
results=$(mktemp)
trap 'rm -f "$results"' EXIT

upload_one() {
  local from="$1" to="$2" size="$3" md5="$4" file="$work/$1" actual
  actual=$(openssl dgst -md5 -binary "$file" | base64)
  if [ "$actual" != "$md5" ] || [ "$(wc -c <"$file" | tr -d ' ')" != "$size" ]; then
    echo "MISMATCH $from -> $to (checksum or size differs)" >&2
    echo fail >>"$results"
  elif $wrangler r2 object put "$bucket_r2/$to" --file "$file" \
    --content-type application/pdf "$target" >/dev/null 2>&1; then
    echo ok >>"$results"
  else
    echo "UPLOAD FAILED $to" >&2
    echo fail >>"$results"
  fi
}

case "$step" in
  download | upload) ;;
  *)
    echo "usage: copy-pdfs.sh download | upload [--local]" >&2
    exit 2
    ;;
esac

while IFS=$'\t' read -r from to size md5; do
  [ -z "$from" ] && continue
  if [ "$step" = download ]; then
    if [ -f "$work/$from" ] || gcloud storage cp --quiet "gs://$bucket_gcs/$from" "$work/$from"; then
      echo ok >>"$results"
    else
      echo fail >>"$results"
    fi
  else
    while [ "$(jobs -rp | wc -l)" -ge "$jobs" ]; do wait -n || true; done
    upload_one "$from" "$to" "$size" "$md5" &
  fi
done <dump/pdf-copies.tsv
wait

ok=$(grep -c '^ok$' "$results" || true)
failed=$(grep -c '^fail$' "$results" || true)
echo "$step: $ok ok, $failed failed"
[ "$failed" -eq 0 ]
