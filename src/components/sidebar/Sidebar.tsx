import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  User, 
  Settings, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  CreditCard,
  ShoppingCart,
  Printer,
  LogOut,
  X
} from "lucide-react";
// @ts-ignore
import { supabase } from "../../lib/supabaseClient";
import { NavItem } from "./NavItem";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import "./Sidebar.css";

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  userRole?: string;
  isMobile?: boolean;
}

export const Sidebar = ({ 
  isOpen = true, 
  onToggle, 
  userRole, 
  isMobile = false 
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localRole, setLocalRole] = useState<string>("staff");
  
  // ✅ NEW: State for real-time order count
  const [orderCount, setOrderCount] = useState<number>(0);

  // ─── Fetch Role from Supabase ─────────────────────────
  useEffect(() => {
    if (userRole) {
      setLocalRole(userRole);
    } else {
      const fetchRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (data?.role) setLocalRole(data.role);
        }
      };
      fetchRole();
    }
  }, [userRole]);

  // ✅ NEW: Fetch order count + Realtime subscription
  useEffect(() => {
    let isMounted = true;

    const fetchCount = async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      if (isMounted) {
        setOrderCount(count || 0);
      }
    };

    fetchCount();

    // Subscribe to realtime changes
    const channel = supabase.channel('sidebar-orders-badge')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        () => fetchCount()
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // ─── Nav Items (with dynamic badge) ─────────────────────────
  const navItems = useMemo(() => [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: ShoppingCart, label: "New Order", path: "/new-order" },
    // ✅ DYNAMIC BADGE: Only show if > 0
    { icon: Package, label: "Orders", path: "/orders", badge: orderCount > 0 ? orderCount : undefined },
    { icon: Users, label: "Staff", path: "/staff" },
    { icon: User, label: "Clients", path: "/clients" },
    { icon: FileText, label: "Services", path: "/services" },
    { icon: Printer, label: "Receipt", path: "/receipt" },
    { icon: CreditCard, label: "Payments", path: "/payments" },
    { icon: Shield, label: "Security", path: "/security" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ], [orderCount]);

  // ─── Handle Logout ───────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // ─── Mobile: Close sidebar on route change ───────────
  useEffect(() => {
    if (isMobile && isOpen) {
      const closeOnRoute = () => onToggle?.();
      window.addEventListener("popstate", closeOnRoute);
      return () => window.removeEventListener("popstate", closeOnRoute);
    }
  }, [isMobile, isOpen, onToggle]);

  return (
    <>
      {/* ✅ Mobile Overlay (backdrop) */}
      {isMobile && isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onToggle}
        />
      )}

      <div className={`sidebar-wrapper ${isCollapsed ? "collapsed" : "expanded"} ${isMobile ? "mobile" : ""} ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <motion.div 
            className="logo-text"
            animate={{ opacity: isCollapsed && !isMobile ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            Chapman Prestige Ltd
          </motion.div>
          
          {/* Desktop collapse button */}
          {!isMobile && (
            <button 
              className="collapse-btn" 
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
          
          {/* ✅ Mobile close button */}
          {isMobile && (
            <button 
              className="mobile-close-btn"
              onClick={onToggle}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* ✅ Pass badge and onClick to NavItem */}
              <NavItem 
                {...item} 
                isCollapsed={isCollapsed && !isMobile}
                onClick={() => {
                  // Navigate and close mobile sidebar
                  if (isMobile) onToggle?.();
                }}
              />
            </motion.div>
          ))}
        </nav>

        {/* ✅ Footer with Logout */}
        <div className="sidebar-footer">
          <WorkspaceSwitcher />
          <button 
            onClick={handleLogout}
            className="logout-btn"
          >
            <LogOut size={16} />
            {(!isCollapsed || isMobile) && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </>
  );
};