// Brand-OS RAG pipeline. Retrieve top-K chunks → format → call llm-router → return cited answer.

import type { Env } from "../env";
import { querySections, type QueryHit } from "./vectorize";
import { dispatch, type LlmBackend } from "./llm-router";

const SYSTEM_PROMPT = `You are the Brand OS Command Center, an expert on Northwind's four-brand operating system (Northwind Build construction, Northwind Tech software, Northwind Fit fitness, Northwind Members private content) and the parent brand Northwind.

Answer using only the brand-OS sections supplied in the context block. Cite each claim by referencing the section_id in brackets, e.g. [06-parent-brand-northwind/positioning]. If the context does not cover the question, say so explicitly rather than inventing. Match the voice the brand OS itself uses: direct, founder-credible, no fluff, no filler.`;

export interface AskInput {
  question: string;
  backend: LlmBackend;
  brand?: string | null;       // optional filter to one sub-brand
  model?: string;              // backend-specific model override
  topK?: number;
}

export interface AskResult {
  answer: string;
  backendUsed: LlmBackend;
  modelUsed: string;
  latencyMs: number;
  citations: Array<{
    sectionId: string;
    parentBrand: string;
    score: number;
    excerpt: string;
  }>;
}

export async function ask(env: Env, input: AskInput): Promise<AskResult> {
  const hits = await querySections(env, input.question, {
    topK: input.topK ?? 5,
    brand: input.brand,
  });
  if (!hits.length) {
    return {
      answer: "The brand OS does not contain anything relevant to that question. Try rephrasing or pointing at a specific brand.",
      backendUsed: input.backend,
      modelUsed: "(no synthesis — empty retrieval)",
      latencyMs: 0,
      citations: [],
    };
  }
  const context = formatContext(hits);
  const result = await dispatch(env, {
    backend: input.backend,
    model: input.model,
    system: SYSTEM_PROMPT,
    prompt: `Context (brand OS sections, ranked by relevance):\n\n${context}\n\n---\n\nQuestion: ${input.question}\n\nAnswer with explicit [section_id] citations.`,
  });
  return {
    answer: result.text,
    backendUsed: result.backendUsed,
    modelUsed: result.modelUsed,
    latencyMs: result.latencyMs,
    citations: hits.map((h) => ({
      sectionId: h.sectionId,
      parentBrand: h.parentBrand,
      score: h.score,
      excerpt: h.excerpt,
    })),
  };
}

function formatContext(hits: QueryHit[]): string {
  return hits
    .map((h, i) => `[${i + 1}] section_id: ${h.sectionId}  (brand: ${h.parentBrand}, score: ${h.score.toFixed(3)})\n${h.excerpt}`)
    .join("\n\n---\n\n");
}
