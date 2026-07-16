import React, { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, Send, Sparkles } from "lucide-react";
import { apiUrl } from "../lib/api";

interface NotifEvent {
  id: string;
  kind: "generated" | "scheduled" | "published" | "failed" | "system";
  message: string;
  at: number;
  detail?: string;
}

// Tiny header dropdown that subscribes to /api/events/stream and accumulates a
// rolling buffer. Counter shows unread since last open.
export default function NotificationsBell() {
  const [events, setEvents] = useState<NotifEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(apiUrl("/api/events/stream"), { withCredentials: true } as EventSourceInit);
    es.addEventListener("schedule", (ev) => {
      try {
        const d = JSON.parse((ev as MessageEvent).data);
        let kind: NotifEvent["kind"] = "system";
        let message = "Event";
        let detail = "";
        if (d.kind === "generated") {
          kind = "generated";
          const a = d.assets?.[0];
          message = `Asset generated (${a?.modelId?.split("/").pop() ?? "?"})`;
          detail = d.review?.avgOverall != null ? `review ${Math.round(d.review.avgOverall * 100)}/100` : "";
        } else if (d.status === "published") {
          kind = "published";
          message = `Post published`;
        } else if (d.status === "failed") {
          kind = "failed";
          message = `Post failed`;
          detail = d.error ?? "";
        } else if (d.status === "scheduled") {
          kind = "scheduled";
          message = `Scheduled`;
        }
        setEvents((prev) => [{ id: crypto.randomUUID(), kind, message, detail, at: d.at ?? Math.floor(Date.now() / 1000) }, ...prev].slice(0, 50));
        setUnread((u) => u + 1);
      } catch {}
    });
    return () => es.close();
  }, []);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = () => {
    setOpen((v) => !v);
    if (!open) setUnread(0);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative p-1.5 rounded text-nw-soft-white/60 hover:text-nw-soft-white"
        title={`${unread} new event${unread === 1 ? "" : "s"}`}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-nw-bronze text-nw-warm-black text-[8px] font-mono font-bold rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-nw-coffee border border-nw-bronze/30 rounded-lg shadow-2xl z-50 max-h-[60vh] overflow-y-auto">
          <div className="p-3 border-b border-nw-bronze/15 sticky top-0 bg-nw-coffee">
            <div className="font-display font-bold text-xs">Live activity</div>
            <div className="text-[10px] text-nw-soft-white/40">Streaming via SSE — last {events.length}</div>
          </div>
          {events.length === 0 ? (
            <div className="text-xs text-nw-soft-white/40 p-6 text-center">Nothing yet. Trigger a generation in Studio.</div>
          ) : (
            <div className="divide-y divide-nw-bronze/10">
              {events.map((e) => (
                <div key={e.id} className="p-3 text-xs flex items-start gap-2">
                  <Icon kind={e.kind} />
                  <div className="flex-1 min-w-0">
                    <div className="text-nw-soft-white">{e.message}</div>
                    {e.detail && <div className="text-[10px] text-nw-soft-white/50 mt-0.5">{e.detail}</div>}
                    <div className="text-[10px] font-mono text-nw-soft-white/30 mt-0.5">{new Date(e.at * 1000).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Icon({ kind }: { kind: NotifEvent["kind"] }) {
  switch (kind) {
    case "generated": return <Sparkles className="w-3.5 h-3.5 text-nw-bronze shrink-0 mt-0.5" />;
    case "scheduled": return <Send className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />;
    case "published": return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />;
    case "failed":    return <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
    default:           return <Bell className="w-3.5 h-3.5 text-nw-soft-white/40 shrink-0 mt-0.5" />;
  }
}
