import { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard, Package, Users, User, Settings, FileText,
  ChevronLeft, ChevronRight, Shield, CreditCard, ShoppingCart,
  Printer, LogOut, X, BarChart3, Inbox, Lightbulb, MessageSquareText, Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { NavItem } from "./NavItem";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useIntakeCounts } from "../../hooks/useIntakeCounts";
import { BrandMark } from "../brand/BrandMark";
import "./Sidebar.css";

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

interface NavEntry {
  icon: LucideIcon;
  label: string;
  path: string;
  pageKey: string;
  badge?: number;
  badgeTitle?: string;
}

interface NavSection {
  id: string;
  label: string;
  items: NavEntry[];
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  strategist: "Strategist",
  staff: "Staff",
  courier: "Courier",
};

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
          perms.forEach((p: { page: string; can_view: boolean }) => {
            if (p.can_view) allowed.add(p.page);
          });
          setAllowedPages(allowed);
        }
      }
    };
    fetchRoleAndPerms();
  }, []);

  /* ─── NAVIGATION ─────────────────────────────────────────────────────────
     Grouped by the way the office actually talks about the work: what comes in
     and gets processed (Work), who it belongs to (Customers), how the business
     is run (Business) and how the console itself is governed (Administration).
     The badge on an item is the number of records still waiting there. */
  const sections = useMemo<NavSection[]>(() => {
    const badge = (value: number) => (countsKnown && value > 0 ? value : undefined);

    return [
      {
        id: "work",
        label: "Work",
        items: [
          { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", pageKey: "dashboard" },
          { icon: ShoppingCart, label: "New Order", path: "/new-order", pageKey: "new-order" },
          { icon: Package, label: "Orders", path: "/orders", pageKey: "orders", badge: badge(counts.orders), badgeTitle: "orders on record" },
          { icon: Inbox, label: "Mobile Requests", path: "/mobile-requests", pageKey: "mobile-requests", badge: badge(counts.mobileRequests), badgeTitle: "waiting for Chapman to act" },
          { icon: MessageSquareText, label: "Service Requests", path: "/service-requests", pageKey: "service-requests", badge: badge(counts.serviceRequests), badgeTitle: "need a date from Chapman" },
          { icon: Lightbulb, label: "App Ideas", path: "/app-ideas", pageKey: "app-ideas", badge: badge(counts.appIdeas), badgeTitle: "new ideas from customers" },
        ],
      },
      {
        id: "customers",
        label: "Customers",
        items: [
          { icon: User, label: "Clients", path: "/clients", pageKey: "clients", badge: badge(counts.clients), badgeTitle: "client records" },
          { icon: Smartphone, label: "App Accounts", path: "/app-accounts", pageKey: "app-accounts", badge: badge(counts.appAccounts), badgeTitle: "customers using the app" },
        ],
      },
      {
        id: "business",
        label: "Business",
        items: [
          { icon: FileText, label: "Services", path: "/services", pageKey: "services" },
          { icon: Printer, label: "Receipts", path: "/receipt", pageKey: "receipt" },
          { icon: CreditCard, label: "Payments", path: "/payments", pageKey: "payments" },
          { icon: BarChart3, label: "Reports", path: "/reports", pageKey: "reports" },
        ],
      },
      {
        id: "admin",
        label: "Administration",
        items: [
          { icon: Users, label: "Staff", path: "/staff", pageKey: "staff", badge: badge(counts.staff), badgeTitle: "staff records" },
          { icon: Shield, label: "Security", path: "/security", pageKey: "security" },
          { icon: Settings, label: "Settings", path: "/settings", pageKey: "settings" },
          { icon: Shield, label: "System Admin", path: "/system", pageKey: "system" },
        ],
      },
    ];
  }, [counts, countsKnown]);

  /* A role with no explicit grant still needs the pages it obviously owns, so
     the menu is never empty for a signed-in staff member. */
  const visibleSections = useMemo(() => {
    if (allowedPages.size === 0) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => allowedPages.has(item.pageKey)),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, allowedPages]);

  const visibleCount = visibleSections.reduce((total, section) => total + section.items.length, 0);

  /* ─── LOGOUT ───────────────────────────────────────────────────────────── */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const collapsed = isCollapsed && !isMobile;

  return (
    <aside
      className={[
        "sidebar",
        collapsed ? "collapsed" : "expanded",
        isMobile ? "mobile" : "",
        isOpen ? "open" : "",
      ].join(" ")}
    >
      <div className="sidebar-header">
        <BrandMark size="md" withText={!collapsed} />

        {!isMobile && (
          <button
            className="sidebar-icon-btn sidebar-toggle-desktop"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        {isMobile && (
          <button
            className="sidebar-icon-btn sidebar-toggle-mobile"
            onClick={onToggle}
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {visibleSections.map((section) => (
          <div className="nav-section" key={section.id}>
            <span className="nav-section__label">{collapsed ? "·" : section.label}</span>
            {section.items.map((item) => (
              <NavItem
                key={item.path}
                {...item}
                isCollapsed={collapsed}
                onClick={() => {
                  if (isMobile && onToggle) onToggle();
                }}
              />
            ))}
          </div>
        ))}

        {visibleCount === 0 && (
          <p className="sidebar-note">
            Your role has no pages assigned yet. Ask an administrator to grant access.
          </p>
        )}
      </nav>

      <div className="sidebar-footer">
        <WorkspaceSwitcher />
        {!collapsed && <span className="sidebar-role">{ROLE_LABEL[userRole] ?? userRole}</span>}
        <button className="logout-btn" onClick={handleLogout} title="Sign out">
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
