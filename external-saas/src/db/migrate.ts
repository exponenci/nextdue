import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "./client";

await sql.unsafe(`
  create schema if not exists app;
  create table if not exists app.schema_migrations (
    name text primary key,
    checksum text not null,
    applied_at timestamptz not null default now()
  )
`);

const directory = path.join(process.cwd(), "src", "db", "migrations");
const files = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();

for (const name of files) {
  const contents = await readFile(path.join(directory, name), "utf8");
  const checksum = createHash("sha256").update(contents).digest("hex");
  const [existing] = await sql<{ checksum: string }[]>`
    select checksum from app.schema_migrations where name = ${name}
  `;
  if (existing) {
    if (existing.checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
    continue;
  }
  await sql.begin(async (transaction) => {
    await transaction.unsafe(contents);
    await transaction`
      insert into app.schema_migrations (name, checksum) values (${name}, ${checksum})
    `;
  });
  console.log(`Applied ${name}`);
}

await sql.end();
console.log("Database migrations complete");
