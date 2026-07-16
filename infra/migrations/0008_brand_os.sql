-- Brand OS section ingestion + search support.
-- Mirrors a local brand-os/ markdown vault into D1.
-- Markdown stays canonical; this table is a read-only projection refreshed by
-- scripts/ingest.mjs (and an optional scheduled ingest task).

CREATE TABLE IF NOT EXISTS brand_sections (
  id            TEXT PRIMARY KEY,         -- "06-parent-brand-northwind/positioning"
  parent_brand  TEXT,                     -- 'northwind'|'northwind-build'|'northwind-tech'|'northwind-fit'|'northwind-members'|NULL (shared)
  ord           INTEGER NOT NULL,         -- numeric prefix from folder name for sort
  title         TEXT NOT NULL,            -- first H1 in body (or derived from filename)
  slug          TEXT NOT NULL UNIQUE,     -- URL-safe id
  rel_path      TEXT NOT NULL,            -- path under brand-os/ root, forward-slash normalized
  body_md       TEXT NOT NULL,            -- raw markdown
  body_hash     TEXT NOT NULL,            -- sha256(body_md), used by ingest to skip unchanged
  word_count    INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL,            -- ISO8601 from file mtime
  ingested_at   TEXT NOT NULL             -- ISO8601 when this row last refreshed
);

CREATE INDEX IF NOT EXISTS idx_brand_sections_brand ON brand_sections(parent_brand, ord);
CREATE INDEX IF NOT EXISTS idx_brand_sections_slug ON brand_sections(slug);

CREATE TABLE IF NOT EXISTS brand_ingest_runs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  files_scanned INTEGER,
  files_changed INTEGER,
  chunks_upserted INTEGER,
  status        TEXT NOT NULL,            -- 'running' | 'ok' | 'failed'
  error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_brand_ingest_runs_started ON brand_ingest_runs(started_at DESC);

-- Persisted RAG query log so we can audit / fine-tune retrieval over time.
CREATE TABLE IF NOT EXISTS brand_os_queries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT,
  question      TEXT NOT NULL,
  backend       TEXT NOT NULL,            -- 'gemini' | 'ollama'
  model_used    TEXT,
  citations_json TEXT,                    -- JSON array of section_ids returned
  latency_ms    INTEGER,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_brand_os_queries_user ON brand_os_queries(user_id, created_at DESC);
