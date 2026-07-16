#!/usr/bin/env node
// Local CLI: walk brand-os/**/*.md → POST batches to /api/brand-os/ingest/bulk.
// Auth: logs in once with admin creds, reuses the cf_session cookie.
//
// Usage (defaults shown):
//   BRAND_OS_DIR="./brand-os" \
//   API_BASE="https://app.example.com" \
//   ADMIN_EMAIL="admin@example.com" \
//   ADMIN_PASSWORD="ChangeMe123!" \
//   node scripts/ingest.mjs

import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const BRAND_OS = (process.env.BRAND_OS_DIR ?? "./brand-os").replace(/\\/g, "/");
// Defaults to the workers.dev URL so the ingest works before the custom domain is live.
// Override with API_BASE env var when the custom domain is up.
const API_BASE = process.env.API_BASE ?? "https://brand-os-api.example.workers.dev";
const EMAIL    = process.env.ADMIN_EMAIL ?? "admin@example.com";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
const BATCH_SIZE = 25;

const SKIP_DIRS = new Set([".obsidian", "_archive", ".claude", "node_modules", ".git"]);
const SKIP_FILES = new Set(["INDEX.md"]); // optional — keep INDEX.md if you want it ingested

// Map leading folder number to canonical brand id (per plan)
const BRAND_BY_PREFIX = {
  "06": "northwind",
  "07": "northwind-build",
  "08": "northwind-tech",
  "09": "northwind-fit",
  "10": "northwind-members",
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (name.toLowerCase().endsWith(".md") && !SKIP_FILES.has(name)) out.push({ full, stat });
  }
  return out;
}

function deriveFields(absPath, stat) {
  const rel = relative(BRAND_OS, absPath).split(sep).join("/");
  const id = rel.replace(/\.md$/i, "");                       // "06-parent-brand-northwind/positioning"
  const segments = rel.split("/");
  const firstSeg = segments[0];                                // "06-parent-brand-northwind"
  const prefixMatch = firstSeg.match(/^(\d{2})-/);
  const prefix = prefixMatch?.[1];
  const ord = prefix ? parseInt(prefix, 10) : 999;
  const parent_brand = prefix ? (BRAND_BY_PREFIX[prefix] ?? null) : null;
  const slug = id.toLowerCase().replace(/[^a-z0-9/_-]+/g, "-");

  const body_md = readFileSync(absPath, "utf8");
  const h1 = body_md.match(/^#\s+(.+)$/m);
  const baseName = segments[segments.length - 1].replace(/\.md$/i, "");
  const title = h1?.[1].trim() ?? baseName;

  return {
    id, parent_brand, ord, title, slug,
    rel_path: rel,
    body_md,
    updated_at: stat.mtime.toISOString(),
  };
}

async function main() {
  console.log(`[ingest] base=${API_BASE}`);
  console.log(`[ingest] vault=${BRAND_OS}`);

  // 1. Login
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) {
    const t = await loginRes.text().catch(() => "");
    throw new Error(`Login failed: ${loginRes.status} ${t.slice(0, 300)}`);
  }
  const setCookie = loginRes.headers.get("set-cookie");
  if (!setCookie) throw new Error("Login response missing Set-Cookie header");
  // Extract cf_session=<value> (or whatever the worker named it)
  const cookieMatch = setCookie.match(/(cf_session|session|sid)=([^;]+)/);
  if (!cookieMatch) throw new Error(`Could not parse session cookie from: ${setCookie.slice(0, 200)}`);
  const cookie = `${cookieMatch[1]}=${cookieMatch[2]}`;
  console.log(`[ingest] logged in as ${EMAIL}`);

  // 2. Walk vault
  const files = walk(BRAND_OS);
  console.log(`[ingest] scanned ${files.length} markdown files`);

  // 3. Build payload
  const sections = files.map(({ full, stat }) => deriveFields(full, stat));

  // 4. POST in batches
  let totalScanned = 0, totalChanged = 0, totalUpserted = 0, totalErrors = 0;
  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE);
    process.stdout.write(`[ingest] batch ${i / BATCH_SIZE + 1}/${Math.ceil(sections.length / BATCH_SIZE)} (${batch.length} files)... `);
    const res = await fetch(`${API_BASE}/api/brand-os/ingest/bulk`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ sections: batch }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.log(`FAILED ${res.status}\n  ${t.slice(0, 400)}`);
      totalErrors += batch.length;
      continue;
    }
    const r = await res.json();
    console.log(`ok (scanned=${r.scanned} changed=${r.changed} chunks=${r.upserted})`);
    totalScanned += r.scanned ?? 0;
    totalChanged += r.changed ?? 0;
    totalUpserted += r.upserted ?? 0;
    if (r.errors) totalErrors += r.errors;
  }

  console.log(`[ingest] done — scanned=${totalScanned} changed=${totalChanged} chunks=${totalUpserted} errors=${totalErrors}`);
  process.exit(totalErrors ? 1 : 0);
}

main().catch((e) => {
  console.error(`[ingest] FATAL: ${e?.message ?? e}`);
  process.exit(2);
});
