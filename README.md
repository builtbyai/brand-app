# Brand OS

A Cloudflare-native, multi-agent content & sales studio for a multi-brand company. One
workspace to research, generate, review, schedule, and prospect — backed entirely by
Cloudflare's edge primitives.

> The app ships with a fictional demo brand, **Northwind** (a team-productivity SaaS), so you
> can explore the full pipeline without wiring up your own content first.

## What it does

Brand OS treats a brand as a first-class object and runs a 26-node creative + sales pipeline
over it. From a one-line brief it can generate on-brand concepts, dispatch image/video
generation, run automated quality + safety review, mirror finished assets to object storage,
and hand them to a scheduler — with every step written to an append-only audit ledger.

It also keeps a searchable **brand knowledge base**: markdown "brand OS" sections are ingested,
embedded, and made retrievable through a cited RAG endpoint, so the assistant answers from your
own material instead of hallucinating.

### Feature groups

- **Brand** — voice, palette, forbidden claims, products, and competitor battlecards.
- **Library** — D1-backed articles plus a media library with drag-and-drop bulk upload to R2.
- **Studio** — workflow runner, live generation grid, campaign copilot, image lab, and preview.
- **Plan** — a 7-day calendar grid and a publish queue, both reading real schedules from D1.
- **Channels / Analytics** — social publishing and metrics through a [Postiz](https://postiz.com) backend.
- **Research** — SEO keyword research and competitor intelligence (LLM + vector similarity).
- **Sales** — a compliance-gated discover → enrich → draft → approve → send flow.
- **Spec** — a 26-node status board and a cross-workflow audit ledger.
- **Chat** — a context-aware assistant slide-over reachable from any tab, with a pluggable
  LLM backend (Gemini via AI Gateway, or a self-hosted Ollama via an authenticated bridge).

## The 26-node pipeline

The workflow engine is organized into four phases — creative (nodes 01–16), research (17–18),
sales (19–25), and governance (26). A run looks like:

```
brief → create workflow → execute
  ↓ Brief Intake → Concept Generation
  ↓ dispatch: Prompt Schema Builder × concepts → Provider Dispatcher → PUBLISH_QUEUE
  ↓ per queued job:
      Provider Adapter (Workers AI image / video)
      Output Normalizer  (fetch → R2 → SHA-256 → generated_assets row)
      Quality Review     (image caption + safety classification)
  ↓ Durable Object broadcasts a "generated" event over SSE → UI grid updates live
  ↓ Export Package Builder → manifest + per-platform HTML catalog in R2
```

Each step records input/output hashes to `workflow_audit_events` so any run can be replayed and
inspected after the fact.

## Tech stack

**Backend** — Cloudflare Workers ([Hono](https://hono.dev) router), with:

| Primitive | Use |
|---|---|
| D1 (SQLite) | 17 tables: users/sessions, channels/drafts/schedules, media, job log, webhook events, workflows/nodes/audit/assets, prospects/outreach, articles/battlecards/sources, brand sections |
| R2 | media bucket, served via a `/api/r2/*` worker proxy (no separate DNS) |
| Queues | publish / ingest / generate consumers, with a dead-letter queue |
| Durable Objects | per-user SSE fan-out for live generation status |
| Workers AI | image generation, image captioning, safety classification, embeddings, chat — via AI Gateway |
| Vectorize | four 768-dim cosine indexes (brands, competitors, leads, brand sections) |
| KV | provider-capability cache, brief presets, research cache |
| Cron | near-term schedule reconciliation + hourly content ingest |

**Frontend** — React 19 + Vite + Tailwind v4, a single-page tab shell with a typed API client
(`src/lib/api.ts`) as the only contract surface, HTTP-only cookie sessions, and live updates over
Server-Sent Events. Charts/animation via `motion`; icons via `lucide-react`.

Auth is a small SHA-256 session model backed by D1 — no third-party identity provider required.
Social publishing is delegated to a self-hosted Postiz instance so the app never owns the
per-platform OAuth tail; the worker treats it as a black-box publisher behind one API key.

## Getting started

Two packages, developed side by side.

```bash
# 1. Worker (API) — http://localhost:8787
cd worker
npm install
cp .dev.vars.example .dev.vars     # fill in local secrets
wrangler d1 migrations apply brand-os-prod --local
npm run dev

# 2. Web (SPA) — http://localhost:5173, /api/* proxied to the worker
cd web
npm install
npm run dev
```

Seed a first admin user and demo content:

```bash
# hash a password, paste the salt/hash into infra/seed-admin.sql, then:
node infra/hash-password.mjs 'your-password'
wrangler d1 execute brand-os-prod --local --file infra/seed-admin.sql

# generate + load the sample article/battlecard content
node infra/seed-content.mjs > infra/.seed-content.sql
wrangler d1 execute brand-os-prod --local --file infra/.seed-content.sql
```

Provisioning the full set of Cloudflare resources (D1, R2, Queues, KV, Vectorize, AI Gateway)
and deploying to production is covered in [`docs/DEPLOY.md`](docs/DEPLOY.md). Standing the same
stack up under a different brand/domain is covered in
[`docs/REPLICATE-FOR-ANOTHER-COMPANY.md`](docs/REPLICATE-FOR-ANOTHER-COMPANY.md).

## Configuration

All secrets are Worker secrets (`wrangler secret put …`) or local `.dev.vars`. See
[`worker/.dev.vars.example`](worker/.dev.vars.example) for the full list — the essentials are
`GEMINI_API_KEY`, `OPENAI_API_KEY` (fallback), `SESSION_COOKIE_SECRET`, and the Postiz +
R2 credentials if you enable those features. Nothing sensitive is committed.

## Architecture notes

- **Single-origin API.** `wrangler.toml` `routes` bind `/api/*` on the app hostname straight to
  the Worker, so there's no CORS surface and one session cookie works everywhere.
- **The API client is the contract.** Every backend route the UI touches has a typed wrapper in
  `web/src/lib/api.ts`; snake_case D1 rows are adapted to camelCase domain types at that boundary.
- **Multi-tenant-ready, single-tenant today.** Every table carries a `tenant_id`, so adding orgs
  later is UI + middleware work, not a schema migration.

## Status

This is a working prototype built to explore how far a content + sales studio can go on
Cloudflare-native primitives alone. The pipeline, media, scheduling, RAG, and audit ledger are
implemented and functional; the video-generation path and some research/sales nodes depend on
external provider credits and are best treated as reference implementations.

## Screenshots

_Add UI captures here once you deploy:_


## Live Demo

_Live demo: coming soon._

## License

MIT — see [LICENSE](LICENSE).
