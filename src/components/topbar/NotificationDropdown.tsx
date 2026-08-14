import { useState, useRef, useEffect } from "react";
import { Bell, Check, X, CheckCircle, Info, AlertTriangle, AlertCircle } from "lucide-react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

.nd-wrap { position: relative; font-family: 'Outfit', system-ui, sans-serif; }

/* Bell button */
.nd-bell {
  position: relative;
  width: 36px; height: 36px;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  color: #556070;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.nd-bell:hover { background: rgba(255,255,255,0.07); color: #9aa3b5; border-color: rgba(255,255,255,0.11); }
.nd-bell.open  { background: rgba(108,114,243,0.12); color: #6c72f3; border-color: rgba(108,114,243,0.3); }
.nd-bell:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }

/* Unread badge */
.nd-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 17px; height: 17px; padding: 0 4px;
  border-radius: 20px;
  background: #f87171; color: #fff;
  font-size: 9.5px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #07090e;
  animation: ndPop 0.3s cubic-bezier(0.4,0,0.2,1);
}

.nd-badge.pulse {
  animation: ndPop 0.3s cubic-bezier(0.4,0,0.2,1), ndPulse 2s infinite;
}

@keyframes ndPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* Panel */
.nd-panel {
  position: absolute; top: calc(100% + 10px); right: 0;
  width: 340px;
  background: #0f1320;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
  z-index: 9999;
  overflow: hidden;
  animation: ndSlideIn 0.22s cubic-bezier(0.4,0,0.2,1);
}

/* Panel header */
.nd-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.nd-head-title {
  font-size: 13.5px; font-weight: 700; color: #edf0f8;
  display: flex; align-items: center; gap: 8px;
}
.nd-unread-chip {
  font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 20px;
  background: rgba(108,114,243,0.15); color: #6c72f3;
}
.nd-mark-all {
  font-size: 11.5px; font-weight: 600; color: #3a4460;
  background: none; border: none; cursor: pointer;
  font-family: 'Outfit', sans-serif;
  transition: color 0.15s; padding: 0;
}
.nd-mark-all:hover { color: #9aa3b5; }
.nd-mark-all:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }

/* List */
.nd-list { max-height: 320px; overflow-y: auto; }
.nd-list::-webkit-scrollbar { width: 3px; }
.nd-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }

/* Empty */
.nd-empty {
  padding: 36px 20px;
  text-align: center;
  color: #3a4460;
  font-size: 13px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.nd-empty-ico { font-size: 28px; opacity: 0.5; }

/* Item */
.nd-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: pointer;
  transition: background-color 0.15s ease;
  animation: ndRowIn 0.3s cubic-bezier(0.4,0,0.2,1) both;
  position: relative;
}
.nd-item:last-child { border-bottom: none; }
.nd-item:hover { background: rgba(255,255,255,0.03); }
.nd-item.unread { background: rgba(108,114,243,0.04); }

/* Colour strip on left edge */
.nd-strip {
  position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  border-radius: 0 3px 3px 0;
}

/* Type icon */
.nd-ico {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.nd-content { flex: 1; min-width: 0; }
.nd-item-title {
  font-size: 12.5px; font-weight: 600; color: #c8d0e0;
  margin-bottom: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nd-item-desc {
  font-size: 11.5px; color: #556070;
  line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.nd-item-time { font-size: 10.5px; color: #2e3a4e; margin-top: 4px; }

/* Item actions */
.nd-item-acts {
  display: flex; align-items: center; gap: 4px;
  flex-shrink: 0; opacity: 0;
  transition: opacity 0.15s ease;
}
.nd-item:hover .nd-item-acts { opacity: 1; }
.nd-act-btn {
  width: 24px; height: 24px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #9aa3b5; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.nd-act-btn:hover { background: rgba(255,255,255,0.1); color: #edf0f8; }
.nd-act-btn.dismiss:hover { background: rgba(248,113,113,0.12); color: #f87171; border-color: rgba(248,113,113,0.2); }
.nd-act-btn:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }

/* Unread dot */
.nd-unread-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #6c72f3; flex-shrink: 0; margin-top: 5px;
}

/* Footer */
.nd-footer {
  padding: 10px 16px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.nd-view-all {
  width: 100%; padding: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  color: #556070; font-size: 12.5px; font-weight: 600;
  cursor: pointer; font-family: 'Outfit', sans-serif;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.nd-view-all:hover { background: rgba(255,255,255,0.06); color: #9aa3b5; }
.nd-view-all:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }

@keyframes ndSlideIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes ndPop     { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes ndRowIn   { from { opacity: 0; transform: translateX(6px); } to { opacity: 1; transform: translateX(0); } }

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .nd-bell, .nd-act-btn, .nd-view-all, .nd-mark-all {
    transition: none;
  }
  .nd-panel, .nd-item, .nd-badge {
    animation: none;
  }
  .nd-badge.pulse {
    animation: none;
  }
}
`;

interface Notification {
  id: string | number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "success" | "info" | "warning" | "error";
}

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id?: string | number) => void;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
  pulseBadge?: boolean;
}

const TYPE_META: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  success: { color: "#34d399", bg: "rgba(52,211,153,0.12)",  icon: CheckCircle },
  info:    { color: "#6c72f3", bg: "rgba(108,114,243,0.12)", icon: Info },
  warning: { color: "#dba96a", bg: "rgba(219,169,106,0.12)", icon: AlertTriangle },
  error:   { color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: AlertCircle },
};

export const NotificationDropdown = ({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onViewAll,
  pulseBadge = false,
}: NotificationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const handleDismiss = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkRead(id);
  };

  const handleMarkAllRead = () => {
    if (onMarkAllRead) {
      onMarkAllRead();
    } else {
      onMarkRead();
    }
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    }
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="nd-wrap">
      <style>{CSS}</style>

      <button
        className={`nd-bell ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className={`nd-badge ${pulseBadge ? "pulse" : ""}`}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="nd-panel" role="dialog" aria-label="Notifications">

          {/* Header */}
          <div className="nd-head">
            <span className="nd-head-title">
              Notifications
              {unreadCount > 0 && <span className="nd-unread-chip">{unreadCount} new</span>}
            </span>
            {unreadCount > 0 && (
              <button className="nd-mark-all" onClick={handleMarkAllRead} aria-label="Mark all as read">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="nd-list">
            {notifications.length === 0 ? (
              <div className="nd-empty">
                <span className="nd-empty-ico">🔔</span>
                No new notifications
              </div>
            ) : (
              notifications.map((n, i) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.info;
                const IconComponent = meta.icon;
                return (
                  <div
                    key={n.id}
                    className={`nd-item ${n.read ? "" : "unread"}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => onMarkRead(n.id)}
                    role="listitem"
                  >
                    <div className="nd-strip" style={{ background: meta.color }} />
                    <div className="nd-ico" style={{ background: meta.bg }}>
                      <IconComponent size={16} color={meta.color} />
                    </div>
                    <div className="nd-content">
                      <div className="nd-item-title">{n.title}</div>
                      <div className="nd-item-desc">{n.message}</div>
                      <div className="nd-item-time">{n.time}</div>
                    </div>
                    <div className="nd-item-acts">
                      {!n.read && (
                        <button className="nd-act-btn" title="Mark as read" onClick={e => { e.stopPropagation(); onMarkRead(n.id); }}>
                          <Check size={11} />
                        </button>
                      )}
                      <button className="nd-act-btn dismiss" title="Dismiss" onClick={e => handleDismiss(n.id, e)}>
                        <X size={11} />
                      </button>
                    </div>
                    {!n.read && <div className="nd-unread-dot" />}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="nd-footer">
              <button className="nd-view-all" onClick={handleViewAll}>
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;