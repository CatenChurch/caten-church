/**
 * Reads the JSON-lines export in ./dump and writes:
 *   import.sql              rows for D1 (`wrangler d1 execute caten-church --file import.sql`)
 *   dump/pdf-copies.tsv     GCS key → R2 key for every weekly PDF
 *
 * Usage: node scripts/import/build-sql.ts [dump-dir]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildImport, DUMP_TABLES, type Dump, type Row } from './transform.ts';

const dir = process.argv[2] ?? 'dump';

function readRows(table: string): Row[] {
  return readFileSync(join(dir, `${table}.jsonl`), 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as Row);
}

const dump = Object.fromEntries(
  DUMP_TABLES.map((table) => [table, readRows(table)]),
) as unknown as Dump;
const result = buildImport(dump);

writeFileSync('import.sql', result.statements.join('\n') + '\n');
writeFileSync(
  join(dir, 'pdf-copies.tsv'),
  result.pdfCopies.map((c) => [c.from, c.to, c.size, c.md5Base64].join('\t')).join('\n') + '\n',
);

console.log('Rows written to import.sql:');
for (const [table, n] of Object.entries(result.counts)) console.log(`  ${table}: ${n}`);
console.log(`Weekly PDFs to copy: ${result.pdfCopies.length} (dump/pdf-copies.tsv)`);
if (result.skipped.length > 0) {
  console.log(`\nSkipped ${result.skipped.length} rows:`);
  for (const line of result.skipped) console.log(`  ${line}`);
}
