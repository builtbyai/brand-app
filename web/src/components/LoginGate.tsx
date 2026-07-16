import React, { useState } from "react";
import { useAuth } from "../lib/auth-context";
import {
  Loader2, ArrowRight, Lock, Mail, ShieldCheck, Network, Database, Cpu,
} from "lucide-react";

const PILLARS = [
  {
    Icon: Network,
    label: "Four brands, one engine",
    body: "Northwind Build · Northwind Tech · Northwind Fit · Northwind Members — coordinated through a single operating system.",
  },
  {
    Icon: Database,
    label: "Semantic memory",
    body: "Every voice note, positioning doc, audience profile and standard — vectorized, instantly recallable.",
  },
  {
    Icon: Cpu,
    label: "Fleet-routed reasoning",
    body: "Gemini, OpenAI, and a self-hosted Ollama backend — chosen per task, never bottlenecked.",
  },
];

export default function LoginGate() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try { await login(email, password); }
    catch (e: any) { setErr(e?.body?.error ?? "Invalid credentials"); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-nw-bg text-nw-text">
      {/* Cinematic background — three layered radial glows in steel-blue */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 -left-20 h-[560px] w-[680px] rounded-full blur-[120px] opacity-50"
          style={{ background: "radial-gradient(circle, rgba(93,168,240,0.55) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 right-[-10%] h-[520px] w-[620px] rounded-full blur-[110px] opacity-35"
          style={{ background: "radial-gradient(circle, rgba(74,144,226,0.45) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-20%] left-1/3 h-[420px] w-[560px] rounded-full blur-[120px] opacity-25"
          style={{ background: "radial-gradient(circle, rgba(200,215,225,0.25) 0%, transparent 70%)" }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(232,236,239,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(232,236,239,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 70% at 50% 30%, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 30%, black 30%, transparent 80%)",
          }}
        />
      </div>

      <div className="relative min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT — brand statement */}
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-16 border-r border-nw-border/60">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="nw-pulse-ring h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--color-nw-steel-light)" }}
            />
            <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-nw-text-muted">
              Northwind Systems · Brand OS · Online
            </span>
          </div>

          <div className="max-w-xl">
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-nw-steel-light mb-5">
              Command Center
            </p>
            <h1 className="font-display leading-[0.95] mb-6">
              <span className="block nw-wordmark text-[88px] xl:text-[112px]">NORTH</span>
              <span className="block nw-wordmark-sub text-2xl xl:text-3xl mt-3">
                Systems
              </span>
            </h1>
            <p className="font-display text-xl xl:text-2xl text-nw-text leading-snug max-w-md">
              One vision.<br />
              Four brands.<br />
              <span className="text-nw-steel-light">Built to win.</span>
            </p>
            <p className="mt-6 text-sm text-nw-text-muted max-w-md leading-relaxed">
              The private operating system behind every word, image, video, voice and standard that goes out under Northwind. Brand strategy, content, campaigns, and outreach — coordinated in one place.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 max-w-xl">
            {PILLARS.map((p) => (
              <div
                key={p.label}
                className="nw-glass p-4 hover:border-nw-border-accent transition-colors"
              >
                <p.Icon className="h-4 w-4 text-nw-steel-light mb-2.5" />
                <p className="font-display font-semibold text-[12.5px] text-nw-text leading-tight">
                  {p.label}
                </p>
                <p className="mt-1.5 text-[11px] text-nw-text-muted leading-relaxed">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — sign-in card */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[400px]">
            {/* Mobile-only wordmark */}
            <div className="lg:hidden mb-8 text-center">
              <span className="nw-wordmark text-5xl">NORTH</span>
              <div className="nw-wordmark-sub text-[11px] mt-1">Systems</div>
              <p className="mt-3 text-xs text-nw-text-muted">Brand OS · Command Center</p>
            </div>

            <div className="nw-glass-glow p-7 sm:p-8 relative">
              <span
                aria-hidden
                className="absolute -top-px left-8 right-8 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(93,168,240,0.6), transparent)",
                }}
              />

              <div className="flex items-center gap-2 mb-6">
                <Lock className="h-4 w-4 text-nw-steel-light" />
                <h2 className="font-display text-base font-semibold text-nw-text">
                  Restricted access
                </h2>
              </div>
              <p className="text-xs text-nw-text-muted mb-6 leading-relaxed">
                Authorized operators only. Authenticate with your Northwind Systems credentials to enter the command center.
              </p>

              <form onSubmit={onSubmit} className="space-y-3.5">
                <label className="block">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-nw-text-subtle">
                    Email
                  </span>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-nw-text-subtle" />
                    <input
                      type="email"
                      autoFocus
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="nw-input w-full pl-9 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-nw-text-subtle">
                    Passphrase
                  </span>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-nw-text-subtle" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="nw-input w-full pl-9 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </label>

                {err && (
                  <div className="text-xs text-red-300 bg-red-900/15 border border-red-700/30 rounded-md px-3 py-2 flex items-center gap-2">
                    <span className="nw-dot nw-dot-danger" /> {err}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !email || !password}
                  className="nw-btn-primary w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-display tracking-wide uppercase mt-1.5"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Enter command center <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 pt-5 border-t border-nw-border flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-nw-text-subtle">
                <ShieldCheck className="h-3 w-3 text-nw-steel-light" />
                Session is HTTP-only · TLS to Cloudflare edge
              </div>
            </div>

            <p className="mt-6 text-center text-[10px] font-mono uppercase tracking-[0.32em] text-nw-text-subtle">
              Build · Document · Automate · Compound
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
