import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Use navigate instead of href
import { Plus, Package, Users, FileText, DollarSign } from "lucide-react";
import "./FAB.css";

export const FAB = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle navigation and close menu
  const handleAction = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const actions = [
    { icon: Package, label: "New Order", path: "/new-order" },
    { icon: Users, label: "Add Staff", path: "/staff" },
    { icon: FileText, label: "Create Service", path: "/services" },
    { icon: DollarSign, label: "Record Payment", path: "/payments" },
  ];

  return (
    <div ref={fabRef} className={`fab-container ${isOpen ? "open" : ""}`}>
      {/* Menu Items */}
      <div className={`fab-menu ${isOpen ? "visible" : ""}`}>
        {actions.map((action, index) => (
          <button
            key={index}
            className="fab-item"
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

      {/* Main Trigger Button */}
      <button 
        className={`fab-button ${isOpen ? "active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        aria-label="Quick Actions"
      >
        <div className={`fab-icon-wrapper ${isOpen ? "rotate" : ""}`}>
          <Plus size={24} />
        </div>
      </button>
    </div>
  );
};