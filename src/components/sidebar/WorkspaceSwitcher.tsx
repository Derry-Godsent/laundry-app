import { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown } from "lucide-react";
import "./WorkspaceSwitcher.css";

export const WorkspaceSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="ws-switcher" onClick={() => setIsOpen(!isOpen)}>
      <div className="ws-icon"><Building2 size={16} /></div>
      <div className="ws-info"><div className="ws-name">Main Branch</div></div>
      <ChevronDown size={16} className={isOpen ? "rotate" : ""} />
    </div>
  );
};