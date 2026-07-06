import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, HelpCircle, ChevronDown } from "lucide-react";
// @ts-ignore
import { supabase } from "../../lib/supabaseClient";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.pd-wrap { position: relative; font-family: 'Outfit', system-ui, sans-serif; }

/* Trigger button */
.pd-trigger {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 10px 5px 5px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s;
}
.pd-trigger:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.11); }
.pd-trigger.open  { background: rgba(108,114,243,0.08); border-color: rgba(108,114,243,0.25); }

/* Avatar */
.pd-av {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  flex-shrink: 0;
  transition: box-shadow 0.2s;
}
.pd-trigger:hover .pd-av, .pd-trigger.open .pd-av {
  box-shadow: 0 0 0 2px rgba(108,114,243,0.4);
}

/* Name/role */
.pd-info { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; }
.pd-name {
  font-size: 12.5px; font-weight: 600; color: #c8d0e0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 110px; line-height: 1;
}
.pd-role {
  font-size: 10px; font-weight: 600;
  margin-top: 2px; padding: 1px 6px; border-radius: 20px;
  white-space: nowrap;
}

/* Chevron */
.pd-chev {
  color: #3a4460; flex-shrink: 0;
  transition: transform 0.2s, color 0.18s;
}
.pd-trigger.open .pd-chev { transform: rotate(180deg); color: #6c72f3; }
.pd-trigger:hover .pd-chev { color: #556070; }

/* Dropdown panel */
.pd-panel {
  position: absolute; top: calc(100% + 10px); right: 0;
  width: 230px;
  background: #0f1320;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
  z-index: 9999; overflow: hidden;
  animation: pdSlideIn 0.2s cubic-bezier(0.4,0,0.2,1);
}

/* Profile card at top of panel */
.pd-card {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.pd-card-av {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700; flex-shrink: 0;
}
.pd-card-name {
  font-size: 13px; font-weight: 700; color: #edf0f8;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pd-card-email {
  font-size: 11px; color: #3a4460;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-top: 2px;
  font-family: 'DM Mono', monospace;
}

/* Menu items */
.pd-menu { padding: 6px; }
.pd-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px; width: 100%;
  background: transparent; border: none;
  color: #8892a4; font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: 'Outfit', sans-serif;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}
.pd-item:hover { background: rgba(255,255,255,0.05); color: #edf0f8; }

.pd-item-ico {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04); flex-shrink: 0;
  transition: background 0.15s;
}
.pd-item:hover .pd-item-ico { background: rgba(255,255,255,0.08); }

/* Divider */
.pd-div { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 6px; }

/* Logout item */
.pd-logout {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px; width: 100%;
  background: transparent; border: none;
  color: #556070; font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: 'Outfit', sans-serif;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}
.pd-logout:hover { background: rgba(248,113,113,0.08); color: #f87171; }
.pd-logout:hover .pd-logout-ico { background: rgba(248,113,113,0.12); }
.pd-logout-ico {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04); flex-shrink: 0;
  transition: background 0.15s;
}

@keyframes pdSlideIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
`;

const ROLE_META: Record<string, { color: string }> = {
  admin:      { color: "#6c72f3" },
  gm:         { color: "#a78bfa" },
  manager:    { color: "#22d3ee" },
  staff:      { color: "#34d399" },
  courier:    { color: "#dba96a" },
  strategist: { color: "#f87171" },
};

interface ProfileDropdownProps {
  user: any;
  userName: string;
  userRole: string;
  userInitial: string;
  onLogout: () => void;
}

export const ProfileDropdown = ({
  user,
  userName,
  userRole,
  userInitial,
  onLogout,
}: ProfileDropdownProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const roleMeta = ROLE_META[userRole] ?? { color: "#9aa3b5" };
  const email    = user?.email ?? "";

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handleNavigate = (path: string) => { navigate(path); setIsOpen(false); };
  const handleLogoutClick = async () => { setIsOpen(false); await onLogout(); };

  const menuItems = [
    { icon: User,        label: "My Profile",    path: "/profile",  show: true },
    { icon: Settings,    label: "Settings",       path: "/settings", show: userRole === "admin" || userRole === "gm" },
    { icon: HelpCircle,  label: "Help & Support", path: "/help",     show: true },
  ].filter(item => item.show);

  return (
    <div ref={ref} className="pd-wrap">
      <style>{CSS}</style>

      <button
        className={`pd-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label="Open account menu"
        aria-expanded={isOpen}
      >
        <div className="pd-av" style={{ background: roleMeta.color + "22", color: roleMeta.color }}>
          {userInitial}
        </div>
        <div className="pd-info">
          <span className="pd-name">{userName}</span>
          {userRole && (
            <span className="pd-role" style={{ background: roleMeta.color + "18", color: roleMeta.color }}>
              {userRole}
            </span>
          )}
        </div>
        <ChevronDown size={13} className="pd-chev" />
      </button>

      {isOpen && (
        <div className="pd-panel" role="menu">

          {/* Profile card */}
          <div className="pd-card">
            <div className="pd-card-av" style={{ background: roleMeta.color + "22", color: roleMeta.color }}>
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pd-card-name">{userName}</div>
              {email && <div className="pd-card-email">{email}</div>}
            </div>
          </div>

          {/* Menu items */}
          <div className="pd-menu">
            {menuItems.map((item, i) => (
              <button
                key={i}
                className="pd-item"
                onClick={() => handleNavigate(item.path)}
                role="menuitem"
              >
                <div className="pd-item-ico"><item.icon size={14} /></div>
                {item.label}
              </button>
            ))}

            <div className="pd-div" role="separator" />

            <button className="pd-logout" onClick={handleLogoutClick} role="menuitem">
              <div className="pd-logout-ico"><LogOut size={14} /></div>
              Log out
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;