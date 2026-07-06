import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Package, Users, User, Settings, FileText, 
  ChevronLeft, ChevronRight, Shield, CreditCard, ShoppingCart, 
  Printer, LogOut, X 
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path if needed
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

  // Realtime Order Count
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
    return () => { isMounted = false; supabase.removeChannel(channel); };
  }, []);

  const navItems = useMemo(() => [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: ShoppingCart, label: "New Order", path: "/new-order" },
    { icon: Package, label: "Orders", path: "/orders", badge: orderCount > 0 ? orderCount : undefined },
    { icon: Users, label: "Staff", path: "/staff" },
    { icon: User, label: "Clients", path: "/clients" },
    { icon: FileText, label: "Services", path: "/services" },
    { icon: Printer, label: "Receipt", path: "/receipt" },
    { icon: CreditCard, label: "Payments", path: "/payments" },
    { icon: Shield, label: "Security", path: "/security" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ], [orderCount]);

  return (
    <div className={`sidebar-wrapper ${isCollapsed ? "collapsed" : "expanded"} ${isMobile ? "mobile" : ""} ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="logo-text">Chapman</div>
        {!isMobile && (
          <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
        {isMobile && (
          <button className="mobile-close-btn" onClick={onToggle}><X size={18} /></button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
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
        <button className="logout-btn" onClick={() => supabase.auth.signOut()}>
          <LogOut size={16} />
          {(!isCollapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};