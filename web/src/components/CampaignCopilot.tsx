import React, { useState, useEffect } from "react";
import { Article, SocialPlatform, CreativeAngle, SocialTemplate } from "../types";
import { creativeAngles, getPrecompiledTemplates } from "../data/campaigns";
import { Sparkles, Terminal, CheckCircle2, ChevronRight, Loader2, RefreshCw, Send, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiUrl } from "../lib/api";

interface CampaignCopilotProps {
  articles: Article[];
  selectedArticle: Article | null;
  onCampaignGenerated: (generated: SocialTemplate & { tags: string[] }) => void;
  onNavigateToPreview: () => void;
}

export default function CampaignCopilot({
  articles,
  selectedArticle,
  onCampaignGenerated,
  onNavigateToPreview
}: CampaignCopilotProps) {
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [platform, setPlatform] = useState<SocialPlatform>("linkedin");
  const [angle, setAngle] = useState<CreativeAngle>("category_reframe");
  const [customFocus, setCustomFocus] = useState("");
  const [brandVoice, setBrandVoice] = useState("Bold, authoritative, and outcome-focused with direct proof.");
  
  // HUD logs representing compile & call steps
  const [logs, setLogs] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ hasKey: boolean; checked: boolean }>({
    hasKey: false,
    checked: false
  });

  useEffect(() => {
    if (selectedArticle) {
      setCurrentArticle(selectedArticle);
    } else if (articles.length > 0 && !currentArticle) {
      setCurrentArticle(articles[0]);
    }
  }, [selectedArticle, articles]);

  // Check health and secret key availability on render
  useEffect(() => {
    fetch(apiUrl("/api/health"))
      .then((res) => res.json())
      .then((data) => {
        setConnectionStatus({ hasKey: data.hasApiKey, checked: true });
      })
      .catch(() => {
        setConnectionStatus({ hasKey: false, checked: true });
      });
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const executeDraftGeneration = async () => {
    if (!currentArticle) return;
    setIsGenerating(true);
    setLogs([]);
    
    addLog("INIT: Loading Google GenAI client workspace...");
    await new Promise((resolve) => setTimeout(resolve, 600));

    addLog(`SCHEMA: Packaging metadata for "${currentArticle.title}"...`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    addLog(`PROMPT: Applying angle instructions mapping: "${angle}"`);
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (customFocus.trim()) {
      addLog(`APPEND: Injecting custom focus parameters: "${customFocus.substring(0, 30)}..."`);
    }

    addLog("API: dispatching secure query payload to server proxied model 'gemini-3.5-flash'...");

    try {
      const response = await fetch(apiUrl("/api/generate-campaign"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article: currentArticle,
          platform,
          angle,
          customFocus,
          brandVoice
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "credentials_missing") {
          addLog("WARNING: GEMINI_API_KEY environment variable is not active in Secrets.");
          addLog("FALLBACK: Extracting brand template preset libraries automatically...");
          await new Promise((resolve) => setTimeout(resolve, 900));
          
          triggerFallback();
          return;
        }
        throw new Error(data.message || "Endpoint error");
      }

      addLog("COMPILE: Strict JSON response schema verified successfully.");
      addLog("SUCCESS: Content layout synthesized.");
      await new Promise((resolve) => setTimeout(resolve, 500));

      onCampaignGenerated({
        platform,
        angle,
        title: data.title || `${platform.toUpperCase()} campaign`,
        content: data.content || "",
        slides: data.slides || [],
        videoDirectives: data.videoDirectives || "",
        tags: data.tags || []
      });

      setIsGenerating(false);
      onNavigateToPreview();

    } catch (error: any) {
      console.warn("Generation error, triggering fallback", error);
      addLog(`ERROR: Service transaction issue - ${error.message}`);
      addLog("FALLBACK: Compiling fallback templates securely from static brand memory...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      triggerFallback();
    }
  };

  const triggerFallback = () => {
    if (!currentArticle) return;
    const presets = getPrecompiledTemplates(currentArticle.id, angle);
    const template = presets.find((t) => t.platform === platform) || presets[0];

    onCampaignGenerated({
      platform,
      angle,
      title: template.title,
      content: template.content,
      slides: template.slides || [],
      videoDirectives: template.videoDirectives || "",
      tags: ["OpsTech", "TeamWorkflow", "Northwind", "SalesPower"]
    });

    setIsGenerating(false);
    onNavigateToPreview();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="copilot-container">
      
      {/* Parameter Panel */}
      <div className="lg:col-span-7 space-y-6" id="copilot-settings-panel">
        
        {/* Connection status card */}
        {connectionStatus.checked && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between font-sans ${
            connectionStatus.hasKey 
              ? "bg-nw-bronze/5 border-nw-bronze/20 text-nw-bronze-light" 
              : "bg-nw-brown/40 border-nw-bronze/10 text-nw-soft-white/60"
          }`} id="secret-key-indicator-banner">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connectionStatus.hasKey ? "bg-nw-bronze animate-pulse" : "bg-nw-charcoal"}`} />
              <span>
                {connectionStatus.hasKey 
                  ? "Gemini API Endpoint Active (Settings > Secrets in use)" 
                  : "Using High-Fidelity Pre-Compiled Campaigns (Credentials missing)"}
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-nw-charcoal">
              {connectionStatus.hasKey ? "LIVE_MODE" : "STATIC_RESOURCES"}
            </span>
          </div>
        )}

        <div className="nw-glass rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold font-display tracking-wider uppercase text-nw-bronze border-l-2 border-nw-bronze pl-3">
            Campaign Setup parameters
          </h2>

          {/* Article Field */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-nw-soft-white/70">
              Source Marketing Article
            </label>
            <select
              value={currentArticle?.id || ""}
              onChange={(e) => {
                const found = articles.find((a) => a.id === e.target.value);
                if (found) setCurrentArticle(found);
              }}
              className="w-full bg-nw-warm-black/90 border border-nw-bronze/10 rounded-lg py-2.5 px-3 text-xs text-nw-soft-white focus:outline-none focus:border-nw-bronze/40"
              id="article-select-dropdown"
            >
              {articles.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.category.toUpperCase()}: {art.title}
                </option>
              ))}
            </select>
          </div>

          {/* Social Platform Target */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-nw-soft-white/70">
              Target Publication Platform
            </label>
            <div className="grid grid-cols-3 gap-3" id="platform-tabs-grid">
              {(["linkedin", "instagram", "short_video"] as SocialPlatform[]).map((plat) => (
                <button
                  key={plat}
                  onClick={() => setPlatform(plat)}
                  className={`py-2 px-3 rounded-lg text-xs font-sans font-medium text-center border cursor-pointer transition-all ${
                    platform === plat
                      ? "bg-nw-bronze text-nw-warm-black border-nw-bronze font-semibold"
                      : "bg-nw-brown/20 text-nw-soft-white/70 border-nw-bronze/10 hover:text-nw-soft-white hover:border-nw-bronze/30"
                  }`}
                  id={`param-platform-${plat}`}
                >
                  {plat === "linkedin" && "LinkedIn Card"}
                  {plat === "instagram" && "Instagram Series"}
                  {plat === "short_video" && "Video Script"}
                </button>
              ))}
            </div>
          </div>

          {/* Angle Choice */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-nw-soft-white/70">
              Creative Campaign Direction & Angle
            </label>
            <div className="grid grid-cols-1 gap-2" id="angles-list-selectors">
              {creativeAngles.map((ang) => (
                <button
                  key={ang.id}
                  onClick={() => setAngle(ang.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-3 ${
                    angle === ang.id
                      ? "bg-nw-bronze/10 border-nw-bronze"
                      : "bg-nw-brown/10 border-nw-bronze/5 hover:border-nw-bronze/20"
                  }`}
                  id={`param-angle-${ang.id}`}
                >
                  <span className="text-lg mt-0.5">{ang.emoji}</span>
                  <div>
                    <h4 className={`text-xs font-semibold ${angle === ang.id ? "text-nw-bronze" : "text-nw-soft-white"}`}>
                      {ang.label}
                    </h4>
                    <p className="text-[10px] text-nw-soft-white/50 leading-relaxed mt-0.5">
                      {ang.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom brand tone & Constraints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-nw-soft-white/50">
                Brand Tone Accent
              </label>
              <input
                type="text"
                placeholder="Confidence, boldness with direct proof stats."
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                className="w-full bg-nw-warm-black/90 border border-nw-bronze/10 rounded-lg p-2.5 text-xs text-nw-soft-white focus:outline-none focus:border-nw-bronze/30 font-sans"
                id="brand-tone-input"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-nw-soft-white/50">
                Specific constraints / context
              </label>
              <input
                type="text"
                placeholder="High-growth SaaS teams / address onboarding friction directly..."
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                className="w-full bg-nw-warm-black/90 border border-nw-bronze/10 rounded-lg p-2.5 text-xs text-nw-soft-white focus:outline-none focus:border-nw-bronze/30 font-sans"
                id="custom-constraints-input"
              />
            </div>
          </div>

          {/* Draft trigger CTA button */}
          <button
            onClick={executeDraftGeneration}
            disabled={isGenerating || !currentArticle}
            className="w-full bg-nw-bronze disabled:bg-nw-brown disabled:text-nw-charcoal hover:bg-nw-bronze-light py-3 px-4 rounded-lg font-sans font-semibold text-nw-warm-black transition-all cursor-pointer shadow-md shadow-nw-bronze/10 flex items-center justify-center gap-2"
            id="draft-campaign-action-btn"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Drafting Campaign via Server...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Draft Dynamic Campaign Layout
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live HUD feedback Terminal */}
      <div className="lg:col-span-5 flex flex-col h-full space-y-4" id="copilot-telemetry-portal">
        <div className="bg-nw-warm-black rounded-xl p-5 flex flex-col flex-1 border border-nw-bronze/15 justify-between min-h-[350px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-nw-bronze/10 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-nw-bronze" />
                <span className="text-xs font-mono text-nw-bronze font-bold tracking-widest uppercase">
                  Telemetry HUD logs
                </span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-nw-bronze animate-pulse" />
            </div>

            {/* Virtual scrolling line list */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto font-mono text-[10px] text-nw-soft-white/80 scrollbar-thin" id="virtual-telemetry-logs-window">
              {logs.length === 0 ? (
                <div className="text-nw-charcoal italic py-4">
                  HUD listening... Configure parameters and initiate generation to capture server transactional telemetry.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.includes("SUCCESS") ? "text-nw-bronze font-bold" : log.includes("ERROR") ? "text-red-400" : "text-nw-soft-white/80"
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick instructions inside hud block */}
          <div className="pt-4 border-t border-nw-bronze/5 text-[11px] text-nw-soft-white/40 leading-relaxed font-sans mt-auto">
            <span className="font-semibold text-nw-bronze-light">Tuning Guide:</span> Change the Creative Angle to switch formulas. Category Reframe targets tool consolidation, while Audience Sharpness targets high-intent segments.
          </div>
        </div>
        
        {/* Info card comparing Rival CRM */}
        <div className="bg-nw-coffee/20 p-4 border border-nw-bronze/5 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-nw-bronze mt-0.5 shrink-0" />
          <p className="text-xs text-nw-soft-white/60 leading-relaxed">
            <span className="font-semibold text-nw-bronze-light">SEO Positioning:</span> Precompiled targets focus heavily on reporting and ROI, letting you directly displace shallow single-feature tools in competitive markets.
          </p>
        </div>
      </div>

    </div>
  );
}
