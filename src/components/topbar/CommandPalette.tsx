import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, Settings,
  CreditCard, Shield, FileText, Search, ArrowRight,
} from "lucide-react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.cp-shell { font-family: 'Outfit', system-ui, sans-serif; }

/* Overlay */
.cp-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(10px);
  z-index: 9000;
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: clamp(60px, 12vh, 140px);
  animation: cpFadeIn 0.18s ease;
}

/* Modal */
.cp-modal {
  width: 560px; max-width: calc(100vw - 32px);
  background: #0f1320;
  border: 1px solid rgba(255,255,255,0.11);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
  animation: cpSlideIn 0.22s cubic-bezier(0.4,0,0.2,1);
}

/* Search row */
.cp-search-row {
  display: flex; align-items: center; gap: 11px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.cp-search-ico { color: #3a4460; flex-shrink: 0; transition: color 0.18s; }
.cp-modal:focus-within .cp-search-ico { color: #6c72f3; }
.cp-input {
  flex: 1;
  background: none; border: none; outline: none;
  color: #edf0f8; font-size: 15px; font-weight: 500;
  font-family: 'Outfit', sans-serif;
  caret-color: #6c72f3;
}
.cp-input::placeholder { color: #2e3a4e; }
.cp-esc {
  font-family: 'DM Mono', monospace;
  font-size: 10.5px; font-weight: 500; color: #2e3a4e;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 5px; padding: 2px 7px;
  flex-shrink: 0;
}

/* Section label */
.cp-section {
  padding: 8px 18px 4px;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.09em;
  color: #2e3a4e;
}

/* List */
.cp-list {
  max-height: 340px; overflow-y: auto;
  padding: 6px 8px;
}
.cp-list::-webkit-scrollbar { width: 3px; }
.cp-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }

/* Item */
.cp-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px;
  width: 100%; background: transparent; border: none;
  color: #8892a4; font-size: 13.5px; font-weight: 500;
  cursor: pointer; font-family: 'Outfit', sans-serif;
  text-align: left;
  transition: background 0.12s, color 0.12s;
  position: relative;
}
.cp-item:hover, .cp-item.selected {
  background: rgba(108,114,243,0.1);
  color: #edf0f8;
}
.cp-item.selected { background: rgba(108,114,243,0.14); color: #edf0f8; }
.cp-item.selected::before {
  content: '';
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 3px; height: 14px;
  background: #6c72f3; border-radius: 0 3px 3px 0;
}

/* Item icon */
.cp-item-ico {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: rgba(255,255,255,0.04);
  color: #556070;
  transition: background 0.12s, color 0.12s;
}
.cp-item:hover .cp-item-ico,
.cp-item.selected .cp-item-ico {
  background: rgba(108,114,243,0.15);
  color: #6c72f3;
}

.cp-item-label { flex: 1; }

/* Role chip */
.cp-role {
  font-size: 10px; font-weight: 600;
  padding: 2px 7px; border-radius: 20px;
  background: rgba(108,114,243,0.12); color: #6c72f3;
  flex-shrink: 0;
}

/* Arrow */
.cp-arrow {
  color: #2e3a4e; opacity: 0;
  transition: opacity 0.12s, transform 0.12s;
  flex-shrink: 0;
}
.cp-item:hover .cp-arrow, .cp-item.selected .cp-arrow {
  opacity: 1; transform: translateX(2px);
}

/* Empty */
.cp-empty {
  padding: 36px 20px;
  text-align: center; color: #3a4460; font-size: 13.5px;
}

/* Footer */
.cp-footer {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  padding: 10px 18px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.cp-hint {
  font-size: 11.5px; color: #2e3a4e;
  display: flex; align-items: center; gap: 5px;
}
.cp-hint kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 18px; padding: 0 5px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  font-family: 'DM Mono', monospace;
  font-size: 10px; color: #556070;
}

@keyframes cpFadeIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes cpSlideIn { from { opacity: 0; transform: translateY(-12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
`;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

interface Command {
  label: string;
  icon: any;
  path: string;
  keywords: string[];
  roles?: string[];
}

const ALL_COMMANDS: Command[] = [
  { label: "Go to Dashboard",   icon: LayoutDashboard, path: "/dashboard", keywords: ["home","overview","main"] },
  { label: "View Orders",       icon: Package,         path: "/orders",    keywords: ["list","tracking","pipeline"] },
  { label: "Create New Order",  icon: Package,         path: "/new-order", keywords: ["add","create","new"] },
  { label: "Manage Staff",      icon: Users,           path: "/staff",     keywords: ["team","workers","employees"] },
  { label: "Open Settings",     icon: Settings,        path: "/settings",  keywords: ["config","preferences","system"] },
  { label: "View Payments",     icon: CreditCard,      path: "/payments",  keywords: ["billing","transactions","revenue"] },
  { label: "Security Settings", icon: Shield,          path: "/security",  keywords: ["auth","permissions","access"], roles: ["admin","gm"] },
  { label: "Audit Logs",        icon: FileText,        path: "/security",  keywords: ["logs","history","activity"],    roles: ["admin"] },
];

export const CommandPalette = ({ isOpen, onClose, userRole = "staff" }: CommandPaletteProps) => {
  const [query, setQuery]               = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate  = useNavigate();
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return ALL_COMMANDS.filter(cmd => {
      if (cmd.roles && !cmd.roles.includes(userRole)) return false;
      const q = query.toLowerCase();
      return cmd.label.toLowerCase().includes(q) || cmd.keywords.some(k => k.includes(q));
    });
  }, [query, userRole]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => {
      if      (e.key === "Escape")    { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && filtered[selectedIndex]) { e.preventDefault(); handleSelect(filtered[selectedIndex].path); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, filtered, selectedIndex, onClose]);

  useEffect(() => {
    if (listRef.current && isOpen) {
      const el = listRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="cp-shell">
      <style>{CSS}</style>
      <div
        className="cp-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="cp-modal" onClick={e => e.stopPropagation()}>

          {/* Search input */}
          <div className="cp-search-row">
            <Search size={16} className="cp-search-ico" />
            <input
              ref={inputRef}
              className="cp-input"
              type="text"
              placeholder="Type to search commands..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              aria-label="Search commands"
            />
            <span className="cp-esc">ESC</span>
          </div>

          {/* Results */}
          {filtered.length > 0 && (
            <div className="cp-section">
              {query ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : "All commands"}
            </div>
          )}

          <div className="cp-list" ref={listRef} role="listbox" aria-label="Command results">
            {filtered.length === 0 ? (
              <div className="cp-empty">
                {query ? `No commands match "${query}"` : "Start typing to search commands"}
              </div>
            ) : (
              filtered.map((cmd, i) => (
                <button
                  key={`${cmd.path}-${i}`}
                  className={`cp-item ${i === selectedIndex ? "selected" : ""}`}
                  onClick={() => handleSelect(cmd.path)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  role="option"
                  aria-selected={i === selectedIndex}
                >
                  <div className="cp-item-ico"><cmd.icon size={16} /></div>
                  <span className="cp-item-label">{cmd.label}</span>
                  {cmd.roles && (
                    <span className="cp-role">{cmd.roles[0]}</span>
                  )}
                  <ArrowRight size={14} className="cp-arrow" />
                </button>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="cp-footer">
            <span className="cp-hint"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span className="cp-hint"><kbd>↵</kbd> select</span>
            <span className="cp-hint"><kbd>ESC</kbd> close</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CommandPalette;