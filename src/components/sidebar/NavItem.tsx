import { Link, useLocation } from "react-router-dom";
import "./NavItem.css";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
  /** What the number means, shown when the office hovers it. */
  badgeTitle?: string;
  isCollapsed?: boolean;
  onClick?: () => void;
}

/**
 * One row in the sidebar.
 *
 * The badge is a count of records still needing attention in that queue, so it
 * is always rendered as a number — a collapsed rail shows it as a dot with the
 * same meaning, and hovering the row explains what is being counted.
 */
export const NavItem = ({ icon: Icon, label, path, badge, badgeTitle, isCollapsed, onClick }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  const hasBadge = badge !== undefined && badge > 0;
  const tooltip = hasBadge && badgeTitle ? `${label} — ${badge} ${badgeTitle}` : label;

  return (
    <Link
      to={path}
      className={`nav-item ${isActive ? "active" : ""} ${isCollapsed ? "is-collapsed" : ""}`}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={tooltip}
    >
      <span className="nav-icon">
        <Icon size={17} strokeWidth={isActive ? 2.2 : 1.9} />
      </span>
      {!isCollapsed && <span className="nav-label">{label}</span>}
      {!isCollapsed && hasBadge && <span className="nav-badge">{badge > 99 ? "99+" : badge}</span>}
      {isCollapsed && hasBadge && <span className="nav-badge-mini" aria-label={`${badge} ${badgeTitle ?? "waiting"}`} />}
    </Link>
  );
};
