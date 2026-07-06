import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, Plus, X, Check, CreditCard, ArrowUpRight, ArrowDownRight,
  Clock, AlertCircle, WifiOff, RefreshCw, CloudOff, ChevronRight,
} from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { usePermission } from "../hooks/usePermission"; // ✅ Already present
import { PermissionGuard } from "../components/PermissionGuard"; // ✅ Already present

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
   A "ledger" palette — near-black base with an inked-emerald
   surface tint, warm brass for money-in-motion, and a violet
   accent reserved for interactive/focus states only.
───────────────────────────────────────────────────────────── */
const T = {
  bgBase:      "#05060a",
  bgSurface:   "#0a0c13",
  bgRaised:    "#10131d",
  bgElevated:  "#161a28",
  bgGlass:     "rgba(16,19,29,0.72)",

  borderFaint: "rgba(255,255,255,0.045)",
  borderSoft:  "rgba(255,255,255,0.085)",
  borderMid:   "rgba(255,255,255,0.14)",

  textPrimary: "#eef1f8",
  textSec:     "#98a1b5",
  textTert:    "#57617a",
  textHint:    "#333d54",

  accent:      "#8388f8",
  accentSoft:  "#6c72f3",
  accentDim:   "rgba(108,114,243,0.14)",
  accentBord:  "rgba(108,114,243,0.32)",
  accentGlow:  "rgba(108,114,243,0.35)",

  gold:        "#e2b57e",
  goldDim:     "rgba(226,181,126,0.12)",
  goldBord:    "rgba(226,181,126,0.26)",
  goldGlow:    "rgba(226,181,126,0.28)",

  emerald:     "#3fe3a6",
  emeraldDim:  "rgba(63,227,166,0.12)",
  emeraldBord: "rgba(63,227,166,0.24)",
  emeraldGlow: "rgba(63,227,166,0.30)",

  ember:       "#fb7676",
  emberDim:    "rgba(251,118,118,0.12)",
  emberBord:   "rgba(251,118,118,0.24)",
};

// ✅ System font stack (no custom fonts)
const FONT    = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO    = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace";
const DISPLAY = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// ❌ REMOVED: const TRANSACTIONS = [...] — no more generic data

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLE — keyframes, responsive rules, focus states.
   Kept in one <style> block so this stays a single file.
───────────────────────────────────────────────────────────── */
const GlobalStyle = () => (
  <style>{`
    @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.96) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }
    @keyframes pulseDot { 0%,100% { opacity:1; box-shadow:0 0 0 0 currentColor; } 50% { opacity:0.55; } }
    @keyframes ringPulse { 0% { box-shadow:0 0 0 0 rgba(63,227,166,0.35); } 70% { box-shadow:0 0 0 8px rgba(63,227,166,0); } 100% { box-shadow:0 0 0 0 rgba(63,227,166,0); } }
    @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
    @keyframes drift { 0%,100% { transform:translate(0,0); } 50% { transform:translate(-3%,4%); } }
    @keyframes slideBanner { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }

    .pay-root * { box-sizing:border-box; }
    .pay-row { animation:fadeInUp 0.45s ease both; }
    .pay-card { animation:fadeInUp 0.45s ease both; }
    .pay-stat { animation:scaleIn 0.5s cubic-bezier(.2,.8,.2,1) both; }

    .pay-searchbox:focus-within { border-color:${T.accentBord} !important; box-shadow:0 0 0 3px ${T.accentDim}; }
    .pay-input:focus { border-color:${T.accentBord} !important; box-shadow:0 0 0 3px ${T.accentDim}; }
    .pay-select:focus { border-color:${T.accentBord} !important; box-shadow:0 0 0 3px ${T.accentDim}; }

    .pay-filter-btn { transition:transform .18s ease, background .18s ease, border-color .18s ease, color .18s ease; }
    .pay-filter-btn:hover { transform:translateY(-1px); }
    .pay-filter-btn:active { transform:translateY(0); }

    .pay-primary-btn { transition:transform .16s ease, box-shadow .2s ease, filter .16s ease; }
    .pay-primary-btn:hover { transform:translateY(-1px); filter:brightness(1.06); box-shadow:0 8px 24px -8px ${T.emeraldGlow}; }
    .pay-primary-btn:active { transform:translateY(0); }

    .pay-ghost-btn { transition:background .16s ease, border-color .16s ease, color .16s ease, transform .16s ease; }
    .pay-ghost-btn:hover { background:${T.bgElevated}; border-color:${T.borderMid}; color:${T.textPrimary}; }

    .pay-table-row { transition:background .16s ease; }
    .pay-table-row:hover { background:rgba(255,255,255,0.022); }
    .pay-table-row:hover .pay-receipt-btn { background:${T.accentDim}; border-color:${T.accentBord}; color:#c7c9fc; }

    .pay-receipt-btn { transition:all .16s ease; }
    .pay-receipt-btn:hover { transform:translateX(1px); }

    .pay-close-btn { transition:all .16s ease; }
    .pay-close-btn:hover { background:${T.emberDim}; border-color:${T.emberBord}; color:${T.ember}; transform:rotate(90deg); }

    .pay-skeleton { background:linear-gradient(90deg, ${T.bgElevated} 0%, rgba(255,255,255,0.06) 50%, ${T.bgElevated} 100%); background-size:800px 100%; animation:shimmer 1.6s infinite linear; }

    .pay-orb { animation:drift 14s ease-in-out infinite; }

    .pay-cards-view { display:none; }
    @media (max-width: 880px) {
      .pay-table-view { display:none; }
      .pay-cards-view { display:flex; }
      .pay-stats-grid { grid-template-columns:repeat(2,1fr) !important; }
      .pay-header-row { flex-direction:column; align-items:flex-start !important; gap:14px; }
      .pay-controls-row { flex-direction:column; align-items:stretch !important; }
      .pay-controls-row > div:last-child { width:100% !important; }
    }
    @media (max-width: 520px) {
      .pay-stats-grid { grid-template-columns:1fr !important; }
    }

    @media (prefers-reduced-motion: reduce) {
      .pay-row, .pay-card, .pay-stat, .pay-orb { animation:none !important; }
      .pay-primary-btn:hover, .pay-filter-btn:hover { transform:none !important; }
    }

    /* ✅ MOBILE TWEAKS (added only) */
    @media (max-width: 480px) {
      .pay-header-row { padding: 16px !important; }
      .pay-controls-row { padding: 12px 16px !important; flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
      .pay-searchbox { width: 100% !important; }
      .pay-stats-grid { grid-template-columns: 1fr !important; }
      .pay-table-view { overflow-x: auto; }
      .pay-table-view table { min-width: 680px; }
    }
  `}</style>
);

/* ─── Small hook: animate a number counting up when it changes ─── */
const useCountUp = (target: number, duration = 700) => {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    const from = prevTarget.current;
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
      else prevTarget.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
};

/* ─── Hook: real browser connectivity, not a guess ─── */
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return isOnline;
};

/* ─── PAYMENT MODAL ────────────────────────────────────────── */
const PaymentModal = ({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) => {
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [ref, setRef] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const isValid = Boolean(orderId && amount);

  const handleSave = async () => {
    setTouched(true);
    if (!orderId || !amount) return;
    setSaving(true);
    await onSave({ orderId, amount: Number(amount), method, ref });
    setSaving(false);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(4,6,12,0.78)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
        animation: "fadeIn 0.2s ease both",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(180deg, ${T.bgElevated} 0%, ${T.bgRaised} 100%)`,
          border: `1px solid ${T.borderMid}`, borderRadius: 18, width: 480, maxWidth: "94vw",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.02)",
          animation: "scaleIn 0.25s cubic-bezier(.2,.8,.2,1) both",
        }}
      >
        <div style={{
          padding: "22px 26px", borderBottom: `1px solid ${T.borderFaint}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: `linear-gradient(135deg, ${T.emeraldDim}, transparent 60%)`,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, fontFamily: DISPLAY, letterSpacing: "-0.01em" }}>Record Payment</div>
            <div style={{ fontSize: 11.5, color: T.textTert, marginTop: 4, fontFamily: FONT }}>Add a payment against an outstanding order</div>
          </div>
          <button className="pay-close-btn" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${T.borderSoft}`, background: "transparent", color: T.textSec, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: T.textTert, marginBottom: 7, fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Order ID</div>
            <input
              className="pay-input"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. CPL-ORD-012"
              style={{
                width: "100%", padding: "11px 13px", background: T.bgSurface,
                border: `1px solid ${touched && !orderId ? T.emberBord : T.borderMid}`,
                borderRadius: 9, color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: FONT,
                transition: "border-color .16s ease, box-shadow .16s ease",
              }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: T.textTert, marginBottom: 7, fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Amount (GH₵)</div>
              <input
                className="pay-input"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: "100%", padding: "11px 13px", background: T.bgSurface,
                  border: `1px solid ${touched && !amount ? T.emberBord : T.borderMid}`,
                  borderRadius: 9, color: T.gold, fontSize: 14.5, outline: "none", fontFamily: MONO, fontWeight: 600,
                  transition: "border-color .16s ease, box-shadow .16s ease",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.textTert, marginBottom: 7, fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Payment Method</div>
              <select
                className="pay-select"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: "100%", padding: "10px 13px", background: T.bgSurface, border: `1px solid ${T.borderMid}`, borderRadius: 9, color: T.textPrimary, fontSize: 13.5, outline: "none", fontFamily: FONT, transition: "border-color .16s ease, box-shadow .16s ease" }}
              >
                <option>Cash</option>
                <option>Mobile Money</option>
                <option>Bank Transfer</option>
                <option>Card</option>
              </select>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textTert, marginBottom: 7, fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Reference / Note</div>
            <input
              className="pay-input"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. MTN-8821 or Cash drawer"
              style={{ width: "100%", padding: "11px 13px", background: T.bgSurface, border: `1px solid ${T.borderMid}`, borderRadius: 9, color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: FONT, transition: "border-color .16s ease, box-shadow .16s ease" }}
            />
          </div>
        </div>

        <div style={{ padding: "16px 26px", borderTop: `1px solid ${T.borderFaint}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} className="pay-ghost-btn" style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${T.borderSoft}`, borderRadius: 9, color: T.textSec, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: FONT }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="pay-primary-btn"
            disabled={saving}
            style={{
              padding: "9px 22px", background: T.emerald, border: "none", borderRadius: 9, color: "#03261a",
              fontSize: 13.5, fontWeight: 700, cursor: saving ? "default" : "pointer", display: "flex", alignItems: "center", gap: 8,
              fontFamily: FONT, opacity: saving ? 0.75 : 1,
            }}
          >
            {saving ? <RefreshCw size={14} className="pay-orb" style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={14} />}
            {saving ? "Saving…" : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── STAT CARD ─────────────────────────────────────────────── */
const StatCard = ({ label, value, prefix = "", icon, accentColor, delay, isCurrency = true }: any) => {
  const animated = useCountUp(value);
  return (
    <div
      className="pay-stat"
      style={{
        padding: "18px 26px", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        animationDelay: `${delay}ms`, position: "relative", overflow: "hidden",
      }}
    >
      <div>
        <div style={{ fontSize: 10.5, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, fontFamily: FONT }}>{label}</div>
        <div style={{ fontSize: 27, fontWeight: 600, color: T.textPrimary, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 8, fontFamily: DISPLAY }}>
          {isCurrency ? `${prefix}${animated.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : Math.round(animated)}
        </div>
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: T.bgElevated, border: `1px solid ${T.borderFaint}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset` }}>
        {icon}
      </div>
    </div>
  );
};

/* ─── CONNECTIVITY BANNER ───────────────────────────────────── */
const ConnectivityBanner = ({ isOnline, syncError, onRetry }: { isOnline: boolean; syncError: string | null; onRetry: () => void }) => {
  if (isOnline && !syncError) return null;
  const offline = !isOnline;
  return (
    <div
      style={{
        margin: "0 32px", marginTop: 16, padding: "12px 16px", borderRadius: 10,
        background: offline ? T.emberDim : T.goldDim,
        border: `1px solid ${offline ? T.emberBord : T.goldBord}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        animation: "slideBanner 0.3s ease both", fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {offline ? <WifiOff size={16} color={T.ember} /> : <CloudOff size={16} color={T.gold} />}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: offline ? T.ember : T.gold }}>
            {offline ? "You're offline" : "Couldn't reach the server"}
          </div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 1 }}>
            {offline
              ? "Showing cached data from this session. Changes made now won't be saved until you're back online."
              : "Showing cached data — this list may not reflect the latest payments."}
          </div>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="pay-ghost-btn"
        style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${offline ? T.emberBord : T.goldBord}`, borderRadius: 8, color: offline ? T.ember : T.gold, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, fontFamily: FONT }}
      >
        <RefreshCw size={12.5} /> Retry
      </button>
    </div>
  );
};

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export const Payments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [transactions, setTransactions] = useState<any[]>([]); // ✅ Start empty, no mock
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // ✅ Start loading
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const isOnline = useOnlineStatus();

  // ✅ Permission hook for guard
  const { permission, loading: permLoading, canEdit } = usePermission(location.pathname);

  /* ─── SUPABASE: Fetch ONLY — NO FALLBACK ───────────────────── */
  const fetchFromSupabase = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSyncError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_id,
          total_due,
          amount_paid,
          status,
          created_at,
          clients ( name )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Supabase payments fetch error:', error);
        throw error;
      }

      // Map real data ONLY — no mock fallback
      if (data && data.length > 0) {
        const mapped = (data || []).map((o: any) => {
          const paymentStatus = o.amount_paid >= o.total_due ? 'Paid' : o.amount_paid > 0 ? 'Partial' : 'Pending';
          const methodMap: Record<string, string> = { 'Cash': 'Cash', 'MoMo': 'Mobile Money', 'Bank': 'Bank Transfer', 'Card': 'Card' };

          return {
            id: `PAY-${o.order_id?.split('-')[2] || '000'}`,
            orderId: o.order_id || o.id,
            client: o.clients?.name || 'Walk-in',
            total: Number(o.total_due) || 0,
            paid: Number(o.amount_paid) || 0,
            balance: Number(o.total_due - o.amount_paid) || 0,
            status: paymentStatus,
            method: methodMap[o.payment_method || 'Cash'] || 'Cash',
            date: new Date(o.created_at).toISOString().split('T')[0],
            ref: o.payment_ref || '-',
          };
        });
        setTransactions(mapped);
      } else {
        // ✅ Supabase returned empty — show true empty state
        setTransactions([]);
      }
      setLastSynced(new Date());
    } catch (err: any) {
      console.error('Payments fetch failed:', err);
      setSyncError('error');
      setTransactions([]); // ✅ Clear any old data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ─── SUPABASE: Fetch on mount ───────────────────────────────────────────── */
  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  /* Re-sync automatically the moment connectivity returns */
  useEffect(() => {
    if (isOnline) fetchFromSupabase();
  }, [isOnline, fetchFromSupabase]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      const matchSearch = t.client.toLowerCase().includes(search.toLowerCase()) || t.orderId.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [transactions, search, statusFilter]);

  const stats = {
    totalCollected: transactions.reduce((a, t) => a + t.paid, 0),
    outstanding: transactions.reduce((a, t) => a + t.balance, 0),
    thisMonth: transactions.filter(t => t.date.startsWith(new Date().toISOString().split("T")[0].slice(0,7))).reduce((a, t) => a + t.paid, 0),
    pending: transactions.filter(t => t.status === "Pending").length,
  };

  /* ─── SUPABASE: Add Payment ────────────────────────────────────────────── */
  const addPayment = async (data: any) => {
    // Update the order in Supabase
    const { error } = await supabase
      .from('orders')
      .update({
        amount_paid: data.amount,
        payment_method: data.method,
        payment_ref: data.ref,
        status: data.amount >= data.total ? 'Delivered' : 'Pending'
      })
      .eq('order_id', data.orderId);

    if (error) console.error('Payment update error:', error);

    // Update local state regardless (fallback if Supabase fails)
    const newTx = {
      id: `PAY-${String(transactions.length + 1).padStart(3, "0")}`,
      ...data,
      client: "New Client",
      total: data.amount,
      paid: data.amount,
      balance: 0,
      status: "Paid",
      date: new Date().toISOString().split("T")[0],
    };
    setTransactions(prev => [newTx, ...prev]);

    // Refresh to reflect changes
    fetchFromSupabase();
  };

  const statusStyle = (status: string) => {
    switch(status) {
      case "Paid": return { bg: T.emeraldDim, color: T.emerald, border: T.emeraldBord };
      case "Partial": return { bg: T.goldDim, color: T.gold, border: T.goldBord };
      case "Pending": return { bg: T.emberDim, color: T.ember, border: T.emberBord };
      default: return { bg: T.bgElevated, color: T.textTert, border: T.borderSoft };
    }
  };

  const statCards = [
    { label: "Total Collected", val: stats.totalCollected, prefix: "GH₵", icon: <ArrowUpRight size={18} color={T.emerald} /> },
    { label: "Outstanding Balance", val: stats.outstanding, prefix: "GH₵", icon: <ArrowDownRight size={18} color={T.ember} /> },
    { label: "This Month", val: stats.thisMonth, prefix: "GH₵", icon: <Clock size={18} color={T.gold} /> },
    { label: "Pending Payments", val: stats.pending, prefix: "", icon: <AlertCircle size={18} color={T.accent} />, isCurrency: false },
  ];

  // ✅ Wait for both data AND permissions to load
  if (isLoading || permLoading) return (
    <div className="pay-root" style={{ background: T.bgBase, minHeight: "100vh", fontFamily: FONT, color: T.textPrimary }}>
      <GlobalStyle />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: T.bgElevated, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CreditCard size={22} color={T.accent} className="pay-orb" style={{ animation: "spin 0.8s linear infinite" }} />
        </div>
        <div style={{ color: T.textTert, fontSize: 13, fontFamily: FONT }}>
          {isOnline ? "Loading payments…" : "Waiting for connection…"}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <GlobalStyle />
      {showModal && <PaymentModal onClose={() => setShowModal(false)} onSave={addPayment} />}
      <div className="pay-root" style={{ background: T.bgBase, minHeight: "100vh", fontFamily: FONT, color: T.textPrimary, position: "relative", overflow: "hidden" }}>

        {/* Ambient background glow — quiet, slow-drifting, purely atmospheric */}
        <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div className="pay-orb" style={{ position: "absolute", top: "-10%", right: "8%", width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle, ${T.accentGlow} 0%, transparent 70%)`, opacity: 0.12, filter: "blur(40px)" }} />
          <div className="pay-orb" style={{ position: "absolute", bottom: "-15%", left: "4%", width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)`, opacity: 0.08, filter: "blur(50px)", animationDelay: "3s" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* HEADER */}
          <div className="pay-header-row" style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderFaint}`, padding: "22px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: T.textPrimary, letterSpacing: "-0.02em", fontFamily: DISPLAY }}>Payments &amp; Balances</div>
              <div style={{ fontSize: 12.5, color: T.textTert, marginTop: 5, fontFamily: FONT, display: "flex", alignItems: "center", gap: 8 }}>
                Track collections, outstanding balances, and payment history
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginLeft: 4 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: isOnline && !syncError ? T.emerald : isOnline ? T.gold : T.ember,
                    animation: isOnline && !syncError ? "ringPulse 2s infinite" : "pulseDot 1.4s infinite",
                    color: isOnline && !syncError ? T.emerald : isOnline ? T.gold : T.ember,
                  }} />
                  <span style={{ fontSize: 11, color: T.textHint, fontFamily: MONO }}>
                    {isOnline && !syncError ? "live" : isOnline ? "sync issue" : "offline"}
                  </span>
                </span>
              </div>
            </div>
            <button 
              onClick={() => canEdit && setShowModal(true)} 
              disabled={!canEdit}
              className="pay-primary-btn" 
              style={{ 
                padding: "11px 22px", 
                background: canEdit ? T.emerald : T.bgElevated, 
                border: canEdit ? "none" : `1px solid ${T.borderSoft}`,
                borderRadius: 10, 
                color: canEdit ? "#03261a" : T.textTert, 
                fontSize: 14, 
                fontWeight: 600, 
                cursor: canEdit ? "pointer" : "not-allowed", 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                fontFamily: FONT,
                opacity: canEdit ? 1 : 0.7
              }}
            >
              <Plus size={16} /> {canEdit ? "Record Payment" : "View Only"}
            </button>
          </div>

          <ConnectivityBanner isOnline={isOnline} syncError={syncError} onRetry={fetchFromSupabase} />

          {/* STATS BAR */}
          <div className="pay-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: T.bgSurface, borderBottom: `1px solid ${T.borderFaint}`, marginTop: 16 }}>
            {statCards.map((st, i) => (
              <div key={st.label} style={{ borderRight: i < 3 ? `1px solid ${T.borderFaint}` : "none" }}>
                <StatCard label={st.label} value={st.val} prefix={st.prefix} icon={st.icon} delay={i * 60} isCurrency={st.isCurrency !== false} />
              </div>
            ))}
          </div>

          {/* CONTROLS */}
          <div className="pay-controls-row" style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderFaint}`, padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", "Paid", "Partial", "Pending"].map(st => (
                <button
                  key={st}
                  className="pay-filter-btn"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: "7px 15px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: FONT,
                    border: `1px solid ${statusFilter === st ? T.accentBord : "transparent"}`,
                    background: statusFilter === st ? T.accentDim : "transparent",
                    color: statusFilter === st ? "#b3b6fa" : T.textTert,
                    boxShadow: statusFilter === st ? `0 0 0 1px ${T.accentBord} inset` : "none",
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="pay-searchbox" style={{ position: "relative", width: 260, border: `1px solid ${T.borderSoft}`, borderRadius: 9, background: T.bgRaised, transition: "border-color .16s ease, box-shadow .16s ease" }}>
              <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.textHint, pointerEvents: "none" }} />
              <input
                placeholder="Search client or order ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "9px 12px 9px 34px", background: "transparent", border: "none", borderRadius: 9, color: T.textPrimary, fontSize: 13.5, outline: "none", fontFamily: FONT }}
              />
            </div>
          </div>

          {/* CONTENT - Wrapped with PermissionGuard */}
          <PermissionGuard>
            <div style={{ padding: "20px 32px 48px" }}>
              {isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="pay-skeleton" style={{ height: 54, borderRadius: 10, border: `1px solid ${T.borderFaint}` }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "70px 0", gap: 14, color: T.textTert, animation: "fadeIn 0.3s ease both" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.bgElevated, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CreditCard size={28} color={T.textHint} />
                  </div>
                  <span style={{ fontSize: 14, fontFamily: FONT }}>
                    {syncError 
                      ? "Connection issue — retry to load payments" 
                      : transactions.length === 0 
                        ? "No payments recorded yet" 
                        : "No transactions match your filters"}
                  </span>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="pay-table-view" style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 50px -30px rgba(0,0,0,0.6)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderSoft}` }}>
                          {["Payment ID", "Order", "Client", "Total", "Paid", "Balance", "Status", "Method", "Date", ""].map(h => (
                            <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FONT }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((t, i) => {
                          const s = statusStyle(t.status);
                          return (
                            <tr key={t.id} className="pay-table-row pay-row" style={{ borderBottom: `1px solid ${T.borderFaint}`, animationDelay: `${Math.min(i, 10) * 35}ms` }}>
                              <td style={{ padding: "16px 20px", fontFamily: MONO, color: T.accent, fontWeight: 500 }}>{t.id}</td>
                              <td style={{ padding: "16px 20px", fontFamily: MONO, color: T.textSec }}>{t.orderId}</td>
                              <td style={{ padding: "16px 20px", fontWeight: 500 }}>{t.client}</td>
                              <td style={{ padding: "16px 20px", fontFamily: MONO }}>₵{t.total}</td>
                              <td style={{ padding: "16px 20px", fontFamily: MONO, color: T.emerald }}>₵{t.paid}</td>
                              <td style={{ padding: "16px 20px", fontFamily: MONO, color: t.balance > 0 ? T.ember : T.textTert }}>₵{t.balance}</td>
                              <td style={{ padding: "16px 20px" }}>
                                <span style={{ padding: "4px 10px", borderRadius: 100, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  {t.status === "Pending" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, animation: "pulseDot 1.3s infinite" }} />}
                                  {t.status}
                                </span>
                              </td>
                              <td style={{ padding: "16px 20px", fontSize: 13, color: T.textSec }}>{t.method}</td>
                              <td style={{ padding: "16px 20px", fontSize: 13, color: T.textSec }}>{t.date}</td>
                              <td style={{ padding: "16px 20px" }}>
                                <button
                                  className="pay-receipt-btn"
                                  style={{ padding: "6px 12px", background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 7, color: T.textSec, fontSize: 12, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 5 }}
                                  onClick={() => navigate(`/receipt?order=${t.orderId}`)}
                                >
                                  View Receipt <ChevronRight size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARD LIST */}
                  <div className="pay-cards-view" style={{ flexDirection: "column", gap: 12 }}>
                    {filtered.map((t, i) => {
                      const s = statusStyle(t.status);
                      return (
                        <div
                          key={t.id}
                          className="pay-card"
                          style={{
                            background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 16,
                            animationDelay: `${Math.min(i, 10) * 35}ms`,
                          }}
                          onClick={() => navigate(`/receipt?order=${t.orderId}`)}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontFamily: MONO, color: T.accent, fontSize: 13, fontWeight: 500 }}>{t.id}</div>
                              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 3 }}>{t.client}</div>
                              <div style={{ fontFamily: MONO, color: T.textTert, fontSize: 12, marginTop: 2 }}>{t.orderId}</div>
                            </div>
                            <span style={{ padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{t.status}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.borderFaint}` }}>
                            <div>
                              <div style={{ fontSize: 10.5, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.06em" }}>Paid / Total</div>
                              <div style={{ fontFamily: MONO, fontSize: 14, marginTop: 3 }}><span style={{ color: T.emerald }}>₵{t.paid}</span> <span style={{ color: T.textHint }}>/ ₵{t.total}</span></div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 10.5, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.06em" }}>Balance</div>
                              <div style={{ fontFamily: MONO, fontSize: 14, marginTop: 3, color: t.balance > 0 ? T.ember : T.textTert }}>₵{t.balance}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: T.textSec }}>
                            <span>{t.method}</span>
                            <span>{t.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </PermissionGuard>
        </div>
      </div>
    </>
  );
};

export default Payments;