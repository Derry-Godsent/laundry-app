import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, X, CheckCircle, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useOverlay } from "@/components/ui/useOverlay";

const CSS = `

.nd-wrap { position: relative; font-family: var(--font-ui); }

/* Bell button */
.nd-bell {
  position: relative;
  width: 36px; height: 36px;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  color: var(--text-4);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.nd-bell:hover { background: rgba(255,255,255,0.07); color: var(--text-2); border-color: rgba(255,255,255,0.11); }
.nd-bell.open  { background: var(--brand-soft); color: var(--brand-500); border-color: var(--brand-border); }
.nd-bell:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; }

/* Unread badge */
.nd-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 17px; height: 17px; padding: 0 4px;
  border-radius: 20px;
  background: var(--bad-500); color: #fff;
  font-size: var(--fs-2xs); font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--ink-base);
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
  /* Positioned from the bell's measured rect, in the element's own custom
     properties, so it can never be anchored off the side of a small screen.
     --nd-x is the distance from the viewport's right edge. */
  position: fixed; top: var(--nd-top, 84px); right: var(--nd-x, 24px);
  width: 340px; max-width: calc(100vw - 24px);
  background: var(--ink-card);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
  z-index: 9999;
  overflow: hidden;
  overscroll-behavior: contain;
  animation: ndSlideIn 0.22s cubic-bezier(0.4,0,0.2,1);
}

/* Panel header */
.nd-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.nd-head-title {
  font-size: var(--fs-md); font-weight: 700; color: var(--text-1);
  display: flex; align-items: center; gap: 8px;
}
.nd-head-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.nd-unread-chip {
  font-size: var(--fs-2xs); font-weight: 700;
  padding: 2px 7px; border-radius: 20px;
  background: var(--brand-soft); color: var(--brand-500);
}
.nd-mark-all {
  font-size: var(--fs-xs); font-weight: 600; color: var(--text-4);
  background: none; border: none; cursor: pointer;
  font-family: var(--font-ui);
  transition: color 0.15s; padding: 0;
}
.nd-mark-all:hover { color: var(--text-2); }
.nd-mark-all:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; }

/* List. It is the scroller of the panel's flex column, so a long list scrolls
   inside the panel instead of being clipped at the panel's edge, and reaching
   the end of it does not hand the scroll to the page behind. */
.nd-list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 320px;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
.nd-list::-webkit-scrollbar { width: 3px; }
.nd-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }

/* Empty */
.nd-empty {
  padding: 36px 20px;
  text-align: center;
  color: var(--text-4);
  font-size: var(--fs-sm);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.nd-empty-ico { display: inline-flex; color: var(--text-4); }

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
.nd-item.unread { background: var(--brand-soft); }

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
  font-size: var(--fs-sm); font-weight: 600; color: var(--text-2);
  margin-bottom: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nd-item-desc {
  font-size: var(--fs-xs); color: var(--text-4);
  line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.nd-item-time { font-size: var(--fs-2xs); color: var(--text-4); margin-top: 4px; }

/* Item actions */
.nd-item-acts {
  display: flex; align-items: center; gap: 4px;
  flex-shrink: 0; opacity: 0;
  transition: opacity 0.15s ease;
}
.nd-item:hover .nd-item-acts { opacity: 1; }

/* A touch screen has no hover, so anything that only appears on hover is
   invisible and, in practice, unreachable. */
@media (hover: none) {
  .nd-item-acts { opacity: 1; }
}
.nd-act-btn {
  width: 24px; height: 24px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: var(--text-2); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.nd-act-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-1); }
.nd-act-btn.dismiss:hover { background: var(--bad-soft); color: var(--bad-500); border-color: var(--bad-soft); }
.nd-act-btn:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; }

/* Unread dot */
.nd-unread-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--brand-500); flex-shrink: 0; margin-top: 5px;
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
  color: var(--text-4); font-size: var(--fs-sm); font-weight: 600;
  cursor: pointer; font-family: var(--font-ui);
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.nd-view-all:hover { background: rgba(255,255,255,0.06); color: var(--text-2); }
.nd-view-all:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; }

@keyframes ndSlideIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes ndPop     { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes ndRowIn   { from { opacity: 0; transform: translateX(6px); } to { opacity: 1; transform: none; } }

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

/* ── Phones: the panel becomes a sheet under the top bar ───────────────── */
@media (max-width: 640px) {
  .nd-scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: rgba(2, 3, 7, 0.55);
    /* The backdrop swallows the gesture: without this, a swipe on the empty
       space beside the sheet scrolls the page behind it. */
    touch-action: none;
    animation: fadeIn 0.2s var(--ease-out, ease) both;
  }

  .nd-panel {
    /* Hangs below the top bar and is capped by what is on screen, so it can
       never be taller than the visible area and never puts its own action row
       out of reach: the header stays at the top, the footer at the bottom, and
       the list between them is the only thing that scrolls. A short list gives
       a short sheet; a long one scrolls inside this box. The cap comes from the
       visual viewport, so it holds while the page is zoomed or the keyboard is
       open. */
    top: calc(var(--vv-top, 0px) + var(--safe-top, 0px) + var(--topbar-h, 56px) + 8px);
    bottom: auto;
    left: 10px;
    right: 10px;
    width: auto;
    max-width: none;
    max-height: calc(
      var(--vv-h, 100dvh) - var(--safe-top, 0px) - var(--safe-bottom, 0px) - var(--topbar-h, 56px) - 32px
    );
  }

  .nd-list { max-height: none; }

  .nd-head { padding: 12px 12px 10px 16px; gap: 8px; }
  .nd-head-title { font-size: var(--fs-md); }
  .nd-mark-all { min-height: 32px; padding: 0 8px; }
  .nd-close { display: inline-flex; }
  .nd-item { padding: 13px 14px; gap: 10px; }
  .nd-item-title { font-size: var(--fs-sm); }
  .nd-item-desc { font-size: var(--fs-sm); }
  .nd-item-time { font-size: var(--fs-2xs); }
  .nd-act-btn { width: 36px; height: 36px; }
  .nd-view-all { padding: 12px; font-size: var(--fs-md); }
}

/* Close button: the sheet is dismissed by tapping the backdrop as well, but a
   visible way out is what a phone user reaches for. */
.nd-close {
  display: none; align-items: center; justify-content: center;
  width: 32px; height: 32px; flex-shrink: 0;
  border: 1px solid var(--line-soft);
  background: var(--ink-raised);
  color: var(--text-3);
  border-radius: var(--r-sm);
  cursor: pointer;
}
.nd-close:hover { color: var(--text-1); background: var(--ink-active); }
.nd-close:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; }

/* ── Console alignment ───────────────────────────────────────────────────
   Alerts sit in the topbar next to the account menu, so they use the same
   surface, line and text tokens as the rest of the console. */
.nd-wrap { font-family: var(--font-ui); }
.nd-bell {
  width: 38px; height: 38px;
  border-radius: var(--r-sm);
  border-color: var(--line-soft);
  background: var(--ink-card);
  color: var(--text-3);
}
/* Phones: match the 40px controls either side of it, so the row reads as one
   hand of the same tools rather than four different sizes. */
@media (max-width: 480px), (pointer: coarse) {
  .nd-bell { width: 40px; height: 40px; }
}
.nd-bell:hover { background: var(--ink-hover); border-color: var(--line); color: var(--text-1); }
.nd-bell.open { background: var(--brand-soft); border-color: var(--brand-border); color: var(--brand-400); }
.nd-badge { background: var(--bad-500); color: var(--on-bad); border-color: var(--ink-shell); }
.nd-panel {
  background: var(--ink-hover);
  border-color: var(--line-soft);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-modal);
}
.nd-head { border-bottom-color: var(--line-faint); }
.nd-head-title { color: var(--text-1); }
.nd-unread-chip { background: var(--brand-soft); color: var(--brand-400); }
.nd-mark-all { color: var(--text-4); font-family: var(--font-ui); }
.nd-mark-all:hover { color: var(--text-2); }
.nd-item { border-bottom-color: var(--line-faint); }
.nd-item:hover { background: rgba(255, 255, 255, 0.035); }
.nd-item.unread { background: var(--brand-soft); }
.nd-item-title { color: var(--text-1); }
.nd-item-desc { color: var(--text-3); }
.nd-item-time { color: var(--text-4); }
.nd-empty { color: var(--text-4); }
.nd-act-btn { border-color: var(--line-soft); background: var(--ink-raised); color: var(--text-3); border-radius: var(--r-xs); }
.nd-act-btn:hover { background: var(--ink-active); color: var(--text-1); }
.nd-unread-dot { background: var(--brand-500); }
.nd-footer { border-top-color: var(--line-faint); }
.nd-view-all {
  background: var(--ink-raised);
  border-color: var(--line-soft);
  border-radius: var(--r-sm);
  color: var(--text-2);
  font-family: var(--font-ui);
}
.nd-view-all:hover { background: var(--ink-active); color: var(--text-1); }
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
  success: { color: "var(--ok-500)", bg: "var(--ok-soft)",  icon: CheckCircle },
  info:    { color: "var(--brand-500)", bg: "var(--brand-soft)", icon: Info },
  warning: { color: "var(--warn-500)", bg: "var(--warn-soft)", icon: AlertTriangle },
  error:   { color: "var(--bad-500)", bg: "var(--bad-soft)", icon: AlertCircle },
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
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  /* Under 640px the panel is a sheet with a backdrop, so it behaves like a
     dialog: the page behind it cannot scroll and Escape closes it. On a desk it
     stays a dropdown anchored to the bell. */
  const isSheet = useMediaQuery("(max-width: 640px)");
  const close = useCallback(() => setIsOpen(false), []);
  const sheetRef = useOverlay(isOpen && isSheet, close);

  /* The topbar has a backdrop-filter, which makes it a containing block for
     anything position: fixed inside it. The panel is therefore rendered in a
     portal on <body>, and it reads its position from the bell's own rect. */
  const measure = useCallback(() => {
    const trigger = ref.current?.querySelector(".nd-bell");
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setAnchor({
      top: rect.bottom + 10,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    measure();

    const handle = () => measure();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [isOpen, measure]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
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

      {isOpen && createPortal(
        <>
        {isSheet ? (
          <div className="nd-scrim" onClick={close} aria-hidden="true" />
        ) : null}
        <div
          ref={(node) => {
            panelRef.current = node;
            sheetRef.current = node;
          }}
          className="nd-panel"
          role="dialog"
          aria-label="Notifications"
          style={{
            ["--nd-top" as string]: `${anchor?.top ?? 84}px`,
            ["--nd-x" as string]: `${anchor?.right ?? 24}px`,
          }}
        >

          {/* Header */}
          <div className="nd-head">
            <span className="nd-head-title">
              Notifications
              {unreadCount > 0 && <span className="nd-unread-chip">{unreadCount} new</span>}
            </span>
            <span className="nd-head-actions">
              {unreadCount > 0 && (
                <button className="nd-mark-all" onClick={handleMarkAllRead} aria-label="Mark all as read">
                  Mark all read
                </button>
              )}
              <button className="nd-close" onClick={close} aria-label="Close notifications" data-autofocus>
                <X size={15} />
              </button>
            </span>
          </div>

          {/* List */}
          <div className="nd-list" role="list">
            {notifications.length === 0 ? (
              <div className="nd-empty">
                <span className="nd-empty-ico"><Bell size={22} /></span>
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
        </>,
        document.body
      )}
    </div>
  );
};

export default NotificationDropdown;