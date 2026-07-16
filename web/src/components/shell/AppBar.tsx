import React, { useEffect, useRef, useState } from "react";
import { Menu, Search, LogOut, ChevronDown } from "lucide-react";
import NotificationsBell from "../NotificationsBell";
import SystemStatus from "../SystemStatus";
import JobsWidget from "../JobsWidget";

interface Props {
  userEmail: string;
  onMenuClick: () => void;       // toggles mobile sidebar
  onSearchClick: () => void;     // opens command palette
  onLogout: () => void;
  /** Optional breadcrumb / page title region. */
  title?: React.ReactNode;
}

export default function AppBar({ userEmail, onMenuClick, onSearchClick, onLogout, title }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <header className="h-14 bg-nw-bg/80 backdrop-blur-xl border-b border-nw-border sticky top-0 z-30 flex items-center px-3 sm:px-5 gap-3">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1 rounded-md text-nw-text-muted hover:text-nw-text hover:bg-nw-surface-1"
        title="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title slot */}
      <div className="hidden sm:flex items-center min-w-0">
        {title}
      </div>

      {/* Global search trigger */}
      <button
        onClick={onSearchClick}
        className="flex-1 max-w-xl mx-auto flex items-center gap-2 px-3 h-9 rounded-lg bg-nw-surface-1 border border-nw-border hover:border-nw-border-strong text-nw-text-muted hover:text-nw-text transition-colors group"
        title="Search (⌘K)"
      >
        <Search className="w-4 h-4 text-nw-text-subtle group-hover:text-nw-bronze transition-colors" />
        <span className="text-xs text-nw-text-subtle flex-1 text-left">Search the brand OS, sections, workspaces…</span>
        <kbd className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-nw-surface-2 border border-nw-border text-nw-text-muted">⌘K</kbd>
      </button>

      {/* Right side: status + bell + user */}
      <div className="flex items-center gap-1.5 ml-auto">
        <div className="hidden md:flex items-center px-2.5 h-8 rounded-full bg-nw-surface-1 border border-nw-border">
          <SystemStatus compact />
        </div>

        <JobsWidget />
        <NotificationsBell />

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 h-8 px-2 rounded-lg hover:bg-nw-surface-1"
            title="Account"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-nw-bg ring-1 ring-nw-border-accent" style={{ background: "linear-gradient(135deg, #E8ECEF 0%, #5DA8F0 60%, #4A90E2 100%)" }}>
              {userEmail.slice(0, 1).toUpperCase()}
            </div>
            <ChevronDown className="w-3 h-3 text-nw-text-muted" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 nw-glass-glow p-1.5 z-40 nw-fade-in">
              <div className="px-3 py-2 border-b border-nw-border mb-1">
                <div className="text-xs text-nw-text-muted">Signed in as</div>
                <div className="text-sm text-nw-text truncate">{userEmail}</div>
              </div>
              <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-nw-text-muted hover:text-nw-danger hover:bg-nw-surface-2 transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
