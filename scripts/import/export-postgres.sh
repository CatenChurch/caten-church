#!/usr/bin/env bash
# Exports the Rails site's Postgres tables as JSON lines into ./dump (read-only queries).
# The files contain member personal data: dump/ is git-ignored, delete it when you are done.
#
# Usage: DATABASE_URL=postgres://... scripts/import/export-postgres.sh
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL to the Rails database}"
out="${1:-dump}"
mkdir -p "$out"

export_rows() {
  psql "$DATABASE_URL" --no-psqlrc -At -v ON_ERROR_STOP=1 \
    -c "select row_to_json(t) from ($2) t" >"$out/$1.jsonl"
  echo "$1: $(wc -l <"$out/$1.jsonl") rows"
}

export_rows users "
  select u.id, u.email, u.confirmed_at, u.last_sign_in_at, u.created_at, u.updated_at,
         exists (
           select 1 from users_roles ur join roles r on r.id = ur.role_id
           where ur.user_id = u.id and r.name = 'admin' and r.resource_type is null
         ) as is_admin
  from users u order by u.id"
export_rows oauths "select id, user_id, provider, uid, created_at from oauths order by id"
export_rows profiles "select * from profiles order by id"
export_rows subscriptions "select * from subscriptions order by id"
export_rows groups "select * from groups order by id"
export_rows group_users "
  select gu.id, gu.group_id, gu.user_id, r.name as role, gu.created_at, gu.updated_at
  from group_users gu left join roles r on r.id = gu.role_id order by gu.id"
export_rows events "select * from events order by id"
export_rows event_users "select * from event_users order by id"
export_rows weeklies "select * from weeklies order by id"
export_rows weekly_pdfs "
  select a.record_id as weekly_id, b.key, b.filename, b.byte_size, b.checksum
  from active_storage_attachments a join active_storage_blobs b on b.id = a.blob_id
  where a.record_type = 'Weekly' and a.name = 'pdf' order by a.id"
