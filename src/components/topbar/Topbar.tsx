import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Menu } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { NotificationDropdown } from "./NotificationDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
import { supabase } from "../../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import "./Topbar.css";

interface TopbarProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "success" | "info" | "warning" | "error";
}

interface StaffProfile {
  role: string;
  first_name: string | null;
  last_name: string | null;
}

export const Topbar = ({ onMenuClick, isMobile = false }: TopbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch current user session and staff profile
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);

          const { data: staffData, error: staffError } = await supabase
            .from("staff")
            .select("role, first_name, last_name")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!isMounted) return;

          if (staffError) {
            console.error("Failed to fetch staff profile:", staffError.message);
          }

          if (staffData?.role) {
            setUserRole(staffData.role);
          }

          if (staffData?.first_name || staffData?.last_name) {
            const fullName = [staffData.first_name, staffData.last_name]
              .filter(Boolean)
              .join(" ");
            setUserName(fullName);
          } else if (session.user.email) {
            const prefix = session.user.email.split("@")[0];
            setUserName(
              prefix
                .split(/[._-]/)
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            );
          } else {
            setUserName("User");
          }
        } else {
          setUser(null);
          setUserRole("");
          setUserName("Guest");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Unexpected error fetching user:", err);
        setUserName("Guest");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: User | null } | null) => {
        if (!isMounted) return;
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
          setUserRole("");
          setUserName("");
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("topbar-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `client_id=eq.${user.id}` },
        (payload: { eventType: string; new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
          const eventType = payload.eventType;
          const newRecord = payload.new as Record<string, unknown> | null;
          const oldRecord = payload.old as Record<string, unknown> | null;

          let title = "Order Updated";
          let message = "Your order has been updated";
          let type: NotificationItem["type"] = "info";

          if (eventType === "INSERT") {
            title = "New Order";
            message = `Order ${newRecord?.order_id || "#???"} was created`;
            type = "success";
          } else if (eventType === "UPDATE") {
            title = "Order Updated";
            message = `Order ${newRecord?.order_id || "#???"} was updated`;
            type = "info";
          } else if (eventType === "DELETE") {
            title = "Order Deleted";
            message = `Order ${oldRecord?.order_id || "#???"} was removed`;
            type = "warning";
          }

          const newNotification: NotificationItem = {
            id: Date.now(),
            title,
            message,
            time: new Date().toLocaleTimeString(),
            read: false,
            type,
          };

          setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Get user display name
  const getUserDisplay = (): string => {
    if (loading) return "Loading...";
    if (!user) return "Guest";
    return userName || "User";
  };

  // Get user avatar initial
  const getUserInitial = (): string => {
    const name = getUserDisplay();
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          {isMobile && onMenuClick && (
            <button
              className="sidebar-toggle-mobile"
              onClick={onMenuClick}
              aria-label="Open navigation menu"
              title="Open menu"
            >
              <Menu size={20} />
            </button>
          )}

          <Breadcrumbs />
        </div>

        <div className="topbar-right">
          <button
            className="command-trigger"
            onClick={() => setIsCommandOpen(true)}
            title="Click to search or press Ctrl+K"
            aria-label="Open command palette"
          >
            <Search size={16} aria-hidden="true" />
            <span className="command-placeholder">Search pages, orders, or actions...</span>
            <kbd className="command-key">Ctrl K</kbd>
          </button>

          <NotificationDropdown
  notifications={notifications}
  unreadCount={unreadCount}
  onMarkRead={(id) => { /* mark single read */ }}
  onMarkAllRead={() => setUnreadCount(0)}
  onViewAll={() => navigate("/notifications")}
  pulseBadge={unreadCount > 0}
/>

          <ProfileDropdown
            user={user}
            userName={getUserDisplay()}
            userRole={userRole}
            userInitial={getUserInitial()}
            onLogout={handleLogout}
          />

          <button
            className="btn-primary"
            onClick={() => navigate("/new-order")}
            aria-label="Create new order"
          >
            <Plus size={18} aria-hidden="true" />
            <span className="btn-text">New Order</span>
          </button>
        </div>
      </div>

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        userRole={userRole}
      />
    </>
  );
};

export default Topbar;