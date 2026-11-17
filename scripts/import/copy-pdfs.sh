#!/usr/bin/env bash
# Copies the weekly PDFs listed in dump/pdf-copies.tsv (written by build-sql.ts) from the
# Rails site's GCS bucket to R2, in two steps so each can run where its tool is installed:
#
#   bash scripts/import/copy-pdfs.sh download           # needs gcloud; files go to dump/pdfs/
#   bash scripts/import/copy-pdfs.sh upload [--local]   # needs wrangler; checks each MD5 first
#
# Both steps can be run again: downloads skip files already there, uploads overwrite.
set -euo pipefail
cd "$(dirname "$0")/../.."

step="${1:-}"
target="--remote"
[ "${2:-}" = "--local" ] && target="--local"
bucket_gcs="${GCS_BUCKET:-caten-church}"
bucket_r2="${R2_BUCKET:-caten-church}"
wrangler="${WRANGLER:-pnpm exec wrangler}"
work="dump/pdfs"
mkdir -p "$work"

done_count=0
failed=0
while IFS=$'\t' read -r from to size md5; do
  [ -z "$from" ] && continue
  file="$work/$from"
  case "$step" in
    download)
      [ -f "$file" ] || gcloud storage cp --quiet "gs://$bucket_gcs/$from" "$file"
      done_count=$((done_count + 1))
      ;;
    upload)
      actual=$(openssl dgst -md5 -binary "$file" | base64)
      if [ "$actual" != "$md5" ] || [ "$(wc -c <"$file" | tr -d ' ')" != "$size" ]; then
        echo "MISMATCH $from -> $to (checksum or size differs)" >&2
        failed=$((failed + 1))
        continue
      fi
      if $wrangler r2 object put "$bucket_r2/$to" --file "$file" \
        --content-type application/pdf "$target" >/dev/null 2>&1; then
        done_count=$((done_count + 1))
      else
        echo "UPLOAD FAILED $to" >&2
        failed=$((failed + 1))
      fi
      ;;
    *)
      echo "usage: copy-pdfs.sh download | upload [--local]" >&2
      exit 2
      ;;
  esac
done <dump/pdf-copies.tsv

echo "$step: $done_count ok, $failed failed"
[ "$failed" -eq 0 ]
