import { useEffect, useState } from "react";
import { api } from "../lib/api";
import {
  BookOpen, Sparkles, Network, Home, Server, Dumbbell, ArrowUpRight,
  Database, Activity, Send, Camera, Crosshair, Settings as Gear,
  Image as ImageIcon, Film, Calendar, Users, ChevronRight,
} from "lucide-react";

interface SectionMeta {
  id: string; parent_brand: string | null; title: string;
  rel_path: string; word_count: number; updated_at: string;
}

interface Stats {
  sectionCount: number;
  brandCounts: Record<string, number>;
  lastIngest: { started_at: string; status: string; files_changed: number | null; chunks_upserted: number | null } | null;
  totalWords: number;
}

const BRANDS = [
  { key: "northwind",      label: "Northwind",         tagline: "Parent voice",     Icon: BookOpen,  accent: "#E8ECEF" },
  { key: "northwind-build",   label: "Northwind Build",       tagline: "Field work",       Icon: Home,      accent: "#F4A261" },
  { key: "northwind-tech",       label: "Northwind Tech",           tagline: "B2B SaaS",  Icon: Server,    accent: "#5DA8F0" },
  { key: "northwind-fit", label: "Northwind Fit",     tagline: "Physical proof",   Icon: Dumbbell,  accent: "#E0717C" },
  { key: "northwind-members",      label: "Northwind Members",          tagline: "Premium private",  Icon: Sparkles,  accent: "#C8A2C8" },
  { key: "shared",          label: "Shared / OS",         tagline: "Worldview · law",  Icon: Database,  accent: "#9098A0" },
];

const EDGE = [
  { Icon: Crosshair,  label: "Real-world experience",   desc: "Field. Office. Trenches." },
  { Icon: Camera,     label: "Documented everything",    desc: "Proof. Process. Performance." },
  { Icon: Gear,       label: "Systems that scale",       desc: "Build once. Scale forever." },
  { Icon: Network,    label: "Compounding leverage",     desc: "Four brands. One engine." },
];

const QUICK = [
  { id: "studio",             label: "Studio",            Icon: Sparkles, desc: "Unified generate flow" },
  { id: "image_lab",          label: "Image Lab",         Icon: ImageIcon, desc: "gpt-image-2 + refs" },
  { id: "video_lab",          label: "Video Lab",         Icon: Film, desc: "Scene → clip" },
  { id: "content_hub",        label: "Articles",          Icon: BookOpen, desc: "Ingested + drafted" },
  { id: "campaign_planner",   label: "Weekly plan",       Icon: Calendar, desc: "7-day grid" },
  { id: "sales_workspace",    label: "Sales",             Icon: Users, desc: "Prospect → send" },
];

export default function Dashboard({ onJump }: { onJump: (tab: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<SectionMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.listBrandSections().catch(() => ({ sections: [] as SectionMeta[] })),
      api.listBrandOsRuns().catch(() => ({ runs: [] })),
    ])
      .then(([secResp, runsResp]) => {
        if (cancelled) return;
        const sections = ((secResp as any).sections ?? []) as SectionMeta[];
        const runs = (runsResp as any).runs ?? [];
        const counts: Record<string, number> = {};
        let totalWords = 0;
        for (const s of sections) {
          const k = s.parent_brand ?? "shared";
          counts[k] = (counts[k] ?? 0) + 1;
          totalWords += s.word_count ?? 0;
        }
        setStats({
          sectionCount: sections.length,
          brandCounts: counts,
          lastIngest: runs[0] ?? null,
          totalWords,
        });
        // Most recently updated
        const sortedByDate = [...sections].sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
        setRecent(sortedByDate.slice(0, 6));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8 pb-2">
      {/* HERO — Northwind Systems statement */}
      <section className="relative overflow-hidden nw-card-raised nw-sheen-host">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-32 left-1/3 h-[360px] w-[700px] rounded-full blur-[110px] opacity-45"
            style={{ background: "radial-gradient(circle, rgba(93,168,240,0.55) 0%, transparent 65%)" }}
          />
          <div
            className="absolute -bottom-32 -right-20 h-[320px] w-[520px] rounded-full blur-[100px] opacity-30"
            style={{ background: "radial-gradient(circle, rgba(74,144,226,0.45) 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative p-7 sm:p-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="nw-pulse-ring h-2 w-2 rounded-full" style={{ background: "var(--color-nw-steel-light)" }} />
            <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-nw-text-subtle">
              Brand OS · Command Center · Online
            </p>
          </div>

          <h1 className="font-display leading-[0.95]">
            <span className="nw-wordmark text-5xl sm:text-7xl">NORTH</span>
            <span className="nw-wordmark-sub text-xl sm:text-2xl ml-3">Systems</span>
          </h1>

          <p className="mt-5 font-display text-lg sm:text-xl text-nw-text leading-snug">
            One vision. Four brands. <span className="text-nw-steel-light">Built to win.</span>
          </p>
          <p className="mt-2 text-sm text-nw-text-muted max-w-2xl leading-relaxed">
            The private operating system behind every word, image, video and standard going out under Northwind — semantic memory across positioning, audience, mythology and laws, backed by Workers AI and a self-hosted LLM router.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={() => onJump("brand_os")} className="nw-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-display tracking-wide uppercase">
              <BookOpen className="h-3.5 w-3.5" /> Browse Brand OS
            </button>
            <button onClick={() => onJump("brand_os")} className="nw-btn-ghost inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-display tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Ask Brand OS
            </button>
            <button onClick={() => onJump("studio")} className="nw-btn-ghost inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-display tracking-wide uppercase">
              <Network className="h-3.5 w-3.5" /> Open studio
            </button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sections"
          value={loading ? "—" : stats?.sectionCount.toLocaleString() ?? "0"}
          sub="brand-os markdown"
          Icon={Database}
        />
        <StatCard
          label="Total words"
          value={loading ? "—" : (stats?.totalWords ?? 0).toLocaleString()}
          sub="across the library"
          Icon={BookOpen}
        />
        <StatCard
          label="Last ingest"
          value={loading ? "—" : (stats?.lastIngest?.started_at?.slice(0, 10) ?? "never")}
          sub={stats?.lastIngest ? `${stats.lastIngest.files_changed ?? 0} changed · ${stats.lastIngest.chunks_upserted ?? 0} chunks` : "run scripts/ingest.mjs"}
          Icon={Activity}
          status={stats?.lastIngest?.status === "ok" ? "ok" : stats?.lastIngest?.status === "failed" ? "fail" : undefined}
        />
        <StatCard
          label="LLM backends"
          value="2"
          sub="Gemini · Ollama qwq:32b"
          Icon={Sparkles}
        />
      </section>

      {/* Brand grid */}
      <section>
        <SectionHeader title="The brand operating system" eyebrow="Browse · by brand" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {BRANDS.map((b) => {
            const count = stats?.brandCounts?.[b.key] ?? 0;
            return (
              <button
                key={b.key}
                onClick={() => onJump("brand_os")}
                className="nw-card nw-card-hover p-5 text-left group relative overflow-hidden"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ background: b.accent, opacity: 0.85 }}
                />
                <div className="flex items-start gap-3">
                  <span
                    className="h-9 w-9 rounded-md flex items-center justify-center border border-nw-border"
                    style={{ background: "rgba(27,35,48,0.7)", color: b.accent }}
                  >
                    <b.Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-semibold text-nw-text leading-tight">{b.label}</p>
                    <p className="mt-0.5 text-[11px] text-nw-text-muted">{b.tagline}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-nw-text-subtle group-hover:text-nw-steel-light transition" />
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-nw-text-subtle">
                  <span>{count} {count === 1 ? "section" : "sections"}</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="nw-dot nw-dot-info" /> indexed
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recently updated + Edge pillars side by side on large screens */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHeader title="Recently updated" eyebrow="Library" />
          <div className="nw-card divide-y divide-nw-border">
            {loading && (
              <>
                <RecentSkeleton />
                <RecentSkeleton />
                <RecentSkeleton />
              </>
            )}
            {!loading && recent.length === 0 && (
              <div className="p-4 text-xs text-nw-text-subtle">No sections ingested yet.</div>
            )}
            {!loading && recent.map((s) => (
              <button
                key={s.id}
                onClick={() => onJump("brand_os")}
                className="w-full text-left px-4 py-3 hover:bg-nw-surface-1 transition flex items-start gap-3 group"
              >
                <span className="brand-tag-bar mt-1.5 flex-shrink-0" style={{ background: brandColor(s.parent_brand) }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-display font-semibold text-nw-text leading-tight truncate">{s.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-nw-text-subtle truncate">
                    {s.parent_brand ?? "shared"} · {s.word_count.toLocaleString()} words
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-nw-text-subtle group-hover:text-nw-steel-light transition mt-1" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="The Northwind Systems edge" eyebrow="Pillars" />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
            {EDGE.map((e) => (
              <div key={e.label} className="nw-card p-4 flex items-start gap-3">
                <span className="h-8 w-8 rounded-md border border-nw-border bg-nw-surface-1 text-nw-steel-light flex items-center justify-center flex-shrink-0">
                  <e.Icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-display text-[13px] font-semibold text-nw-text uppercase tracking-[0.06em]">{e.label}</p>
                  <p className="mt-1 text-[12px] text-nw-text-muted leading-relaxed">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick workspaces */}
      <section>
        <SectionHeader title="Jump back into the studio" eyebrow="Workspaces" />
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK.map((w) => (
            <button
              key={w.id}
              onClick={() => onJump(w.id)}
              className="nw-card nw-card-hover p-3.5 text-left group"
            >
              <w.Icon className="h-4 w-4 text-nw-steel-light mb-2.5" />
              <p className="text-xs font-display font-semibold text-nw-text leading-tight">{w.label}</p>
              <p className="mt-1 text-[10px] text-nw-text-subtle leading-relaxed">{w.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <p className="text-center text-[10px] font-mono uppercase tracking-[0.32em] text-nw-text-subtle pt-2">
        Build · Document · Automate · Compound
      </p>
    </div>
  );
}

function brandColor(brand: string | null): string {
  switch (brand) {
    case "northwind":      return "#E8ECEF";
    case "northwind-build":   return "#F4A261";
    case "northwind-tech":       return "#5DA8F0";
    case "northwind-fit": return "#E0717C";
    case "northwind-members":      return "#C8A2C8";
    default:                return "#9098A0";
  }
}

function StatCard({
  label, value, sub, Icon, status,
}: { label: string; value: string; sub: string; Icon: any; status?: "ok" | "fail" }) {
  return (
    <div className="nw-card p-4 relative">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-nw-steel-light" />
        <p className="font-mono text-[10px] tracking-widest uppercase text-nw-text-subtle">{label}</p>
        {status && (
          <span className={`ml-auto nw-dot ${status === "ok" ? "nw-dot-success" : "nw-dot-danger"}`} />
        )}
      </div>
      <p className="font-display text-2xl text-nw-text tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] text-nw-text-muted">{sub}</p>
    </div>
  );
}

function SectionHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-nw-steel-light">{eyebrow}</p>
        <h2 className="mt-1 font-display text-lg text-nw-text">{title}</h2>
      </div>
      <div className="flex-1 ml-4 h-px bg-gradient-to-r from-transparent via-nw-border-accent to-transparent" />
    </div>
  );
}

function RecentSkeleton() {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="nw-skeleton h-3.5 w-1 rounded-full" />
      <div className="flex-1">
        <div className="nw-skeleton h-3 w-2/3 mb-1.5" />
        <div className="nw-skeleton h-2.5 w-1/3" />
      </div>
    </div>
  );
}
