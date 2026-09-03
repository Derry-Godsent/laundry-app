import { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard, Package, Users, User, Settings, FileText,
  ChevronLeft, ChevronRight, Shield, CreditCard, ShoppingCart,
  Printer, LogOut, X, BarChart3, Inbox
} from "lucide-react";
// @ts-ignore
import { supabase } from "../../lib/supabaseClient";
import { NavItem } from "./NavItem";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import "./Sidebar.css";

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export const Sidebar = ({ isOpen = true, onToggle, isMobile = false }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [userRole, setUserRole] = useState<string>("staff");
  const [allowedPages, setAllowedPages] = useState<Set<string>>(new Set());

  /* ─── REALTIME ORDER COUNT ─────────────────────────────────────────────── */
  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      if (isMounted) setOrderCount(count || 0);
    };
    fetchCount();
    
    const channel = supabase.channel('sidebar-orders-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchCount())
      .subscribe();
      
    return () => { 
      isMounted = false; 
      supabase.removeChannel(channel); 
    };
  }, []);

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
    { icon: Package, label: "Orders", path: "/orders", pageKey: "orders", badge: orderCount > 0 ? orderCount : undefined },
    { icon: Inbox, label: "Mobile Requests", path: "/mobile-requests", pageKey: "mobile-requests" },
    { icon: Users, label: "Staff", path: "/staff", pageKey: "staff" },
    { icon: User, label: "Clients", path: "/clients", pageKey: "clients" },
    { icon: FileText, label: "Services", path: "/services", pageKey: "services" },
    { icon: Printer, label: "Receipt", path: "/receipt", pageKey: "receipt" },
    { icon: CreditCard, label: "Payments", path: "/payments", pageKey: "payments" },
    { icon: BarChart3, label: "Reports", path: "/reports", pageKey: "reports" },
    { icon: Shield, label: "Security", path: "/security", pageKey: "security" },
    { icon: Settings, label: "Settings", path: "/settings", pageKey: "settings" },
    { icon: Shield, label: "System Admin", path: "/system", pageKey: "system" },
  ], [orderCount]);

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
