import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export const NavItem = ({ icon: Icon, label, path, badge, isCollapsed, onClick }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link
        to={path}
        className={`nav-item ${isActive ? "active" : ""}`}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="nav-icon">
          <Icon size={20} />
        </span>
        {!isCollapsed && <span className="nav-label">{label}</span>}
        {!isCollapsed && badge !== undefined && badge > 0 && (
          <span className="nav-badge">{badge}</span>
        )}
        {isCollapsed && badge !== undefined && badge > 0 && (
          <span className="nav-badge-mini" aria-label={`${badge} pending`} />
        )}
      </Link>
    </motion.div>
  );
};