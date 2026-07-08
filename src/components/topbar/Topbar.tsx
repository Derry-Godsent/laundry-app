import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Menu, User, LogOut } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { NotificationDropdown } from "./NotificationDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
// @ts-ignore
import { supabase } from "../../lib/supabaseClient";
import "./Topbar.css";

interface TopbarProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export const Topbar = ({ onMenuClick, isMobile = false }: TopbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch current user session + staff profile
useEffect(() => {
  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      
      // Fetch staff profile (role + full_name) from your staff table
      const { data: staffData } = await supabase
        .from("staff")
        .select("role, first_name, last_name")
        .eq("id", session.user.id)  // staff.id matches auth.users.id
        .maybeSingle();
      
      if (staffData?.role) setUserRole(staffData.role);
    }
  };
  fetchUser();

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event: string, session: any) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setUserRole("");
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);

  // Listen for real-time notifications (prepare for your NotificationDropdown)
  useEffect(() => {
    if (!user) return;

    // Subscribe to changes in tables that should trigger notifications
    const channel = supabase
      .channel('topbar-notifications')
      .on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'orders', filter: `client_id=eq.${user.id}` },
  (payload: any) => {
    // Add new notification to state
    const newNotification = {
      id: payload.new?.id || Date.now(),
      title: "Order Updated",
      message: `Order ${payload.new?.order_id || '#???'} was ${payload.eventType}`,
      time: new Date().toLocaleTimeString(),
      read: false,
      type: payload.eventType === 'INSERT' ? 'success' : 'info'
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
    setUnreadCount(prev => prev + 1);
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
        setIsCommandOpen(prev => !prev);
      }
      // Escape closes command palette
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

  // Format user display name (fetches from staff table via state)
const getUserDisplay = () => {
  if (!user) return "Guest";
  
  // We'll fetch full_name from staff table in the effect above
  // For now, fallback to email prefix if staff data not yet loaded
  if (user.email) {
    // Try to get first name from email prefix as temporary fallback
    const prefix = user.email.split("@")[0];
    // Capitalize first letter: "admin" → "Admin"
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return "User";
};

  // Get user avatar initial
  const getUserInitial = () => {
    const name = getUserDisplay();
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          {/* Mobile Hamburger Button */}
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
          {/* Command Search */}
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

          {/* Notifications with live count */}
          <NotificationDropdown 
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={() => setUnreadCount(0)}
          />

          {/* Profile Dropdown with user info */}
          <ProfileDropdown 
            user={user}
            userName={getUserDisplay()}
            userRole={userRole}
            userInitial={getUserInitial()}
            onLogout={handleLogout}
          />

          {/* New Order Button */}
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

      {/* Command Palette Modal */}
      <CommandPalette 
        isOpen={isCommandOpen} 
        onClose={() => setIsCommandOpen(false)}
        userRole={userRole}
      />
    </>
  );
};

export default Topbar;