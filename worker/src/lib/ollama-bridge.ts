// Calls a self-hosted Ollama instance via an authenticated signaling bridge.
// Worker auth: Bearer OLLAMA_BRIDGE_SECRET.
// Defaults to qwq:32b for "deep" synthesis; override per call.

import type { Env } from "../env";

export interface OllamaCallInput {
  prompt: string;
  system?: string;
  model?: string;       // override; defaults to qwq:32b
  numCtx?: number;      // defaults to 32768
  timeoutMs?: number;   // defaults to 90s — large models are slow over the bridge
}

export interface OllamaCallResult {
  text: string;
  model: string;
  latencyMs: number;
}

const DEFAULT_SIGNALING = "https://signaling.example.workers.dev";

export async function callOllamaViaBridge(env: Env, input: OllamaCallInput): Promise<OllamaCallResult> {
  if (!env.OLLAMA_BRIDGE_SECRET) {
    throw new Error("ollama_unreachable: OLLAMA_BRIDGE_SECRET not set on this worker");
  }
  const base = env.OLLAMA_BRIDGE_URL ?? DEFAULT_SIGNALING;
  const model = input.model ?? "qwq:32b";
  const t0 = Date.now();

  const body = {
    task: "ollama-generate",
    prompt: input.prompt,
    system: input.system,
    model,
    num_ctx: input.numCtx ?? 32768,
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), input.timeoutMs ?? 90_000);

  try {
    const res = await fetch(`${base}/dispatch`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OLLAMA_BRIDGE_SECRET}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`ollama_unreachable: bridge ${res.status} ${txt.slice(0, 200)}`);
    }
    const data: any = await res.json();
    const text = (data?.response ?? data?.text ?? data?.result ?? "").toString();
    return { text, model, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("ollama_unreachable: bridge timeout");
    if (typeof e?.message === "string" && e.message.startsWith("ollama_unreachable:")) throw e;
    throw new Error(`ollama_unreachable: ${e?.message ?? e}`);
  } finally {
    clearTimeout(t);
  }
}
