import { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard, Package, Users, User, Settings, FileText,
  ChevronLeft, ChevronRight, Shield, CreditCard, ShoppingCart,
  Printer, LogOut, X, BarChart3, Inbox, Sparkles, Lightbulb, Smartphone
} from "lucide-react";
// @ts-ignore
import { supabase } from "../../lib/supabaseClient";
import { NavItem } from "./NavItem";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useIntakeCounts } from "../../hooks/useIntakeCounts";
import "./Sidebar.css";

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export const Sidebar = ({ isOpen = true, onToggle, isMobile = false }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>("staff");
  const [allowedPages, setAllowedPages] = useState<Set<string>>(new Set());

  /* ─── LIVE COUNTS FOR THE MENU ─────────────────────────────────────────────
     One hook counts the records behind each page and keeps the numbers current
     as customers send work and the office changes it. It only starts once the
     role is known, because the menu hides pages this role may not open. */
  const countsKnown = allowedPages.size > 0;
  const { counts } = useIntakeCounts(countsKnown);

  /* ─── FETCH ROLE & PERMISSIONS ─────────────────────────────────────────── */
  useEffect(() => {
    const fetchRoleAndPerms = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // 1. Get user role
        const { data: staffData } = await supabase
          .from("staff")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();
        
        const role = staffData?.role || "staff";
        setUserRole(role);

        // 2. Get permissions for this role
        const { data: perms } = await supabase
          .from("role_permissions")
          .select("page, can_view")
          .eq("role", role);

        if (perms) {
          const allowed = new Set<string>();
          perms.forEach((p: any) => {
            if (p.can_view) {
              allowed.add(p.page);
            }
          });
          setAllowedPages(allowed);
        }
      }
    };
    fetchRoleAndPerms();
  }, []);

  /* ─── NAVIGATION ITEMS ─────────────────────────────────────────────────── */
  const navItems = useMemo(() => [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", pageKey: "dashboard" },
    { icon: ShoppingCart, label: "New Order", path: "/new-order", pageKey: "new-order" },
    { icon: Package, label: "Orders", path: "/orders", pageKey: "orders", badge: countsKnown && counts.orders > 0 ? counts.orders : undefined },
    { icon: Inbox, label: "Mobile Requests", path: "/mobile-requests", pageKey: "mobile-requests", badge: countsKnown && counts.mobileRequests > 0 ? counts.mobileRequests : undefined, badgeTitle: "waiting for Chapman to act" },
    { icon: Sparkles, label: "Service Requests", path: "/service-requests", pageKey: "service-requests", badge: countsKnown && counts.serviceRequests > 0 ? counts.serviceRequests : undefined, badgeTitle: "need a date from Chapman" },
    { icon: Lightbulb, label: "App Ideas", path: "/app-ideas", pageKey: "app-ideas", badge: countsKnown && counts.appIdeas > 0 ? counts.appIdeas : undefined, badgeTitle: "new ideas from customers" },
    { icon: Smartphone, label: "App Accounts", path: "/app-accounts", pageKey: "app-accounts", badge: countsKnown && counts.appAccounts > 0 ? counts.appAccounts : undefined, badgeTitle: "customers using the app" },
    { icon: Users, label: "Staff", path: "/staff", pageKey: "staff", badge: countsKnown && counts.staff > 0 ? counts.staff : undefined },
    { icon: User, label: "Clients", path: "/clients", pageKey: "clients", badge: countsKnown && counts.clients > 0 ? counts.clients : undefined },
    { icon: FileText, label: "Services", path: "/services", pageKey: "services" },
    { icon: Printer, label: "Receipt", path: "/receipt", pageKey: "receipt" },
    { icon: CreditCard, label: "Payments", path: "/payments", pageKey: "payments" },
    { icon: BarChart3, label: "Reports", path: "/reports", pageKey: "reports" },
    { icon: Shield, label: "Security", path: "/security", pageKey: "security" },
    { icon: Settings, label: "Settings", path: "/settings", pageKey: "settings" },
    { icon: Shield, label: "System Admin", path: "/system", pageKey: "system" },
  ], [counts, countsKnown]);

  // Filter nav items based on database permissions
  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => allowedPages.has(item.pageKey));
  }, [navItems, allowedPages]);

  /* ─── LOGOUT ───────────────────────────────────────────────────────────── */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : "expanded"} ${isMobile ? "mobile" : ""} ${isOpen ? "open" : ""}`}>
<div className="sidebar-header" style={{ justifyContent: (isCollapsed && !isMobile) ? 'center' : 'space-between' }}>
  {(!isCollapsed || isMobile) && <div className="logo-text">Chapman Prestige</div>}
  
  {!isMobile && (
    <button
      className="collapse-btn sidebar-toggle-desktop"
      onClick={() => setIsCollapsed(!isCollapsed)}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      style={{ margin: (isCollapsed && !isMobile) ? '0' : undefined }} // Reset margin if centered
    >
      {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
    </button>
  )}
  {isMobile && (
    <button
      className="mobile-close-btn sidebar-toggle-mobile"
      onClick={onToggle}
      aria-label="Close sidebar"
    >
      <X size={18} />
    </button>
  )}
</div>
      <nav className="sidebar-nav">
        {filteredNavItems.map((item) => (
          <NavItem
            key={item.path}
            {...item}
            isCollapsed={isCollapsed && !isMobile}
            onClick={() => {
              if (isMobile && onToggle) onToggle();
            }}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <WorkspaceSwitcher />
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          {(!isCollapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
