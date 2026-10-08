import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, HelpCircle, ChevronDown } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const CSS = `

.pd-wrap { position: relative; font-family: var(--font-ui); }

/* Trigger button */
.pd-trigger {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 10px 5px 5px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}
.pd-trigger:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.11); }
.pd-trigger.open  { background: var(--brand-soft); border-color: var(--brand-border); }
.pd-trigger:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; }

/* Avatar */
.pd-av {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--fs-xs); font-weight: 700;
  flex-shrink: 0;
  transition: box-shadow 0.2s ease;
}
.pd-trigger:hover .pd-av, .pd-trigger.open .pd-av {
  box-shadow: 0 0 0 2px var(--brand-border);
}

/* Name/role */
.pd-info { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; }
.pd-name {
  font-size: var(--fs-sm); font-weight: 600; color: var(--text-2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 110px; line-height: 1;
}
.pd-role {
  font-size: var(--fs-2xs); font-weight: 600; text-transform: capitalize;
  margin-top: 2px; padding: 1px 6px; border-radius: 20px;
  white-space: nowrap;
}

/* Chevron */
.pd-chev {
  color: var(--text-4); flex-shrink: 0;
  transition: transform 0.2s ease, color 0.18s ease;
}
.pd-trigger.open .pd-chev { transform: rotate(180deg); color: var(--brand-500); }
.pd-trigger:hover .pd-chev { color: var(--text-4); }

/* Mobile: collapse to avatar only */
@media (max-width: 480px) {
  .pd-trigger { width: 40px; height: 40px; padding: 0; justify-content: center; gap: 0; }
  .pd-info { display: none; }
  .pd-chev { display: none; }
}

/* Dropdown panel */
.pd-panel {
  position: absolute; top: calc(100% + 10px); right: 0;
  width: 230px; max-width: 90vw; /* Prevents overflow on small screens */
  background: var(--ink-card);
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
  font-size: var(--fs-lg); font-weight: 700; flex-shrink: 0;
}
.pd-card-name {
  font-size: var(--fs-sm); font-weight: 700; color: var(--text-1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pd-card-email {
  font-size: var(--fs-2xs); color: var(--text-4);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-top: 2px;
  font-family: var(--font-mono);
}

/* Menu items */
.pd-menu { padding: 6px; }
.pd-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px; width: 100%;
  background: transparent; border: none;
  color: var(--text-3); font-size: var(--fs-sm); font-weight: 500;
  cursor: pointer; font-family: var(--font-ui);
  text-align: left; text-transform: capitalize;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.pd-item:hover { background: rgba(255,255,255,0.05); color: var(--text-1); }
.pd-item:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; }

.pd-item-ico {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04); flex-shrink: 0;
  transition: background-color 0.15s ease;
}
.pd-item:hover .pd-item-ico { background: rgba(255,255,255,0.08); }

/* Divider */
.pd-div { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 6px; }

/* Logout item */
.pd-logout {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px; width: 100%;
  background: transparent; border: none;
  color: var(--text-4); font-size: var(--fs-sm); font-weight: 500;
  cursor: pointer; font-family: var(--font-ui);
  text-align: left;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.pd-logout:hover { background: var(--bad-soft); color: var(--bad-500); }
.pd-logout:focus-visible { outline: 2px solid var(--bad-500); outline-offset: 2px; }
.pd-logout:hover .pd-logout-ico { background: var(--bad-soft); }
.pd-logout-ico {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04); flex-shrink: 0;
  transition: background-color 0.15s ease;
}

@keyframes pdSlideIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .pd-trigger, .pd-av, .pd-chev, .pd-item, .pd-logout, .pd-item-ico, .pd-logout-ico { transition: none; }
  .pd-panel { animation: none; }
}

/* ── Console alignment ───────────────────────────────────────────────────
   The account menu is part of the topbar, so it borrows the console's own
   tokens instead of carrying its own extra font import. */
.pd-wrap { font-family: var(--font-ui); }
.pd-trigger {
  background: var(--ink-card);
  border-color: var(--line-soft);
  border-radius: var(--r-sm);
}
.pd-trigger:hover { background: var(--ink-hover); border-color: var(--line); }
.pd-trigger.open { background: var(--brand-soft); border-color: var(--brand-border); }
.pd-av { border-radius: var(--r-xs); }
.pd-name { color: var(--text-1); }
.pd-role { letter-spacing: 0.04em; text-transform: uppercase; }
.pd-chev { color: var(--text-4); }
.pd-panel {
  background: var(--ink-hover);
  border-color: var(--line-soft);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-modal);
}
.pd-card { border-bottom-color: var(--line-faint); }
.pd-card-av { border-radius: var(--r-sm); }
.pd-card-name { color: var(--text-1); }
.pd-card-email { color: var(--text-4); font-family: var(--font-mono); }
.pd-menu { padding: var(--sp-2); }
.pd-item,
.pd-logout {
  border-radius: var(--r-sm);
  font-family: var(--font-ui);
  color: var(--text-2);
  font-weight: 550;
}
.pd-item:hover { background: var(--ink-active); color: var(--text-1); }
.pd-logout:hover { background: var(--bad-soft); color: var(--bad-500); }
.pd-item-ico,
.pd-logout-ico {
  background: var(--ink-raised);
  border: 1px solid var(--line-faint);
  border-radius: var(--r-xs);
}
.pd-div { background: var(--line-faint); }
`;

const ROLE_META: Record<string, { color: string }> = {
  admin:      { color: "var(--brand-500)" },
  manager:    { color: "var(--info-500)" },
  strategist: { color: "var(--brand-400)" },
  staff:      { color: "var(--ok-500)" },
  courier:    { color: "var(--warn-500)" },
};

interface ProfileDropdownProps {
  user: SupabaseUser | null;
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

  const roleMeta = ROLE_META[userRole] ?? { color: "var(--text-2)" };
  const email    = user?.email ?? "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleNavigate = (path: string) => { navigate(path); setIsOpen(false); };
  const handleLogoutClick = async () => { setIsOpen(false); await onLogout(); };

  const menuItems = [
    { icon: User,        label: "My Profile",    path: "/profile",  show: true },
    { icon: Settings,    label: "Settings",      path: "/settings", show: userRole === "admin" || userRole === "manager" },
    { icon: HelpCircle,  label: "Help & Support",path: "/help",     show: true },
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
          <div className="pd-card">
            <div className="pd-card-av" style={{ background: roleMeta.color + "22", color: roleMeta.color }}>
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pd-card-name">{userName}</div>
              {email && <div className="pd-card-email">{email}</div>}
            </div>
          </div>

          <div className="pd-menu">
            {menuItems.map((item) => (
              <button
                key={item.label}
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