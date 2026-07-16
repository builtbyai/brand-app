// /api/brand-os/* — Brand OS section browser, semantic search, and AI Q&A.
// Mounted under /api/brand-os in worker/src/index.ts.

import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { requireUser } from "../auth";
import { upsertSectionChunks, chunkMarkdown, querySections, bodyHash } from "../lib/vectorize";
import { ask } from "../lib/rag";

const r = new Hono<HonoEnv>();
r.use("*", requireUser);

interface IngestBulkPayload {
  sections: Array<{
    id: string;
    rel_path: string;
    parent_brand: string | null;
    ord: number;
    title: string;
    slug: string;
    body_md: string;
    updated_at: string;
  }>;
}

// POST /api/brand-os/ingest/bulk
// Local CLI (scripts/ingest.mjs) calls this with a batch of markdown files.
// Skips unchanged rows by hash; embeds + upserts the rest.
r.post("/ingest/bulk", async (c) => {
  const payload = await c.req.json<IngestBulkPayload>();
  if (!Array.isArray(payload?.sections)) return c.json({ error: "sections[] required" }, 400);

  const startedAt = new Date().toISOString();
  const runIns = await c.env.DB.prepare(
    "INSERT INTO brand_ingest_runs (started_at, files_scanned, status) VALUES (?, ?, ?)"
  ).bind(startedAt, payload.sections.length, "running").run();
  const runId = runIns.meta.last_row_id;

  let changed = 0;
  let upserted = 0;
  const errors: string[] = [];

  for (const s of payload.sections) {
    try {
      const hash = await bodyHash(s.body_md);
      const wordCount = s.body_md.trim().split(/\s+/).length;
      const existing = await c.env.DB.prepare(
        "SELECT body_hash FROM brand_sections WHERE id = ?"
      ).bind(s.id).first<{ body_hash: string }>();

      if (existing?.body_hash === hash) {
        // Touch ingested_at so we know it was checked
        await c.env.DB.prepare(
          "UPDATE brand_sections SET ingested_at = ? WHERE id = ?"
        ).bind(startedAt, s.id).run();
        continue;
      }

      await c.env.DB.prepare(
        `INSERT INTO brand_sections (id, parent_brand, ord, title, slug, rel_path, body_md, body_hash, word_count, updated_at, ingested_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           parent_brand = excluded.parent_brand,
           ord = excluded.ord,
           title = excluded.title,
           slug = excluded.slug,
           rel_path = excluded.rel_path,
           body_md = excluded.body_md,
           body_hash = excluded.body_hash,
           word_count = excluded.word_count,
           updated_at = excluded.updated_at,
           ingested_at = excluded.ingested_at`
      ).bind(
        s.id, s.parent_brand, s.ord, s.title, s.slug, s.rel_path,
        s.body_md, hash, wordCount, s.updated_at, startedAt
      ).run();
      changed++;

      const chunks = chunkMarkdown(s.body_md);
      const u = await upsertSectionChunks(c.env, s.id, s.parent_brand, chunks);
      upserted += u.upserted;
    } catch (e: any) {
      errors.push(`${s.id}: ${e?.message ?? e}`);
    }
  }

  const finishedAt = new Date().toISOString();
  await c.env.DB.prepare(
    "UPDATE brand_ingest_runs SET finished_at = ?, files_changed = ?, chunks_upserted = ?, status = ?, error = ? WHERE id = ?"
  ).bind(
    finishedAt, changed, upserted,
    errors.length ? "failed" : "ok",
    errors.length ? errors.join("\n").slice(0, 4000) : null,
    runId,
  ).run();

  return c.json({
    runId, scanned: payload.sections.length, changed, upserted,
    errors: errors.length, status: errors.length ? "failed" : "ok",
  });
});

// GET /api/brand-os/sections?brand=northwind
r.get("/sections", async (c) => {
  const brand = c.req.query("brand");
  const sql = brand
    ? `SELECT id, parent_brand, ord, title, slug, rel_path, word_count, updated_at
       FROM brand_sections WHERE parent_brand = ? ORDER BY ord, title`
    : `SELECT id, parent_brand, ord, title, slug, rel_path, word_count, updated_at
       FROM brand_sections ORDER BY parent_brand IS NULL, parent_brand, ord, title`;
  const stmt = brand ? c.env.DB.prepare(sql).bind(brand) : c.env.DB.prepare(sql);
  const rs = await stmt.all<any>();
  return c.json({ sections: rs.results ?? [] });
});

// GET /api/brand-os/sections/:id  (id is URL-encoded)
r.get("/sections/:id{.+}", async (c) => {
  const id = decodeURIComponent(c.req.param("id"));
  const row = await c.env.DB.prepare(
    "SELECT * FROM brand_sections WHERE id = ?"
  ).bind(id).first<any>();
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json({ section: row });
});

// POST /api/brand-os/search  { query, brand?, topK? }
r.post("/search", async (c) => {
  const { query, brand, topK } = await c.req.json<{ query: string; brand?: string; topK?: number }>();
  if (!query?.trim()) return c.json({ error: "query required" }, 400);
  const hits = await querySections(c.env, query, { topK, brand });
  return c.json({ hits });
});

// POST /api/brand-os/ask  { question, backend, brand?, model? }
r.post("/ask", async (c) => {
  const body = await c.req.json<{ question: string; backend?: "gemini" | "ollama"; brand?: string; model?: string; topK?: number }>();
  if (!body.question?.trim()) return c.json({ error: "question required" }, 400);
  const backend = body.backend ?? "gemini";
  try {
    const result = await ask(c.env, {
      question: body.question,
      backend,
      brand: body.brand,
      model: body.model,
      topK: body.topK,
    });
    // Log the query for later auditing
    await c.env.DB.prepare(
      "INSERT INTO brand_os_queries (user_id, question, backend, model_used, citations_json, latency_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      c.get("user")?.id ?? null,
      body.question.slice(0, 1000),
      result.backendUsed,
      result.modelUsed,
      JSON.stringify(result.citations.map((cite) => cite.sectionId)),
      result.latencyMs,
      new Date().toISOString(),
    ).run().catch(() => null);
    return c.json(result);
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    if (msg.startsWith("ollama_unreachable:")) {
      return c.json({
        error: "ollama_unreachable",
        detail: msg,
        fallback: "gemini",
      }, 503);
    }
    return c.json({ error: msg }, 500);
  }
});

// GET /api/brand-os/runs  (last 20 ingest runs)
r.get("/runs", async (c) => {
  const rs = await c.env.DB.prepare(
    "SELECT * FROM brand_ingest_runs ORDER BY started_at DESC LIMIT 20"
  ).all<any>();
  return c.json({ runs: rs.results ?? [] });
});

export { r as brandOsRoutes };
