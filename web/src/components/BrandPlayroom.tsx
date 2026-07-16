import React, { useState } from "react";
import { Copy, Check, Palette, FileCode, CheckSquare, Sparkles } from "lucide-react";

export default function BrandPlayroom() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const tokens = [
    { hex: "#C3A35B", name: "Golden Bronze", code: "var(--nw-bronze)", desc: "Primary CTAs, badges, links, active indicators, accents" },
    { hex: "#D4B975", name: "Bronze Light", code: "var(--nw-bronze-light)", desc: "Hover sheen, gradient glow, secondary tags" },
    { hex: "#A38645", name: "Bronze Dark", code: "var(--nw-bronze-dark)", desc: "Pressed/focus states, card borders" },
    { hex: "#51514F", name: "Charcoal", code: "var(--nw-charcoal)", desc: "Secondary text, metadata labels, rules" },
    { hex: "#35322A", name: "Charcoal Brown", code: "var(--nw-brown)", desc: "Default dark cards, secondary panel fillings" },
    { hex: "#272011", name: "Dark Coffee", code: "var(--nw-coffee)", desc: "Header containers, section backings, active hubs" },
    { hex: "#EBEBEA", name: "Alabaster", code: "var(--nw-alabaster)", desc: "High-contrast reading canvas, main blocks text" },
    { hex: "#120F0F", name: "Warm Black", code: "var(--nw-warm-black)", desc: "Background layout, primary contrast backing" },
    { hex: "#F7F7F5", name: "Soft White", code: "var(--nw-soft-white)", desc: "Primary font color, glowing titles" }
  ];

  const boilerplateCss = `:root {
  --nw-bronze: #C3A35B;
  --nw-bronze-light: #D4B975;
  --nw-bronze-dark: #A38645;
  --nw-charcoal: #51514F;
  --nw-brown: #35322A;
  --nw-coffee: #272011;
  --nw-alabaster: #EBEBEA;
  --nw-warm-black: #120F0F;
  --nw-soft-white: #F7F7F5;
}`;

  const boilerplateMdx = `<MarketingShell
  brand="Northwind"
  logoSrc="https://example.com/images/northwind.svg"
  theme="bronze-charcoal"
  background="alabaster"
  nav={[
    { label: "Blog", href: "/blog" },
    { label: "Guides", href: "/guides" },
    { label: "Reviews", href: "/reviews" },
    { label: "Get Started", href: "/get-started" }
  ]}
/>`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 1800);
  };

  return (
    <div className="space-y-8" id="playroom-section">
      
      {/* Visual tokens grid */}
      <div className="space-y-4 text-left">
        <h3 className="text-xs font-mono text-nw-bronze tracking-widest font-black uppercase flex items-center gap-2">
          <Palette className="w-4 h-4 text-nw-bronze" />
          Brand visual tokens
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="brand-system-tokens-grid">
          {tokens.map((tok) => (
            <div
              key={tok.hex}
              className="nw-glass p-4 rounded-xl flex items-center justify-between gap-4 group hover:border-nw-bronze/25 transition-colors"
              id={`token-card-${tok.hex.substring(1)}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg shrink-0 border border-nw-soft-white/10"
                  style={{ backgroundColor: tok.hex }}
                />
                <div className="font-sans">
                  <h4 className="text-xs font-semibold text-nw-soft-white">{tok.name}</h4>
                  <span className="text-[10px] font-mono text-nw-bronze-light font-bold block">{tok.hex}</span>
                  <p className="text-[10px] text-nw-soft-white/45 font-light leading-snug mt-0.5">{tok.desc}</p>
                </div>
              </div>

              <button
                onClick={() => handleCopy(tok.hex, tok.name)}
                className="p-1 px-1.5 hover:bg-nw-brown/30 border border-nw-bronze/10 text-nw-charcoal hover:text-nw-bronze rounded transition-all cursor-pointer"
                id={`copy-token-${tok.hex.substring(1)}`}
              >
                {copiedToken === tok.name ? <Check className="w-3.5 h-3.5 text-nw-bronze" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Code Boilerplate Copier Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left" id="boilerplates-setup-grid">
        {/* CSS Tokens Boilerplate */}
        <div className="nw-glass rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-nw-bronze/10">
            <span className="text-[10px] font-mono text-nw-bronze uppercase tracking-wider font-bold">
              Boilerplate CSS variables
            </span>
            <button
              onClick={() => handleCopy(boilerplateCss, "css_boiler")}
              className="p-1 text-nw-charcoal hover:text-nw-bronze transition-colors cursor-pointer"
              id="copy-css-boilerplate-btn"
            >
              {copiedToken === "css_boiler" ? <Check className="w-3.5 h-3.5 text-nw-bronze" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <pre className="p-3 bg-nw-warm-black/90 font-mono text-[9px] text-[#EBEBEA] rounded-lg border border-nw-bronze/5 select-all overflow-x-auto leading-relaxed">
            {boilerplateCss}
          </pre>
        </div>

        {/* MDX Shell Boilerplate */}
        <div className="nw-glass rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-nw-bronze/10">
            <span className="text-[10px] font-mono text-nw-bronze uppercase tracking-wider font-bold">
              Boilerplate MDX Components
            </span>
            <button
              onClick={() => handleCopy(boilerplateMdx, "mdx_boiler")}
              className="p-1 text-nw-charcoal hover:text-nw-bronze transition-colors cursor-pointer"
              id="copy-mdx-boilerplate-btn"
            >
              {copiedToken === "mdx_boiler" ? <Check className="w-3.5 h-3.5 text-nw-bronze" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <pre className="p-3 bg-nw-warm-black/90 font-mono text-[9px] text-[#EBEBEA] rounded-lg border border-nw-bronze/5 select-all overflow-x-auto leading-relaxed">
            {boilerplateMdx}
          </pre>
        </div>
      </div>

      {/* Brand system principles description block */}
      <div className="bg-nw-coffee/10 border-l border-nw-bronze/20 p-5 rounded-r-xl text-left font-sans space-y-2 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 nw-hud-accent pointer-events-none" />
        <h4 className="text-xs uppercase font-mono tracking-widest text-nw-bronze-light font-black flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-nw-bronze" />
          DESIGN HONESTY & RIGOR
        </h4>
        <p className="text-[11px] leading-relaxed text-[#EBEBEA] font-light">
          The suite respects absolute structural honesty. Standard visual modules remain functional-first: Alabaster provides readability under the detailed article text, Dark Coffee frames primary action headings, and Golden Bronze is reserved strictly for interactive feedback, buttons, and metrics.
        </p>
      </div>

    </div>
  );
}
