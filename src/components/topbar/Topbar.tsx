import { useState, useEffect } from "react";
import { useConnection } from "@/hooks/useConnection";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Menu } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { NotificationDropdown } from "./NotificationDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
import { supabase } from "../../lib/supabaseClient";
import { useIntakeNotifications } from "../../hooks/useIntakeNotifications";
import type { User } from "@supabase/supabase-js";
import "./Topbar.css";

interface TopbarProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

interface NotificationItem {
  id: number | string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "success" | "info" | "warning" | "error";
  /** Where clicking this alert takes the office. */
  href?: string;
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

  /* ─── LIVE ALERTS ──────────────────────────────────────────────────────────
     Every alert comes from a record: a customer sending a request, asking for a
     service, or answering a date Chapman offered. The count is what is new since
     this staff member last looked, so it is honest rather than decorative. */
  const { notifications: intakeAlerts, unreadCount, markRead, markAllRead } = useIntakeNotifications(user?.id ?? null, Boolean(user));

  // Clicking an alert marks it read and opens the queue it belongs to.
  const handleAlertClick = (id?: number | string) => {
    if (id === undefined || id === null) return;
    const item = intakeAlerts.find((entry) => String(entry.id) === String(id));
    markRead([String(id)]);
    if (item?.href) navigate(item.href);
  };

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
          <ConnectionPill />

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
            notifications={intakeAlerts}
            unreadCount={unreadCount}
            onMarkRead={handleAlertClick}
            onMarkAllRead={markAllRead}
            onViewAll={() => navigate("/mobile-requests")}
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
            className="btn btn--primary topbar-action"
            onClick={() => navigate("/new-order")}
            aria-label="Create new order"
          >
            <Plus size={17} aria-hidden="true" />
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

/**
 * Whether the console is talking to the backend, on every page.
 *
 * It reads the shared connection store rather than watching `navigator.onLine`
 * itself, so this indicator, the banner under the bar and every page agree.
 * The word is hidden on narrow phones, where the dot and its accessible name
 * carry it.
 */
const ConnectionPill = () => {
  const { status, reason } = useConnection();

  const label =
    status === "live"
      ? "Live. Connected to the system."
      : status === "checking"
        ? "Checking the connection."
        : reason === "server"
          ? "Offline. The server is not responding."
          : "Offline. This device has no connection.";

  return (
    <span className={`conn-pill conn-pill--${status}`} title={label} aria-label={label} role="status">
      <span className="conn-pill__dot" aria-hidden="true" />
      <span className="conn-pill__text">
        {status === "live" ? "Live" : status === "checking" ? "Checking" : "Offline"}
      </span>
    </span>
  );
};

export default Topbar;