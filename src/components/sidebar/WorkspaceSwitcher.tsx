import { Building2, ChevronDown, MapPin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import "./WorkspaceSwitcher.css";

interface Workspace {
  id: string;
  name: string;
  location: string;
  status: "Active" | "Planned";
}

const WORKSPACES: Workspace[] = [
  { id: "kumasi", name: "Main Branch", location: "Kwadaso-Ohwimase, Kumasi", status: "Active" },
  { id: "tema", name: "Tema Branch", location: "Opening Soon", status: "Planned" },
  { id: "accra", name: "Accra Branch", location: "Opening Soon", status: "Planned" },
];

export const WorkspaceSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Workspace>(WORKSPACES[0]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (ws: Workspace) => {
    if (ws.status !== "Active") return;
    setSelected(ws);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`ws-switcher-wrapper ${isOpen ? "open" : ""}`}>
      <button 
        className="ws-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="ws-icon">
          <Building2 size={16} />
        </div>
        <div className="ws-info">
          <div className="ws-name">{selected.name}</div>
          <div className="ws-status">
            <MapPin size={10} />
            {selected.location.split(",")[0]}
          </div>
        </div>
        <ChevronDown size={14} className={`ws-chevron ${isOpen ? "rotate" : ""}`} />
      </button>

      {isOpen && (
        <div className="ws-dropdown" role="listbox">
          <div className="ws-dropdown-header">
            <span className="ws-dropdown-title">Branches</span>
            <span className="ws-dropdown-count">
              {WORKSPACES.filter(w => w.status === "Active").length} Active
            </span>
          </div>
          
          <div className="ws-list">
            {WORKSPACES.map((ws) => {
              const isActive = ws.id === selected.id;
              const isPlanned = ws.status === "Planned";
              return (
                <button 
                  key={ws.id} 
                  className={`ws-item ${isActive ? "selected" : ""} ${isPlanned ? "disabled" : ""}`}
                  onClick={() => !isPlanned && handleSelect(ws)}
                  role="option"
                  aria-selected={isActive}
                  disabled={isPlanned}
                >
                  <div className="ws-item-info">
                    <span className="ws-item-name">{ws.name}</span>
                    <span className="ws-item-location">{ws.location}</span>
                  </div>
                  <div className="ws-item-right">
                    {isPlanned ? (
                      <span className="ws-badge planned">Planned</span>
                    ) : isActive ? (
                      <span className="ws-badge active">Active</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="ws-footer">
            <span className="ws-footer-text">Currently operating in Kumasi. Expansion planned for 2027.</span>
          </div>
        </div>
      )}
    </div>
  );
};