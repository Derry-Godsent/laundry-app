import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { motion } from "framer-motion";

interface NavItemProps {
  icon: any;
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
    <Link to={path} className={`nav-item ${isActive ? "active" : ""}`} onClick={onClick}>
      <motion.div className="nav-icon" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Icon size={20} />
      </motion.div>
      {!isCollapsed && <span className="nav-label">{label}</span>}
      {!isCollapsed && badge && <span className="nav-badge">{badge}</span>}
      {isCollapsed && badge && <span className="nav-badge-mini" />}
    </Link>
  );
};