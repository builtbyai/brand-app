import React from "react";
import { ChevronDown, X } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items?: NavItem[];        // If undefined, treated as single-tab (id = section.id)
}

interface Props {
  sections: NavSection[];
  activeId: string;
  onSelect: (id: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  /** Optional footer rendered at bottom of sidebar (e.g., user menu). */
  footer?: React.ReactNode;
}

// Modern sidebar:
//   - Desktop: fixed 248px column with collapsible sections + active highlight
//   - Mobile: full-screen drawer that slides in from the left
export default function Sidebar({ sections, activeId, onSelect, mobileOpen, onMobileClose, footer }: Props) {
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of sections) init[s.id] = true;
    return init;
  });

  // Auto-expand the section that contains the active tab
  React.useEffect(() => {
    for (const s of sections) {
      if (s.items?.some((i) => i.id === activeId) && !openMap[s.id]) {
        setOpenMap((prev) => ({ ...prev, [s.id]: true }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const toggle = (id: string) => setOpenMap((p) => ({ ...p, [id]: !p[id] }));

  const inner = (
    <nav className="h-full flex flex-col py-3 px-2">
      <div className="flex items-center gap-3 px-2 mb-4">
        <span
          aria-hidden
          className="relative inline-flex items-center justify-center h-9 w-9 rounded-md border border-nw-border-strong bg-nw-surface-1"
        >
          <span
            className="absolute inset-0 rounded-md opacity-60"
            style={{ background: "radial-gradient(circle at 50% 30%, rgba(93,168,240,0.5), transparent 65%)" }}
          />
          <span className="relative font-display font-black text-nw-text text-[15px] leading-none">W</span>
          <span
            className="absolute -bottom-[3px] left-1 right-1 h-[2px] rounded-full"
            style={{ background: "linear-gradient(90deg, var(--color-nw-steel) 0%, var(--color-nw-bronze-light) 100%)" }}
          />
        </span>
        <div className="leading-none">
          <div className="nw-wordmark text-[15px]">NORTH</div>
          <div className="nw-wordmark-sub text-[9px] mt-1">Systems · Brand OS</div>
        </div>
        <button onClick={onMobileClose} className="ml-auto p-1.5 text-nw-text-muted hover:text-nw-text lg:hidden" title="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 px-1">
        {sections.map((s) => {
          const Icon = s.icon;
          const hasChildren = !!s.items?.length;
          const open = !!openMap[s.id];
          const isActiveSection = hasChildren
            ? s.items!.some((i) => i.id === activeId)
            : activeId === s.id;

          if (!hasChildren) {
            return (
              <button
                key={s.id}
                onClick={() => { onSelect(s.id); onMobileClose(); }}
                className="nw-nav-item"
                data-active={isActiveSection}
              >
                <Icon className="w-4 h-4 nw-nav-item-icon" />
                <span className="flex-1">{s.label}</span>
              </button>
            );
          }

          return (
            <div key={s.id}>
              <button
                onClick={() => toggle(s.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                  isActiveSection ? "text-nw-text" : "text-nw-text-muted hover:text-nw-text"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActiveSection ? "text-nw-bronze" : ""}`} />
                <span className="flex-1 text-xs font-mono uppercase tracking-wider text-left">{s.label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
              </button>
              {open && (
                <div className="mt-0.5 ml-1 pl-3 border-l border-nw-border space-y-0.5">
                  {s.items!.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onSelect(item.id); onMobileClose(); }}
                        className="nw-nav-item"
                        data-active={activeId === item.id}
                      >
                        <ItemIcon className="w-3.5 h-3.5 nw-nav-item-icon" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge != null && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-nw-surface-2 text-nw-text-muted">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {footer && <div className="mt-3 border-t border-nw-border pt-3 px-1">{footer}</div>}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[248px] bg-nw-surface-0 border-r border-nw-border shrink-0 sticky top-0 h-screen">
        {inner}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-nw-bg/70 backdrop-blur-sm transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onMobileClose}
        />
        {/* Drawer */}
        <aside
          className={`absolute top-0 left-0 bottom-0 w-[280px] bg-nw-surface-0 border-r border-nw-border shadow-2xl transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {inner}
        </aside>
      </div>
    </>
  );
}
