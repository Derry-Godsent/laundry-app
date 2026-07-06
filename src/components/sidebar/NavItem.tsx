import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
  isCollapsed?: boolean;
  onClick?: () => void; // ✅ Added optional onClick
}

export const NavItem = ({ 
  icon: Icon, 
  label, 
  path, 
  badge, 
  isCollapsed = false,
  onClick 
}: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === path || (path === "/dashboard" && location.pathname === "/");

  return (
    <Link 
      to={path} 
      className={`nav-item ${isActive ? "active" : ""}`}
      onClick={onClick} // ✅ Pass click handler
    >
      <motion.div
        className="nav-icon"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon size={20} />
      </motion.div>
      
      {/* Only show text/badges if sidebar is expanded */}
      {!isCollapsed && <span className="nav-label">{label}</span>}
      
      {/* ✅ Only render badge if it exists AND is > 0 */}
      {!isCollapsed && badge && badge > 0 && (
        <span className="nav-badge">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      
      {/* ✅ Small dot for collapsed mode when badge exists */}
      {isCollapsed && badge && badge > 0 && (
        <span className="nav-badge-mini" />
      )}
    </Link>
  );
};