// Brand-OS vectorize helpers: chunk markdown, embed via Workers AI (free), upsert/query.
// Index: brand-os-sections (768 dim, cosine). Binding: env.VEC_BRAND_OS.

import type { Env } from "../env";

const EMBED_MODEL = "@cf/baai/bge-base-en-v1.5";
const EMBED_DIM = 768;

// ~800 tokens of English text ≈ 3200 chars. ~100 token overlap ≈ 400 chars.
const CHUNK_CHARS = 3200;
const OVERLAP_CHARS = 400;

export interface SectionChunk {
  text: string;
  index: number; // 0-based position in the parent doc
}

/** Token-agnostic chunker. Tries to break on paragraph boundaries inside the window. */
export function chunkMarkdown(body: string): SectionChunk[] {
  const clean = body.trim();
  if (clean.length <= CHUNK_CHARS) return [{ text: clean, index: 0 }];

  const out: SectionChunk[] = [];
  let start = 0;
  let idx = 0;
  while (start < clean.length) {
    let end = Math.min(start + CHUNK_CHARS, clean.length);
    if (end < clean.length) {
      // Prefer a paragraph break in the last 25% of the window
      const lookback = clean.lastIndexOf("\n\n", end);
      if (lookback > start + CHUNK_CHARS * 0.75) end = lookback;
    }
    out.push({ text: clean.slice(start, end).trim(), index: idx++ });
    if (end >= clean.length) break;
    start = end - OVERLAP_CHARS;
  }
  return out;
}

export async function embedTexts(env: Env, texts: string[]): Promise<number[][]> {
  if (!env.AI) throw new Error("env.AI binding missing");
  if (!texts.length) return [];
  const out: number[][] = [];
  // bge model accepts an array of strings up to a small batch limit; chunk to be safe.
  const BATCH = 16;
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = (await env.AI.run(EMBED_MODEL as any, { text: batch } as any)) as any;
    const arr: number[][] = res?.data ?? res?.embeddings ?? [];
    if (arr.length !== batch.length) {
      throw new Error(`embedTexts: model returned ${arr.length} vectors for ${batch.length} inputs`);
    }
    out.push(...arr);
  }
  return out;
}

export interface UpsertResult { upserted: number; }

export async function upsertSectionChunks(
  env: Env,
  sectionId: string,
  parentBrand: string | null,
  chunks: SectionChunk[],
): Promise<UpsertResult> {
  if (!env.VEC_BRAND_OS) throw new Error("env.VEC_BRAND_OS binding missing");
  if (!chunks.length) return { upserted: 0 };
  const vectors = await embedTexts(env, chunks.map((c) => c.text));
  const records = vectors.map((values, i) => ({
    id: `${sectionId}::${chunks[i].index}`,
    values,
    metadata: {
      section_id: sectionId,
      chunk_index: chunks[i].index,
      parent_brand: parentBrand ?? "shared",
      excerpt: chunks[i].text.slice(0, 240),
    },
  }));
  // Delete prior chunks for this section before upsert (handles shrink case).
  const priorIds = Array.from({ length: 64 }, (_, i) => `${sectionId}::${i}`);
  try { await env.VEC_BRAND_OS.deleteByIds(priorIds); } catch { /* fresh index */ }
  await env.VEC_BRAND_OS.upsert(records);
  return { upserted: records.length };
}

export interface QueryHit {
  sectionId: string;
  chunkIndex: number;
  parentBrand: string;
  excerpt: string;
  score: number;
}

export async function querySections(
  env: Env,
  query: string,
  opts: { topK?: number; brand?: string | null } = {},
): Promise<QueryHit[]> {
  if (!env.VEC_BRAND_OS) throw new Error("env.VEC_BRAND_OS binding missing");
  const topK = opts.topK ?? 5;
  const [qvec] = await embedTexts(env, [query]);
  if (!qvec || qvec.length !== EMBED_DIM) {
    throw new Error(`querySections: expected ${EMBED_DIM}-dim embedding, got ${qvec?.length}`);
  }
  const filter = opts.brand
    ? { parent_brand: { $eq: opts.brand } }
    : undefined;
  const res: any = await env.VEC_BRAND_OS.query(qvec, {
    topK,
    returnMetadata: "all" as any,
    ...(filter && { filter }),
  } as any);
  const matches = res?.matches ?? [];
  return matches.map((m: any) => ({
    sectionId: m.metadata?.section_id ?? m.id?.split("::")[0],
    chunkIndex: m.metadata?.chunk_index ?? 0,
    parentBrand: m.metadata?.parent_brand ?? "shared",
    excerpt: m.metadata?.excerpt ?? "",
    score: m.score ?? 0,
  }));
}

export function bodyHash(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  return crypto.subtle.digest("SHA-256", buf).then((digest) =>
    Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
