import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Users, FileText, DollarSign } from "lucide-react";
import "./FAB.css";

export const FAB = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const actions = [
    { icon: Package, label: "New Order", path: "/new-order" },
    { icon: Users, label: "Add Staff", path: "/staff" },
    { icon: FileText, label: "Create Service", path: "/services" },
    { icon: DollarSign, label: "Record Payment", path: "/payments" },
  ];

  const handleAction = useCallback((path: string) => {
    navigate(path);
    setIsOpen(false);
  }, [navigate]);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }
      const activeIndex = itemRefs.current.findIndex(ref => ref === document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = activeIndex >= 0 && activeIndex < actions.length - 1 ? activeIndex + 1 : 0;
        itemRefs.current[next]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = activeIndex > 0 ? activeIndex - 1 : actions.length - 1;
        itemRefs.current[prev]?.focus();
      } else if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const next = activeIndex >= 0 && activeIndex < actions.length - 1 ? activeIndex + 1 : 0;
        itemRefs.current[next]?.focus();
      } else if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        const prev = activeIndex > 0 ? activeIndex - 1 : actions.length - 1;
        itemRefs.current[prev]?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, actions.length]);

  useEffect(() => {
    if (isOpen) {
      itemRefs.current[0]?.focus();
    }
  }, [isOpen]);

  return (
    <div ref={fabRef} className={`fab-container ${isOpen ? "open" : ""}`}>
      <div className={`fab-menu ${isOpen ? "visible" : ""}`} role="menu" aria-label="Quick actions">
        {actions.map((action, index) => (
          <button
            key={action.label}
            ref={el => { itemRefs.current[index] = el; }}
            className="fab-item"
            type="button"
            role="menuitem"
            onClick={() => handleAction(action.path)}
            style={{ "--delay": `${index * 0.05}s` } as React.CSSProperties}
          >
            <div className="fab-item-icon">
              <action.icon size={18} />
            </div>
            <span className="fab-item-label">{action.label}</span>
          </button>
        ))}
      </div>

      <button
        ref={triggerRef}
        className={`fab-button ${isOpen ? "active" : ""}`}
        type="button"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Quick Actions"
      >
        <div className={`fab-icon-wrapper ${isOpen ? "rotate" : ""}`}>
          <Plus size={24} />
        </div>
      </button>
    </div>
  );
};

export default FAB;