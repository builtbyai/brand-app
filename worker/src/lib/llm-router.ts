// Dispatches an LLM call to Gemini (via AI Gateway) or a self-hosted Ollama (via an authenticated bridge).
// One file, one function — the SPA picks the backend per query.

import type { Env } from "../env";
import { chatComplete } from "../chat";
import { callOllamaViaBridge } from "./ollama-bridge";

export type LlmBackend = "gemini" | "ollama";

export interface LlmCall {
  backend: LlmBackend;
  prompt: string;
  system?: string;
  /** Backend-specific model override. */
  model?: string;
  temperature?: number;
}

export interface LlmResult {
  text: string;
  backendUsed: LlmBackend;
  modelUsed: string;
  latencyMs: number;
}

export async function dispatch(env: Env, call: LlmCall): Promise<LlmResult> {
  const t0 = Date.now();
  if (call.backend === "ollama") {
    const r = await callOllamaViaBridge(env, {
      prompt: call.prompt,
      system: call.system,
      model: call.model,
    });
    return {
      text: r.text,
      backendUsed: "ollama",
      modelUsed: r.model,
      latencyMs: r.latencyMs,
    };
  }

  // Default: Gemini via AI Gateway. Use the chatComplete wrapper that already
  // handles model normalization across OpenAI / Workers AI shapes.
  const model = call.model ?? `openai/gpt-4o-mini`; // AI Gateway slug
  const result = await chatComplete(env, {
    model,
    messages: [
      ...(call.system ? [{ role: "system" as const, content: call.system }] : []),
      { role: "user" as const, content: call.prompt },
    ],
    temperature: call.temperature,
  });
  return {
    text: result.content,
    backendUsed: "gemini",
    modelUsed: result.model,
    latencyMs: Date.now() - t0,
  };
}
