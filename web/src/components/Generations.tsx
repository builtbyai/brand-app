import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Loader2, RefreshCw, ExternalLink, Wand2, Send } from "lucide-react";
import { api, apiUrl } from "../lib/api";
import SendToScheduler from "./SendToScheduler";
import MediaThumb from "./MediaThumb";

interface Asset {
  id: string;
  workflow_id: string;
  provider_id: string;
  model_id: string;
  media_type: string;
  uri: string;
  prompt_id: string;
  metadata_json?: string;
  created_at: string;
  review?: {
    assetId: string;
    overall: number;
    safety: number;
    brandAdherence: number;
    productConsistency: number;
    failureTags: string[];
  } | null;
}

interface RunLog { line: string; kind: "info" | "ok" | "err"; }

// Visible end-to-end driver for the 26-node creative pipeline.
//   Brief → Node 01 → Node 05 → Node 07 → Node 11 → consumer drives Node 09 → Node 13
// Live SSE updates the grid as each asset lands in R2.
export default function Generations() {
  const [brief, setBrief] = useState(() => {
    try {
      const seeded = sessionStorage.getItem("brand-os:prefilled-brief");
      if (seeded) {
        sessionStorage.removeItem("brand-os:prefilled-brief");
        return seeded;
      }
    } catch {}
    return "The Northwind dashboard on a sleek laptop in a bright modern office at golden hour, cinematic depth of field.";
  });
  const [conceptCount, setConceptCount] = useState(2);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<RunLog[]>([]);
  const [recent, setRecent] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWfId, setActiveWfId] = useState<string | null>(null);
  const [schedTarget, setSchedTarget] = useState<{ url: string; copy: string } | null>(null);

  const TEMPLATES = [
    { key: "winter",   label: "❄️ Winter campaign",  brief: "Product-launch suite for Northwind — the unified dashboard on a laptop in a bright modern office, automated report cards, onboarding flow. Cinematic golden-hour studio shots with clean surfaces." },
    { key: "storm",    label: "🌪️ Launch push",   brief: "A product-launch moment. Hero shot revealing the analytics dashboard, the branded app on a tablet, a team lead approving a plan on screen." },
    { key: "luxury",   label: "🏡 Enterprise showcase", brief: "Premium office interior in a modern building, bronze accent details, golden-hour hero shot of the workspace on a wall display, architectural precision." },
    { key: "drone",    label: "🛰️ Automation demo",  brief: "Abstract automation demo at sunset — data flowing between dashboards and cards. Sleek tech aesthetic with subtle Northwind bronze accent lighting." },
    { key: "solar",    label: "☀️ Analytics story",    brief: "An analytics story — premium glass dashboard panels floating over a clean workspace. Modern design, soft daylight, dramatic perspective showing the metrics seamlessly integrated." },
  ];
  const refreshTimer = useRef<number | null>(null);

  const append = (line: string, kind: RunLog["kind"] = "info") =>
    setLog((prev) => [{ line, kind }, ...prev].slice(0, 30));

  const load = async () => {
    try {
      const { assets } = await api.recentAssets(60);
      setRecent(assets);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // SSE subscription — listens for "generated" events broadcast by the queue consumer.
  useEffect(() => {
    const es = new EventSource(apiUrl("/api/events/stream"), { withCredentials: true } as EventSourceInit);
    es.addEventListener("schedule", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        if (data.kind === "generated" && Array.isArray(data.assets)) {
          append(`✓ asset (${data.assets[0]?.modelId ?? "?"}) for prompt ${data.promptId?.slice(0, 8)}`, "ok");
          // Lazy refresh
          if (refreshTimer.current) clearTimeout(refreshTimer.current);
          refreshTimer.current = window.setTimeout(load, 800) as any;
        }
      } catch {}
    });
    es.onerror = () => { /* SSE auto-reconnects */ };
    return () => es.close();
  }, []);

  const generate = async () => {
    if (!brief.trim() || busy) return;
    setBusy(true); setLog([]); setActiveWfId(null);
    try {
      append("⤷ creating workflow…");
      const wf = await api.createWorkflow({ mode: "execute" });
      setActiveWfId(wf.workflowId);
      append(`workflow ${wf.workflowId.slice(0, 8)} created`, "ok");

      append("⤷ Node 01 + 05 (brief intake → concept gen)…");
      const exec = await api.executeWorkflow(wf.workflowId, {
        brief: { rawBrief: brief.trim(), uploadedAssetIds: [], desiredOutputs: ["image"] },
        conceptCount,
      });
      const concepts = exec.concepts?.data?.concepts ?? [];
      if (concepts.length === 0) { append("no concepts produced — abort", "err"); setBusy(false); return; }
      append(`${concepts.length} concepts: ${concepts.map((c) => c.title).join(" · ")}`, "ok");

      append("⤷ Node 07 + 11 (prompt builder → dispatcher)…");
      const disp = await api.dispatchWorkflow(wf.workflowId, concepts);
      append(`${disp.dispatchedJobIds.length} jobs queued — generation runs async`, "ok");

      append("listening for live results via SSE…");
    } catch (e: any) {
      append(`error: ${e?.body?.message ?? e?.body?.error ?? "unknown"}`, "err");
    } finally {
      setBusy(false);
    }
  };

  const runFull = async () => {
    if (!brief.trim() || busy) return;
    setBusy(true); setLog([]); setActiveWfId(null);
    try {
      append("⤷ /api/workflows/run-full (Phase 1 chain in one call)…");
      const r = await api.runFullWorkflow({
        brief: { rawBrief: brief.trim(), uploadedAssetIds: [], desiredOutputs: ["image"] },
        conceptCount,
      });
      setActiveWfId(r.workflowId);
      append(`workflow ${r.workflowId.slice(0, 8)} · brand ${r.brand?.name ?? "?"} · ${r.conceptCount} concepts · ${r.promptCount} prompts`, "ok");
      append(`${r.dispatchedJobIds.length} jobs queued — listening for SSE…`, "ok");
    } catch (e: any) {
      append(`error: ${e?.body?.message ?? e?.body?.error ?? "unknown"}`, "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <Wand2 className="w-5 h-5" /> Generations
        </h2>
        <p className="text-xs text-nw-soft-white/60 mt-1">
          One-shot: brief → concepts → prompts → parallel provider dispatch → R2-stored assets. All audit-ledger-backed.
        </p>
      </div>

      <div className="nw-glass-glow rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-mono uppercase text-nw-bronze self-center mr-1">templates:</span>
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              onClick={() => setBrief(t.brief)}
              className="text-[11px] bg-nw-brown/40 hover:bg-nw-brown/60 border border-nw-bronze/15 rounded px-2 py-1"
            >
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          rows={3} value={brief} onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe the creative brief…"
          className="w-full bg-nw-brown/40 border border-nw-bronze/20 rounded px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs flex items-center gap-2">
            <span className="text-nw-soft-white/60">Concepts:</span>
            <select
              value={conceptCount} onChange={(e) => setConceptCount(Number(e.target.value))}
              className="bg-nw-brown/40 border border-nw-bronze/20 rounded px-2 py-1 text-xs"
            >
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button
            onClick={generate} disabled={busy || !brief.trim()}
            className="ml-auto flex items-center gap-2 bg-nw-bronze text-nw-warm-black font-semibold text-xs px-4 py-2 rounded disabled:opacity-50"
            title="2-step: execute (Nodes 01+05) then dispatch (Nodes 07+11)"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {busy ? "running…" : "Generate"}
          </button>
          <button
            onClick={runFull} disabled={busy || !brief.trim()}
            className="flex items-center gap-2 bg-nw-brown/60 border border-nw-bronze/40 text-nw-soft-white font-semibold text-xs px-4 py-2 rounded disabled:opacity-50"
            title="Single call: Nodes 01 → 02 → 03 → 04 → 05 → 07 → 08 → 10 → 11"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            Run full pipeline
          </button>
        </div>
        {log.length > 0 && (
          <div className="font-mono text-[10px] bg-nw-warm-black/60 border border-nw-bronze/15 rounded p-2 max-h-40 overflow-y-auto">
            {log.map((l, i) => (
              <div key={i} className={l.kind === "ok" ? "text-green-400" : l.kind === "err" ? "text-red-400" : "text-nw-soft-white/70"}>
                {l.line}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-display font-bold">Recent generations</h3>
          <button onClick={load} className="text-nw-soft-white/40 hover:text-nw-soft-white">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {loading ? (
          <div className="text-xs text-nw-soft-white/60 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> loading…</div>
        ) : recent.length === 0 ? (
          <div className="nw-glass rounded-lg p-8 text-center text-sm text-nw-soft-white/60">
            No generations yet. Type a brief above and click Generate.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {recent.map((a) => (
              <div key={a.id} className={`nw-glass rounded-lg overflow-hidden flex flex-col ${activeWfId === a.workflow_id ? "ring-2 ring-nw-bronze" : ""}`}>
                <div className="aspect-square bg-nw-warm-black/60 relative">
                  <MediaThumb
                    url={a.uri}
                    mime={a.media_type === "video" ? "video/mp4" : a.media_type === "image" ? "image/png" : "application/octet-stream"}
                  />
                  {a.review && typeof a.review.overall === "number" && (
                    <div
                      className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                        a.review.overall >= 0.8 ? "bg-green-600/90 text-white" :
                        a.review.overall >= 0.6 ? "bg-yellow-600/90 text-white" :
                                                  "bg-red-600/90 text-white"
                      }`}
                      title={`safety ${a.review.safety} · brand ${a.review.brandAdherence} · product ${a.review.productConsistency}${a.review.failureTags?.length ? " · ⚠ " + a.review.failureTags.join(", ") : ""}`}
                    >
                      {Math.round(a.review.overall * 100)}
                    </div>
                  )}
                </div>
                <div className="p-2 text-[10px] font-mono space-y-0.5">
                  <div className="text-nw-bronze">{a.provider_id}/{a.model_id.split("/").pop()}</div>
                  <div className="text-nw-soft-white/50">wf {a.workflow_id.slice(0, 8)}</div>
                  <div className="flex items-center justify-between mt-1">
                    <a href={a.uri} target="_blank" rel="noreferrer" className="text-nw-bronze hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> open
                    </a>
                    <button
                      onClick={() => setSchedTarget({ url: a.uri, copy: "" })}
                      className="text-nw-bronze hover:underline flex items-center gap-1"
                      title="Send to Scheduler"
                    >
                      <Send className="w-3 h-3" /> schedule
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SendToScheduler
        open={!!schedTarget}
        onClose={() => setSchedTarget(null)}
        mediaUrl={schedTarget?.url ?? ""}
        initialCopy={schedTarget?.copy ?? brief.slice(0, 240)}
      />
    </div>
  );
}
