import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Package, Users, Settings,
  CreditCard, Shield, FileText, Search, ArrowRight,
} from "lucide-react";
import "./CommandPalette.css";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

interface Command {
  label: string;
  icon: LucideIcon;
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
  const selectedIndexRef = useRef(selectedIndex);
  const filteredRef = useRef<Command[]>([]);

  const filtered = useMemo(() => {
    const result = ALL_COMMANDS.filter(cmd => {
      if (cmd.roles && !cmd.roles.includes(userRole)) return false;
      const q = query.toLowerCase();
      return cmd.label.toLowerCase().includes(q) || cmd.keywords.some(k => k.includes(q));
    });
    filteredRef.current = result;
    return result;
  }, [query, userRole]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => {
      if      (e.key === "Escape")    { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filteredRef.current.length - 1)); }
      else if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && filteredRef.current[selectedIndexRef.current]) { e.preventDefault(); handleSelect(filteredRef.current[selectedIndexRef.current].path); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose, handleSelect]);

  useEffect(() => {
    if (listRef.current && isOpen) {
      const el = listRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="cp-shell">
      <div
        className="cp-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="cp-modal" onClick={e => e.stopPropagation()}>

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
              filtered.map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.label}
                    className={`cp-item ${i === selectedIndex ? "selected" : ""}`}
                    onClick={() => handleSelect(cmd.path)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    role="option"
                    aria-selected={i === selectedIndex}
                  >
                    <div className="cp-item-ico"><Icon size={16} /></div>
                    <span className="cp-item-label">{cmd.label}</span>
                    {cmd.roles && (
                      <span className="cp-role">{cmd.roles.join(" / ")}</span>
                    )}
                    <ArrowRight size={14} className="cp-arrow" />
                  </button>
                );
              })
            )}
          </div>

          <div className="cp-footer">
            <span className="cp-hint"><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span>
            <span className="cp-hint"><kbd>&crarr;</kbd> select</span>
            <span className="cp-hint"><kbd>ESC</kbd> close</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CommandPalette;