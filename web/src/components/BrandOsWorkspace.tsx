import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen, Send, Search, Sparkles, ChevronDown, ExternalLink,
  Bot, ServerCog, Copy, Check, Link as LinkIcon, ArrowUpRight, List,
  Hash, Clock, FileText, ChevronRight,
} from "lucide-react";

type Mode = "browse" | "ask" | "runs";

interface SectionMeta {
  id: string;
  parent_brand: string | null;
  ord: number;
  title: string;
  slug: string;
  rel_path: string;
  word_count: number;
  updated_at: string;
}

interface SectionFull extends SectionMeta {
  body_md: string;
  body_hash: string;
  ingested_at: string;
}

const BRAND_GROUPS: Array<{ key: string; label: string; tagline: string }> = [
  { key: "northwind",      label: "Northwind",        tagline: "Parent brand · the holding voice" },
  { key: "northwind-build",   label: "Northwind Build",      tagline: "Field operations · logistics · on-site work" },
  { key: "northwind-tech",       label: "Northwind Tech",          tagline: "B2B software · automation" },
  { key: "northwind-fit", label: "Northwind Fit",    tagline: "Fitness · physique · proof" },
  { key: "northwind-members",      label: "Northwind Members",         tagline: "Premium private content · the curtain" },
  { key: "shared",          label: "Shared / OS",        tagline: "Worldview · standards · governance" },
];

const BRAND_LABEL: Record<string, string> = Object.fromEntries(
  BRAND_GROUPS.map((b) => [b.key, b.label])
);

function obsidianLink(rel: string): string {
  const file = rel.replace(/\.md$/i, "");
  return `obsidian://open?vault=brand-os&file=${encodeURIComponent(file)}`;
}

function relTime(iso?: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

// Extract h2/h3 from raw markdown to build a TOC
function extractToc(md: string): Array<{ level: 2 | 3; text: string; anchor: string }> {
  const out: Array<{ level: 2 | 3; text: string; anchor: string }> = [];
  for (const raw of md.split(/\r?\n/)) {
    const m = /^(##{1,2})\s+(.*?)\s*$/.exec(raw);
    if (!m) continue;
    const level = m[1].length === 2 ? 2 : 3;
    const text = m[2].replace(/[`*_]+/g, "").trim();
    const anchor = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    out.push({ level: level as 2 | 3, text, anchor });
  }
  return out;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function BrandOsWorkspace() {
  const [mode, setMode] = useState<Mode>("browse");
  const [sections, setSections] = useState<SectionMeta[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ "northwind": true });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SectionFull | null>(null);
  const [bodyLoading, setBodyLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("brand-os:recent") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    setLoadingList(true);
    api.listBrandSections()
      .then(({ sections }) => setSections(sections))
      .catch(() => setSections([]))
      .finally(() => setLoadingList(false));
  }, []);

  // Resolve deep links: #brand-os/<sectionId>
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash || "";
      const m = /^#brand-os\/(.+)$/.exec(h);
      if (m) {
        setMode("browse");
        setSelectedId(decodeURIComponent(m[1]));
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  useEffect(() => {
    if (!selectedId) { setSelected(null); return; }
    setBodyLoading(true);
    api.getBrandSection(selectedId)
      .then(({ section }) => setSelected(section as SectionFull))
      .catch(() => setSelected(null))
      .finally(() => setBodyLoading(false));
    setRecent((prev) => {
      const next = [selectedId, ...prev.filter((x) => x !== selectedId)].slice(0, 8);
      try { localStorage.setItem("brand-os:recent", JSON.stringify(next)); } catch {}
      return next;
    });
  }, [selectedId]);

  const filtered = useMemo(() => {
    if (!filter) return sections;
    const q = filter.toLowerCase();
    return sections.filter(
      (s) => s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [sections, filter]);

  const grouped = useMemo(() => {
    const g: Record<string, SectionMeta[]> = Object.fromEntries(BRAND_GROUPS.map((b) => [b.key, []]));
    for (const s of filtered) {
      const key = s.parent_brand ?? "shared";
      if (!g[key]) g[key] = [];
      g[key].push(s);
    }
    // Stable sort by ord
    for (const k of Object.keys(g)) g[k].sort((a, b) => a.ord - b.ord);
    return g;
  }, [filtered]);

  const brandTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const s of sections) totals[s.parent_brand ?? "shared"] = (totals[s.parent_brand ?? "shared"] ?? 0) + 1;
    return totals;
  }, [sections]);

  return (
    <div className="space-y-5">
      {/* Mode strip + global filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-nw-border pb-3">
        <ModeBtn active={mode === "browse"} onClick={() => setMode("browse")} icon={BookOpen} label="Browse" />
        <ModeBtn active={mode === "ask"}    onClick={() => setMode("ask")}    icon={Sparkles} label="Ask Brand OS" />
        <ModeBtn active={mode === "runs"}   onClick={() => setMode("runs")}   icon={ServerCog} label="Ingest runs" />

        <div className="ml-auto flex items-center gap-2">
          {mode === "browse" && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-nw-text-subtle" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter sections…"
                className="nw-input pl-8 pr-3 py-1.5 text-xs w-56"
              />
            </div>
          )}
          <span className="text-[10px] font-mono uppercase tracking-widest text-nw-text-subtle">
            {loadingList ? "loading…" : `${sections.length} sections`}
          </span>
        </div>
      </div>

      {mode === "browse" && (
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_260px] lg:grid-cols-[300px_minmax(0,1fr)] grid-cols-1">
          {/* LEFT — section list */}
          <aside className="nw-card overflow-hidden flex flex-col max-h-[78vh]">
            <div className="px-3 py-2.5 border-b border-nw-border flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-widest uppercase text-nw-text-subtle">Library</p>
              <span className="text-[10px] font-mono text-nw-text-subtle">{filtered.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {BRAND_GROUPS.map((b) => {
                const items = grouped[b.key] ?? [];
                const total = brandTotals[b.key] ?? 0;
                if (filter && items.length === 0) return null;
                const open = openGroups[b.key] ?? false;
                return (
                  <div key={b.key} className="mb-1.5">
                    <button
                      onClick={() => setOpenGroups((g) => ({ ...g, [b.key]: !open }))}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-nw-surface-1 text-left group"
                    >
                      <ChevronDown
                        className={`h-3 w-3 transition-transform text-nw-text-subtle ${open ? "" : "-rotate-90"}`}
                      />
                      <span className="brand-chip flex-shrink-0" data-brand={b.key}>{b.label}</span>
                      <span className="ml-auto text-[10px] font-mono text-nw-text-subtle">
                        {filter ? items.length : total}
                      </span>
                    </button>
                    {open && (
                      <ul className="ml-1 mt-0.5 pl-3 border-l border-nw-border space-y-px">
                        {items.length === 0 && (
                          <li className="text-[11px] text-nw-text-subtle py-1 px-2">
                            {filter ? "no matches" : "no sections yet"}
                          </li>
                        )}
                        {items.map((s) => (
                          <li key={s.id}>
                            <button
                              onClick={() => setSelectedId(s.id)}
                              className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition flex items-center gap-1.5 ${
                                selectedId === s.id
                                  ? "bg-nw-steel-soft text-nw-text border border-nw-border-accent"
                                  : "text-nw-text-muted hover:bg-nw-surface-1 hover:text-nw-text border border-transparent"
                              }`}
                            >
                              <span className="font-mono text-[9px] text-nw-text-subtle w-7 text-right tabular-nums">
                                {String(s.ord).padStart(2, "0")}
                              </span>
                              <span className="flex-1 truncate">{s.title}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              {!loadingList && sections.length === 0 && (
                <div className="text-xs text-nw-text-subtle p-3 leading-relaxed">
                  No sections ingested yet.<br />
                  Run <code className="text-nw-steel-light">node scripts/ingest.mjs</code> from{" "}
                  <code>brand-os-app/</code>.
                </div>
              )}
            </div>
          </aside>

          {/* CENTER — reading view */}
          <article className="nw-card overflow-hidden flex flex-col max-h-[78vh]">
            {!selectedId && (
              <EmptyReadingState
                recent={recent}
                sections={sections}
                onPick={(id) => setSelectedId(id)}
                onAsk={() => setMode("ask")}
              />
            )}
            {selectedId && (
              <Reader
                loading={bodyLoading}
                section={selected}
                sectionId={selectedId}
              />
            )}
          </article>

          {/* RIGHT — TOC + related */}
          {selectedId && selected && (
            <aside className="hidden xl:flex flex-col gap-4 max-h-[78vh] overflow-y-auto">
              <TableOfContents body={selected.body_md} />
              <RelatedSections
                title={selected.title}
                excludeId={selected.id}
                onPick={(id) => setSelectedId(id)}
              />
            </aside>
          )}
        </div>
      )}

      {mode === "ask" && <AskPanel onJumpToSection={(id) => { setMode("browse"); setSelectedId(id); }} />}
      {mode === "runs" && <RunsPanel />}
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function ModeBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition border ${
        active
          ? "bg-nw-steel-soft text-nw-text border-nw-border-accent"
          : "text-nw-text-muted hover:text-nw-text hover:bg-nw-surface-1 border-transparent"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ---------------- Reader: header + actions + markdown body --------------- */

function Reader({ loading, section, sectionId }: { loading: boolean; section: SectionFull | null; sectionId: string }) {
  const [copied, setCopied] = useState<"" | "body" | "link">("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll on section change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [sectionId]);

  const onCopyBody = async () => {
    if (!section) return;
    try {
      await navigator.clipboard.writeText(section.body_md);
      setCopied("body"); setTimeout(() => setCopied(""), 1400);
    } catch {}
  };

  const onCopyLink = async () => {
    try {
      const url = `${location.origin}${location.pathname}#brand-os/${encodeURIComponent(sectionId)}`;
      await navigator.clipboard.writeText(url);
      setCopied("link"); setTimeout(() => setCopied(""), 1400);
    } catch {}
  };

  if (loading || !section) {
    return (
      <div className="p-8 space-y-3">
        <div className="nw-skeleton h-3 w-32" />
        <div className="nw-skeleton h-9 w-2/3" />
        <div className="nw-skeleton h-3 w-1/3" />
        <div className="nw-skeleton h-4 w-full mt-6" />
        <div className="nw-skeleton h-4 w-11/12" />
        <div className="nw-skeleton h-4 w-10/12" />
        <div className="nw-skeleton h-4 w-9/12" />
      </div>
    );
  }

  const brand = section.parent_brand ?? "shared";
  const readMin = Math.max(1, Math.round((section.word_count || 0) / 220));

  return (
    <>
      {/* Sticky header */}
      <header className="border-b border-nw-border bg-nw-surface-0/85 backdrop-blur-sm px-7 pt-6 pb-4">
        <div className="nw-brand-bar mb-4" />
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="brand-tag" data-brand={brand} style={{ color: "inherit" }}>
            <span className="brand-tag-bar" style={{ background: brandColor(brand) }} />
            <span>{BRAND_LABEL[brand] ?? brand}</span>
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase text-nw-text-subtle">
            <Hash className="inline-block h-3 w-3 mr-1 -mt-0.5" />
            {section.id}
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-[34px] font-bold text-nw-text leading-tight tracking-tight">
          {section.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-nw-text-subtle">
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3 w-3" /> {readMin} min read</span>
          <span className="inline-flex items-center gap-1.5"><FileText className="h-3 w-3" /> {section.word_count.toLocaleString()} words</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="nw-dot nw-dot-info" /> ingested {relTime(section.ingested_at)}
          </span>
          <span className="truncate">{section.rel_path}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <ActionPill onClick={onCopyBody} icon={copied === "body" ? Check : Copy}>
            {copied === "body" ? "Copied markdown" : "Copy markdown"}
          </ActionPill>
          <ActionPill onClick={onCopyLink} icon={copied === "link" ? Check : LinkIcon}>
            {copied === "link" ? "Copied link" : "Copy link"}
          </ActionPill>
          <a
            href={obsidianLink(section.rel_path)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-nw-surface-1 border border-nw-border text-nw-text-muted hover:text-nw-text hover:border-nw-border-strong transition"
            title="Open in Obsidian (vault = brand-os)"
          >
            <ExternalLink className="h-3 w-3" />
            Open in Obsidian
          </a>
        </div>
      </header>

      {/* Scrollable body */}
      <div ref={scrollRef} className="overflow-y-auto flex-1 px-7 py-7">
        <div className="nw-prose mx-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children, ...p }) => {
                const id = slugify(String(children));
                return <h1 id={id} {...p}>{children}<a href={`#${id}`} className="nw-prose-anchor">¶</a></h1>;
              },
              h2: ({ children, ...p }) => {
                const id = slugify(String(children));
                return <h2 id={id} {...p}>{children}<a href={`#${id}`} className="nw-prose-anchor">¶</a></h2>;
              },
              h3: ({ children, ...p }) => {
                const id = slugify(String(children));
                return <h3 id={id} {...p}>{children}<a href={`#${id}`} className="nw-prose-anchor">¶</a></h3>;
              },
              a: ({ href, children, ...p }) => (
                <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" {...p}>
                  {children}
                </a>
              ),
            }}
          >
            {section.body_md}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
}

function ActionPill({ onClick, icon: Icon, children }: { onClick: () => void; icon: any; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-nw-surface-1 border border-nw-border text-nw-text-muted hover:text-nw-text hover:border-nw-border-strong transition"
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}

function brandColor(brand: string): string {
  switch (brand) {
    case "northwind":      return "#E8ECEF";
    case "northwind-build":   return "#F4A261";
    case "northwind-tech":       return "#5DA8F0";
    case "northwind-fit": return "#E0717C";
    case "northwind-members":      return "#C8A2C8";
    default:                return "#9098A0";
  }
}

/* ---------------- Empty state with onboarding & recent --------------- */

function EmptyReadingState({
  recent, sections, onPick, onAsk,
}: { recent: string[]; sections: SectionMeta[]; onPick: (id: string) => void; onAsk: () => void }) {
  const byId = new Map(sections.map((s) => [s.id, s] as const));
  const recentSections = recent.map((id) => byId.get(id)).filter(Boolean) as SectionMeta[];
  // Surface a handful of high-value entry points
  const featured = sections
    .filter((s) => /00-master-blueprint|02-origin-story|17-mission|18-positioning|60-core-philosophy/i.test(s.id))
    .slice(0, 5);

  return (
    <div className="p-8 sm:p-10 flex-1 overflow-y-auto">
      <div className="nw-brand-bar w-32 mb-6" />
      <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-nw-steel-light">
        Brand OS · Reading Room
      </p>
      <h2 className="mt-2 font-display text-3xl text-nw-text leading-tight">
        Pick a doctrine.
      </h2>
      <p className="mt-3 text-sm text-nw-text-muted max-w-xl leading-relaxed">
        Every standard, story, voice rule, audience cut and architectural decision lives here as a navigable, citable section. Browse the library on the left or ask a question and the system returns the right paragraph plus its provenance.
      </p>

      <div className="mt-7 flex flex-wrap gap-2">
        <button onClick={onAsk} className="nw-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-display tracking-wide uppercase">
          <Sparkles className="h-3.5 w-3.5" /> Ask the brand OS
        </button>
      </div>

      {recentSections.length > 0 && (
        <div className="mt-9">
          <SubHead icon={Clock} label="Recently opened" />
          <div className="grid gap-2 sm:grid-cols-2 mt-3">
            {recentSections.map((s) => (
              <SectionTile key={s.id} s={s} onClick={() => onPick(s.id)} />
            ))}
          </div>
        </div>
      )}

      {featured.length > 0 && (
        <div className="mt-8">
          <SubHead icon={BookOpen} label="Start here" />
          <div className="grid gap-2 sm:grid-cols-2 mt-3">
            {featured.map((s) => (
              <SectionTile key={s.id} s={s} onClick={() => onPick(s.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubHead({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 text-nw-text-muted">
      <Icon className="h-3.5 w-3.5 text-nw-steel-light" />
      <p className="font-mono text-[10px] uppercase tracking-[0.24em]">{label}</p>
      <div className="flex-1 h-px bg-gradient-to-r from-nw-border to-transparent ml-2" />
    </div>
  );
}

function SectionTile({ s, onClick }: { s: SectionMeta; onClick: () => void }) {
  const brand = s.parent_brand ?? "shared";
  return (
    <button
      onClick={onClick}
      className="nw-card nw-card-hover p-3.5 text-left group flex items-start gap-3"
    >
      <span className="brand-tag-bar mt-1.5 flex-shrink-0" style={{ background: brandColor(brand) }} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-[13px] font-semibold text-nw-text leading-tight truncate">{s.title}</p>
        <p className="mt-1 font-mono text-[10px] tracking-wider uppercase text-nw-text-subtle truncate">
          {BRAND_LABEL[brand] ?? brand} · {s.word_count.toLocaleString()} words
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-nw-text-subtle group-hover:text-nw-steel-light transition" />
    </button>
  );
}

/* ---------------- Right rail: TOC + related --------------- */

function TableOfContents({ body }: { body: string }) {
  const toc = useMemo(() => extractToc(body), [body]);
  if (toc.length === 0) return null;
  return (
    <div className="nw-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <List className="h-3.5 w-3.5 text-nw-steel-light" />
        <p className="font-mono text-[10px] tracking-[0.24em] uppercase text-nw-text-muted">
          On this page
        </p>
      </div>
      <ul className="space-y-0.5">
        {toc.map((h, i) => (
          <li key={i}>
            <a
              href={`#${h.anchor}`}
              className={`block text-[12px] leading-relaxed py-0.5 transition ${
                h.level === 2 ? "text-nw-text-muted hover:text-nw-text" : "pl-3 text-nw-text-subtle hover:text-nw-text-muted"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedSections({ title, excludeId, onPick }: { title: string; excludeId: string; onPick: (id: string) => void }) {
  const [hits, setHits] = useState<Array<{ sectionId: string; parentBrand: string; excerpt: string; score: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!title) return;
    setLoading(true);
    api.searchBrandOs(title, undefined, 6)
      .then(({ hits }) => setHits(hits.filter((h) => h.sectionId !== excludeId).slice(0, 5)))
      .catch(() => setHits([]))
      .finally(() => setLoading(false));
  }, [title, excludeId]);

  if (!loading && hits.length === 0) return null;

  return (
    <div className="nw-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ArrowUpRight className="h-3.5 w-3.5 text-nw-steel-light" />
        <p className="font-mono text-[10px] tracking-[0.24em] uppercase text-nw-text-muted">Related</p>
      </div>
      {loading && <div className="space-y-2">
        <div className="nw-skeleton h-10" />
        <div className="nw-skeleton h-10" />
        <div className="nw-skeleton h-10" />
      </div>}
      {!loading && (
        <ul className="space-y-1.5">
          {hits.map((h) => (
            <li key={h.sectionId + h.score}>
              <button
                onClick={() => onPick(h.sectionId)}
                className="w-full text-left p-2.5 rounded-md border border-nw-border hover:border-nw-border-accent hover:bg-nw-surface-1 transition group"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="brand-chip" data-brand={h.parentBrand}>{BRAND_LABEL[h.parentBrand] ?? h.parentBrand}</span>
                  <span className="text-[9px] font-mono text-nw-text-subtle tabular-nums">{h.score.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-nw-text-muted line-clamp-2 leading-relaxed">{h.excerpt}</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-nw-steel-light/80 group-hover:text-nw-steel-light truncate">{h.sectionId}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Ask panel --------------- */

function AskPanel({ onJumpToSection }: { onJumpToSection: (id: string) => void }) {
  const [question, setQuestion] = useState("");
  const [backend, setBackend] = useState<"gemini" | "ollama">("gemini");
  const [brand, setBrand] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [meta, setMeta] = useState<{ modelUsed: string; latencyMs: number; backendUsed: string } | null>(null);
  const [cites, setCites] = useState<Array<{ sectionId: string; parentBrand: string; score: number; excerpt: string }>>([]);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const SUGGESTIONS = [
    "What is the voice of Northwind Build?",
    "Summarize the Northwind Tech positioning in one paragraph.",
    "What is the brand promise to homeowners?",
    "How does Northwind Fit relate to Northwind Build?",
    "Which audiences does Northwind Members serve?",
  ];

  async function go(q?: string) {
    const final = (q ?? question).trim();
    if (!final || busy) return;
    setQuestion(final);
    setBusy(true); setError(""); setAnswer(""); setCites([]); setMeta(null);
    try {
      const r = await api.askBrandOs({ question: final, backend, brand: brand || undefined });
      setAnswer(r.answer);
      setCites(r.citations);
      setMeta({ modelUsed: r.modelUsed, latencyMs: r.latencyMs, backendUsed: r.backendUsed });
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (msg.includes("ollama_unreachable") || msg.includes("503")) {
        setError("Ollama backend unreachable. Switch to Gemini and retry.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="nw-card-raised p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <BackendChip current={backend} value="gemini" onClick={() => setBackend("gemini")} icon={Bot} label="Gemini" />
          <BackendChip current={backend} value="ollama" onClick={() => setBackend("ollama")} icon={ServerCog} label="Ollama · qwq:32b" />
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="ml-auto nw-input text-xs px-2.5 py-1.5"
          >
            <option value="">All brands</option>
            {BRAND_GROUPS.map((b) => (
              <option key={b.key} value={b.key}>{b.label}</option>
            ))}
          </select>
        </div>

        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") go(); }}
          placeholder="Ask the brand OS anything — voice, positioning, audience, mythology, standards…"
          rows={3}
          className="nw-input w-full p-3.5 text-[14px] leading-relaxed"
        />

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => go()}
            disabled={busy || !question.trim()}
            className="nw-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-display tracking-wide uppercase"
          >
            <Send className="h-3.5 w-3.5" />
            {busy ? "Asking…" : "Ask Brand OS"}
          </button>
          <span className="text-[11px] text-nw-text-subtle">⌘/Ctrl + Enter to submit</span>
        </div>

        {!answer && !busy && (
          <div className="mt-5 pt-4 border-t border-nw-border">
            <p className="font-mono text-[10px] tracking-[0.24em] uppercase text-nw-text-subtle mb-2.5">Try one of these</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => go(s)}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border border-nw-border bg-nw-surface-1 text-nw-text-muted hover:text-nw-text hover:border-nw-border-accent transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="nw-card p-3 border border-red-700/40 bg-red-900/10 text-xs text-red-300">
          {error}
        </div>
      )}

      {answer && (
        <div className="nw-card-raised p-6">
          <div className="nw-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </div>
          {meta && (
            <div className="mt-4 pt-3 border-t border-nw-border text-[10px] font-mono uppercase tracking-widest text-nw-text-subtle flex items-center gap-3">
              <span className="nw-dot nw-dot-info" />
              answered by {meta.backendUsed} · {meta.modelUsed} · {meta.latencyMs}ms
            </div>
          )}
        </div>
      )}

      {cites.length > 0 && (
        <div className="nw-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-nw-steel-light mb-3">Sources</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {cites.map((c) => (
              <li key={c.sectionId} className="border border-nw-border rounded-md p-3 bg-nw-surface-1 hover:border-nw-border-accent transition">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <button onClick={() => onJumpToSection(c.sectionId)} className="font-mono text-[11px] text-nw-steel-light hover:underline truncate">
                    {c.sectionId}
                  </button>
                  <span className="text-[10px] font-mono text-nw-text-subtle tabular-nums">{c.score.toFixed(3)}</span>
                </div>
                <span className="brand-chip mb-1.5" data-brand={c.parentBrand}>{BRAND_LABEL[c.parentBrand] ?? c.parentBrand}</span>
                <p className="text-xs text-nw-text-muted leading-relaxed mt-1.5">{c.excerpt}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BackendChip({ current, value, onClick, icon: Icon, label }: { current: string; value: string; onClick: () => void; icon: any; label: string }) {
  const active = current === value;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
        active
          ? "bg-nw-steel-soft text-nw-text border-nw-border-accent"
          : "bg-nw-surface-1 text-nw-text-muted border-nw-border hover:border-nw-border-strong"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

/* ---------------- Runs panel --------------- */

function RunsPanel() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    api.listBrandOsRuns().then(({ runs }) => setRuns(runs)).finally(() => setLoading(false));
  }, []);
  const ok    = runs.filter((r) => r.status === "ok").length;
  const total = runs.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Total runs"      value={loading ? "…" : String(total)}                          sub="all-time" />
        <Kpi label="Success rate"    value={loading ? "…" : total ? `${Math.round((ok / total) * 100)}%` : "—"} sub={`${ok}/${total} ok`} />
        <Kpi label="Last run"        value={loading ? "…" : (runs[0]?.started_at?.slice(0, 10) ?? "—")}         sub={runs[0] ? `${runs[0].chunks_upserted ?? 0} chunks` : "—"} />
      </div>

      <div className="nw-card p-4">
        {loading && <div className="text-xs text-nw-text-subtle">loading…</div>}
        {!loading && runs.length === 0 && (
          <div className="text-xs text-nw-text-subtle leading-relaxed">
            No ingest runs yet. From the project root, run{" "}
            <code className="text-nw-steel-light">node scripts/ingest.mjs</code>.
          </div>
        )}
        {runs.length > 0 && (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-nw-text-subtle border-b border-nw-border">
                <th className="text-left py-2 font-mono uppercase tracking-widest text-[10px]">Started</th>
                <th className="text-left font-mono uppercase tracking-widest text-[10px]">Status</th>
                <th className="text-right font-mono uppercase tracking-widest text-[10px]">Scanned</th>
                <th className="text-right font-mono uppercase tracking-widest text-[10px]">Changed</th>
                <th className="text-right font-mono uppercase tracking-widest text-[10px]">Chunks</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-nw-border/40">
                  <td className="py-2 font-mono text-nw-text">{r.started_at?.replace("T", " ").slice(0, 19)}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${
                      r.status === "ok" ? "text-green-400" : r.status === "failed" ? "text-red-400" : "text-yellow-400"
                    }`}>
                      <span className={`nw-dot ${r.status === "ok" ? "nw-dot-success" : r.status === "failed" ? "nw-dot-danger" : "nw-dot-warning"}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="text-right font-mono text-nw-text-muted tabular-nums">{r.files_scanned ?? "—"}</td>
                  <td className="text-right font-mono text-nw-text-muted tabular-nums">{r.files_changed ?? "—"}</td>
                  <td className="text-right font-mono text-nw-steel-light tabular-nums">{r.chunks_upserted ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="nw-card p-4">
      <p className="font-mono text-[10px] tracking-widest uppercase text-nw-text-subtle">{label}</p>
      <p className="mt-1.5 font-display text-2xl text-nw-text">{value}</p>
      <p className="mt-1 text-[11px] text-nw-text-muted">{sub}</p>
    </div>
  );
}
