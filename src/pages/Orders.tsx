import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  List, LayoutGrid, Search, X, ChevronLeft, ChevronRight,
  Package, Droplets, SprayCan, Car, ArrowRight, Check,
  Phone, MapPin, Download, Plus, RefreshCw, Calendar, Printer
} from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { usePermission } from "../hooks/usePermission";
import { PermissionGuard } from "../components/PermissionGuard";

type OrderStatus =
  | "received" | "queued" | "washing" | "drying"
  | "ironing"  | "packaging" | "ready" | "delivery" | "completed";

type PaymentStatus = "paid" | "pending" | "partial";

interface Order {
  id: string;
  customer: string;
  phone: string;
  address: string;
  service: string;
  items: number;
  amount: number;
  status: OrderStatus;
  worker: string;
  date: string;
  payment: PaymentStatus;
  notes?: string;
  created_at?: string;
  amount_paid?: number;
  order_items?: any[];
}

const STAGES: { key: OrderStatus; label: string; short: string; color: string }[] = [
  { key: "received",  label: "Received",          short: "Rcvd",  color: "#378ADD" },
  { key: "queued",    label: "In Queue",          short: "Queue", color: "#6c72f3" },
  { key: "washing",   label: "Washing",           short: "Wash",  color: "#dba96a" },
  { key: "drying",    label: "Drying",            short: "Dry",   color: "#f97316" },
  { key: "ironing",   label: "Ironing",           short: "Iron",  color: "#ec4899" },
  { key: "packaging", label: "Packaging",         short: "Pack",  color: "#a78bfa" },
  { key: "ready",     label: "Ready",             short: "Ready", color: "#34d399" },
  { key: "delivery",  label: "Out for Delivery",  short: "OFD",   color: "#22d3ee" },
  { key: "completed", label: "Completed",         short: "Done",  color: "#10b981" },
];

const SERVICE_META: Record<string, { icon: JSX.Element; color: string; bg: string }> = {
  "Laundry":       { icon: <Package size={12} />, color: "#6c72f3", bg: "rgba(108,114,243,0.12)" },
  "Cleaning":      { icon: <Droplets size={12} />, color: "#22d3ee", bg: "rgba(34,211,238,0.12)"  },
  "Fumigation":    { icon: <SprayCan size={12} />, color: "#dba96a", bg: "rgba(219,169,106,0.12)" },
  "Car Detailing": { icon: <Car size={12} />, color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
};

const PAY_META: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid:    { label: "Paid",    color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  pending: { label: "Pending", color: "#dba96a", bg: "rgba(219,169,106,0.12)" },
  partial: { label: "Partial", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const SERVICES = ["Laundry", "Cleaning", "Fumigation", "Car Detailing"];

const formatDateOnly = (isoString: string | undefined) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB');
  } catch {
    return '';
  }
};

const toQueryDate = (dateStr: string, time: 'start' | 'end') => {
  if (!dateStr) return undefined;
  return time === 'start' 
    ? `${dateStr}T00:00:00.000Z` 
    : `${dateStr}T23:59:59.999Z`;
};

const escapeCsv = (val: any) => `"${String(val).replace(/"/g, '""')}"`;

function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 37 + (name.charCodeAt(1) || 0) * 11) % 360;
  return (
    <div className="av" style={{
      width: size, height: size, minWidth: size,
      background: `hsl(${hue},35%,20%)`,
      color: `hsl(${hue},55%,68%)`,
      fontSize: size < 36 ? 11 : 13,
    }}>{initials}</div>
  );
}

function SvcBadge({ s }: { s: string }) {
  const m = SERVICE_META[s] ?? { icon: <Package size={12} />, color: "#9aa3b5", bg: "rgba(154,163,181,0.12)" };
  return <span className="svc-badge" style={{ color: m.color, background: m.bg }}>{m.icon}{s}</span>;
}

function PayBadge({ p }: { p: PaymentStatus }) {
  const m = PAY_META[p];
  return <span className="pay-badge" style={{ color: m.color, background: m.bg }}>{m.label}</span>;
}

function StPip({ s }: { s: OrderStatus }) {
  const stage = STAGES.find(x => x.key === s);
  return (
    <span className="st-pip">
      <span className="st-dot" style={{ background: stage?.color }} />
      {stage?.label}
    </span>
  );
}

// ✅ Added canEdit prop to disable timeline interactions for view-only users
function Timeline({ order, onUpdate, canEdit }: { order: Order; onUpdate: (s: OrderStatus) => void; canEdit: boolean }) {
  const ci = STAGES.findIndex(s => s.key === order.status);
  return (
    <div className="tl-wrap">
      {STAGES.map((stage, i) => {
        const done   = i < ci;
        const active = i === ci;
        return (
          <div key={stage.key} className="tl-node">
            {i > 0 && <div className="tl-line" style={{ background: i <= ci ? stage.color : "rgba(255,255,255,0.07)" }} />}
            <button
              className={`tl-dot ${done ? "done" : ""} ${active ? "active" : ""}`}
              style={{
                borderColor: active ? stage.color : done ? "#34d399" : "rgba(255,255,255,0.1)",
                background:  active ? stage.color + "22" : done ? "rgba(52,211,153,0.15)" : "transparent",
                boxShadow:   active ? `0 0 0 4px ${stage.color}20` : "none",
                opacity: canEdit ? 1 : 0.5,
                cursor: canEdit ? "pointer" : "not-allowed",
              }}
              onClick={() => canEdit && onUpdate(stage.key)}
              title={canEdit ? `Set to ${stage.label}` : "View only"}
              disabled={!canEdit}
            >
              {done   && <Check size={9} strokeWidth={3} color="#34d399" />}
              {active && <span className="tl-pulse" style={{ background: stage.color }} />}
            </button>
            <span className="tl-lbl" style={{
              color: active ? stage.color : done ? "#34d399" : "#3a4460",
              fontWeight: active ? 600 : 400,
            }}>{stage.short}</span>
          </div>
        );
      })}
    </div>
  );
}

function PCard({ order, onClick }: { order: Order; onClick: () => void }) {
  return (
    <div className="pc" onClick={onClick}>
      <div className="pc-top">
        <span className="pc-id">{order.id}</span>
        <PayBadge p={order.payment} />
      </div>
      <div className="pc-cust">
        <Avatar name={order.customer} size={28} />
        <div>
          <div className="pc-nm">{order.customer}</div>
          <div className="pc-sub">{order.items} items · ₵{order.amount.toLocaleString()}</div>
        </div>
      </div>
      <SvcBadge s={order.service} />
      <div className="pc-foot">
        <span className="pc-time">{order.date}</span>
        <span className="pc-wk">{order.worker}</span>
      </div>
    </div>
  );
}

export const Orders = () => {
  const location = useLocation();
  const [view, setView]     = useState<"list" | "pipeline">("list");
  const [sf, setSf]         = useState("all");
  const [svf, setSvf]       = useState("all");
  const [pf, setPf]         = useState("all");
  const [q, setQ]           = useState("");
  const [pg, setPg]         = useState(1);
  const [pp, setPp]         = useState(10);
  const [sel, setSel]       = useState<string[]>([]);
  const [open, setOpen]     = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [printMode, setPrintMode] = useState(false);
  const [bulkOrders, setBulkOrders] = useState<Order[]>([]);

  // ✅ Toast state for replacing native alerts
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { permission, loading: permLoading, canEdit } = usePermission(location.pathname);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchFromSupabase = useCallback(async (customStart?: string, customEnd?: string) => {
    setLoading(true);
    setIsOffline(false);
    try {
      let query = supabase.from('orders').select(`
        id,
        order_id,
        total_due,
        amount_paid,
        status,
        created_at,
        clients ( name, phone ),
        order_items ( quantity )
      `);

      const start = customStart || startDate;
      const end = customEnd || endDate;
      
      if (start) {
        query = query.gte('created_at', toQueryDate(start, 'start'));
      }
      if (end) {
        query = query.lte('created_at', toQueryDate(end, 'end'));
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(0, 1999);
      
      if (error) {
        console.error('Supabase orders fetch error:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const mapped = data.map((o: any): Order => ({
          id: o.order_id || o.id,
          customer: o.clients?.name || 'Walk-in',
          phone: o.clients?.phone || '+233 53 413 4809',
          address: 'Kumasi, Ghana',
          service: o.notes || 'Laundry',
          items: o.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1,
          amount: Number(o.total_due) || 0,
          amount_paid: Number(o.amount_paid) || 0,
          status: (o.status?.toLowerCase() as OrderStatus) || 'received',
          worker: 'Staff',
          date: formatDateOnly(o.created_at),
          created_at: o.created_at,
          payment: (o.amount_paid >= o.total_due ? 'paid' : o.amount_paid > 0 ? 'partial' : 'pending') as PaymentStatus,
          notes: o.notes,
          order_items: o.order_items
        }));
        setOrders(mapped);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error('Orders fetch failed:', err);
      setIsOffline(true);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  const filtered = useMemo(() => orders.filter(o => {
    if (sf  !== "all" && o.status  !== sf)  return false;
    if (svf !== "all" && o.service !== svf) return false;
    if (pf  !== "all" && o.payment !== pf)  return false;
    if (q) { const lq = q.toLowerCase(); if (!o.customer.toLowerCase().includes(lq) && !o.id.toLowerCase().includes(lq)) return false; }
    return true;
  }), [orders, sf, svf, pf, q]);

  const totalPgs  = Math.max(1, Math.ceil(filtered.length / pp));
  const paged     = filtered.slice((pg - 1) * pp, pg * pp);
  const stageGrps = useMemo(() => STAGES.map(s => ({ ...s, rows: filtered.filter(o => o.status === s.key) })), [filtered]);
  const hasFilters = sf !== "all" || svf !== "all" || pf !== "all" || q || startDate || endDate;

  const toggleRow = useCallback((id: string) => setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), []);
  const toggleAll = () => setSel(sel.length === paged.length && paged.length > 0 ? [] : paged.map(o => o.id));

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('order_id', id);
    if (error) console.error('Status update error:', error);
    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
    setOpen(p => p?.id === id ? { ...p, status } : p);
  };

  const advance = (order: Order) => {
    const i = STAGES.findIndex(s => s.key === order.status);
    if (i < STAGES.length - 1) updateStatus(order.id, STAGES[i + 1].key);
  };

  const handleDeleteSingle = async (orderId: string) => {
    if (!window.confirm('Delete this order?')) return;
    
    const { error } = await supabase.from('orders').delete().eq('order_id', orderId);
    
    if (error) {
      console.error('Delete error:', error);
      setToast({ msg: 'Failed to delete order', type: 'error' });
      return;
    }
    
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (open?.id === orderId) setOpen(null);
    setToast({ msg: 'Order deleted successfully', type: 'success' });
  };

  const clearFilters = () => { 
    setSf("all"); setSvf("all"); setPf("all"); setQ(""); 
    setStartDate(''); setEndDate('');
  };

  const fetchBulkOrders = async () => {
    if (!startDate || !endDate) {
      setToast({ msg: 'Please select a date range', type: 'error' });
      return;
    }
    setLoading(true);
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
          clients ( name, phone ),
          order_items ( quantity, unit_price, services ( name ) )
        `)
        .gte('created_at', toQueryDate(startDate, 'start'))
        .lte('created_at', toQueryDate(endDate, 'end'))
        .order('created_at', { ascending: true })
        .range(0, 1999);

      if (error) throw error;

      if (data) {
        const mapped = data.map((o: any): Order => ({
          id: o.order_id || o.id,
          customer: o.clients?.name || 'Walk-in',
          phone: o.clients?.phone || '+233 53 413 4809',
          address: 'Kumasi, Ghana',
          service: o.notes || 'Laundry',
          items: o.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1,
          amount: Number(o.total_due) || 0,
          amount_paid: Number(o.amount_paid) || 0,
          status: (o.status?.toLowerCase() as OrderStatus) || 'received',
          worker: 'Staff',
          date: formatDateOnly(o.created_at),
          created_at: o.created_at,
          payment: (o.amount_paid >= o.total_due ? 'paid' : o.amount_paid > 0 ? 'partial' : 'pending') as PaymentStatus,
          notes: o.notes,
          order_items: o.order_items
        }));
        setBulkOrders(mapped);
        setPrintMode(true);
        setToast({ msg: 'Orders loaded for printing', type: 'success' });
      }
    } catch (err) {
      console.error('Bulk fetch error:', err);
      setToast({ msg: 'Failed to load orders for printing', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || permLoading) return (
    <div className="os" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ color: "var(--os-text-tert, #556070)", fontSize: 13, fontFamily: "var(--os-font, system-ui)" }}>
        Loading orders...
      </div>
    </div>
  );

  if (printMode) {
    const monthGroups: Record<string, Order[]> = {};
    bulkOrders.forEach(o => {
      const d = o.created_at ? new Date(o.created_at) : null;
      const key = d ? d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Unknown';
      if (!monthGroups[key]) monthGroups[key] = [];
      monthGroups[key].push(o);
    });
    const monthKeys = Object.keys(monthGroups);

    return (
      <div id="print-area" style={{ background: '#fff', color: '#000', padding: '40px', fontFamily: 'system-ui', minHeight: 'auto', height: 'auto', maxHeight: 'none', overflow: 'visible' }}>
        <div style={{ textAlign: 'center', borderBottom: '3px solid #000', paddingBottom: 20, marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>CHAPMAN PRESTIGE LIMITED</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>Kumasi, Ghana • +233 53 413 4809</p>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600 }}>
            Bulk Receipt: {startDate} to {endDate}
          </p>
        </div>

        {monthKeys.map(monthKey => {
          const rows = monthGroups[monthKey];
          const monthAmount = rows.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
          const monthPaid = rows.reduce((sum, o) => sum + (Number(o.amount_paid) || 0), 0);
          const monthBalance = monthAmount - monthPaid;

          return (
            <div key={monthKey} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', borderBottom: '1px solid #999', paddingBottom: 4 }}>
                {monthKey}
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #000' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Order ID</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Items</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Amount</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Paid</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((order: any) => {
                    const amount = Number(order.amount) || 0;
                    const paid = Number(order.amount_paid) || 0;
                    const balance = amount - paid;

                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: 8, fontFamily: 'monospace' }}>{order.id}</td>
                        <td style={{ padding: 8 }}>{order.customer}</td>
                        <td style={{ padding: 8 }}>{order.date}</td>
                        <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace' }}>{order.items}</td>
                        <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace' }}>₵{amount.toFixed(2)}</td>
                        <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace' }}>₵{paid.toFixed(2)}</td>
                        <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                          ₵{balance.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #000' }}>
                    <td colSpan={4} style={{ padding: 8, textAlign: 'right', fontWeight: 700 }}>Month Total ({rows.length} orders)</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>₵{monthAmount.toFixed(2)}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>₵{monthPaid.toFixed(2)}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>₵{monthBalance.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}

        <div style={{ textAlign: 'right', marginTop: 20 }}>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            <strong>Total Orders:</strong> {bulkOrders.length}
          </p>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            <strong>Grand Total:</strong> ₵{bulkOrders.reduce((sum, o) => sum + o.amount, 0).toFixed(2)}
          </p>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            <strong>Total Paid:</strong> ₵{bulkOrders.reduce((sum, o) => sum + (o.amount_paid || 0), 0).toFixed(2)}
          </p>
          <p style={{ margin: '4px 0', fontSize: 14, fontWeight: 700 }}>
            <strong>Outstanding Balance:</strong> ₵{bulkOrders.reduce((sum, o) => sum + (o.amount - (o.amount_paid || 0)), 0).toFixed(2)}
          </p>
        </div>

        <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#666' }}>
          <p>Thank you for choosing Chapman Prestige Limited</p>
          <p>This is a system-generated document. No signature required.</p>
        </div>

        <div className="no-print" style={{ position: 'fixed', top: 20, right: 20, display: 'flex', gap: 10 }}>
          <button onClick={handlePrint} style={{ padding: '10px 20px', background: '#34d399', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} /> Print Receipts
          </button>
          <button onClick={() => { setPrintMode(false); setBulkOrders([]); }} style={{ padding: '10px 20px', background: '#6c72f3', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Back to Orders
          </button>
        </div>

        <style>{`
          @media print {
            html, body, #root { height: auto !important; overflow: visible !important; }
            * { overflow: visible !important; }
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: white; color: black; overflow: visible !important; height: auto !important; }
            #print-area table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
            #print-area thead { display: table-header-group; }
            #print-area tr { page-break-inside: avoid; page-break-after: auto; }
            #print-area tbody { display: table-row-group; }
            .no-print { display: none !important; }
            @page { size: auto; margin: 10mm; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          @media screen {
            .no-print { display: flex; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="os">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        .os {
          display: flex; flex-direction: column; height: 100%; width: 100% !important; max-width: 100% !important;
          background: #07090e; color: #edf0f8; font-family: 'Outfit', system-ui, sans-serif;
          overflow: hidden !important; overflow-x: hidden !important; box-sizing: border-box; position: relative;
        }
        .os-top, .os-filters, .os-body, .lv, .tbl-wrap { width: 100% !important; max-width: 100% !important; min-width: 0 !important; box-sizing: border-box; }
        .os-body { flex: 1; overflow: hidden !important; display: flex; flex-direction: column; min-height: 0; }
        .lv { flex: 1; display: flex; flex-direction: column; overflow: hidden !important; min-height: 0; }
        .tbl-wrap { flex: 1; overflow-x: auto !important; overflow-y: auto !important; min-height: 0; }

        .os-title { font-size: 22px; font-weight: 700; color: #edf0f8; letter-spacing: -0.4px; margin-bottom: 4px; }
        .os-sub { font-size: 13px; color: #556070; display: flex; align-items: center; gap: 6px; }
        .dot-sep { color: #2e3a4e; }
        .os-actions { display: flex; align-items: center; gap: 8px; }
        .os-btn {
          display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 9px;
          font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: 'Outfit', sans-serif; transition: all 0.18s;
        }
        .os-btn.ghost { background: rgba(255,255,255,0.04); color: #9aa3b5; border: 1px solid rgba(255,255,255,0.07); padding: 8px 10px; }
        .os-btn.ghost:hover { background: rgba(255,255,255,0.08); color: #edf0f8; }
        .os-btn.primary { background: #6c72f3; color: #fff; box-shadow: 0 0 18px rgba(108,114,243,0.28); }
        .os-btn.primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .spin { animation: spinA 0.7s linear infinite; }

        .os-filters {
          display: flex; align-items: center; gap: 10px; padding: 16px 28px;
          border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; flex-wrap: wrap;
          animation: fadeDown 0.4s 0.05s cubic-bezier(.4,0,.2,1) both;
        }
        .srch-wrap { position: relative; display: flex; align-items: center; flex: 1; min-width: 180px; max-width: 280px; }
        .srch-ico { position: absolute; left: 11px; color: #3a4460; pointer-events: none; }
        .srch-inp {
          width: 100%; padding: 8px 36px 8px 34px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 9px; color: #edf0f8; font-size: 13px;
          font-family: 'Outfit', sans-serif; outline: none; transition: border-color 0.18s, background 0.18s;
        }
        .srch-inp::placeholder { color: #3a4460; }
        .srch-inp:focus { border-color: rgba(108,114,243,0.45); background: rgba(108,114,243,0.05); }
        .srch-x { position: absolute; right: 30px; background: none; border: none; cursor: pointer; color: #3a4460; display: flex; align-items: center; transition: color 0.15s; }
        .srch-x:hover { color: #9aa3b5; }
        .srch-kbd {
          position: absolute; right: 10px; font-size: 10px; color: #2e3a4e;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px; padding: 1px 5px; font-family: 'DM Mono', monospace; pointer-events: none;
        }
        .fp {
          padding: 8px 11px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 9px; color: #9aa3b5; font-size: 13px; font-family: 'Outfit', sans-serif;
          outline: none; cursor: pointer; transition: all 0.18s; appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23556070'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px;
        }
        .fp:focus, .fp:hover { border-color: rgba(108,114,243,0.35); color: #edf0f8; }
        .fp option { background: #0c0f18; color: #edf0f8; }
        .fp-clr {
          display: inline-flex; align-items: center; gap: 5px; padding: 7px 11px;
          background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2);
          border-radius: 9px; color: #f87171; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.18s;
        }
        .fp-clr:hover { background: rgba(248,113,113,0.18); }
        .vt { margin-left: auto; display: flex; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 9px; padding: 3px; gap: 2px; }
        .vt-b {
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          border-radius: 7px; border: none; background: transparent; color: #3a4460; cursor: pointer; transition: all 0.18s;
        }
        .vt-b:hover { color: #9aa3b5; }
        .vt-b.on { background: rgba(108,114,243,0.18); color: #6c72f3; }

        .bulk {
          display: flex; align-items: center; gap: 10px; padding: 10px 28px;
          background: rgba(108,114,243,0.08); border-bottom: 1px solid rgba(108,114,243,0.2);
          font-size: 13px; font-weight: 500; color: #9aa3b5; animation: slideIn 0.2s ease; flex-shrink: 0; flex-wrap: wrap;
        }
        .blk-b {
          padding: 5px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px; color: #edf0f8; font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'Outfit', sans-serif; transition: all 0.18s;
        }
        .blk-b:hover { background: rgba(255,255,255,0.1); }
        .blk-b.red { color: #f87171; border-color: rgba(248,113,113,0.25); background: rgba(248,113,113,0.08); }
        .blk-b.red:hover { background: rgba(248,113,113,0.15); }
        .blk-x {
          margin-left: auto; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; color: #556070; border-radius: 6px; transition: all 0.15s;
        }
        .blk-x:hover { background: rgba(255,255,255,0.06); color: #9aa3b5; }

        .tbl { width: 100%; min-width: 1060px; border-collapse: collapse; }
        .tbl th, .tbl td { white-space: nowrap; }
        .tbl thead tr { position: sticky; top: 0; z-index: 10; }
        .tbl th {
          padding: 12px 16px; background: #0c0f18; text-align: left; font-size: 11px; font-weight: 700;
          color: #3a4460; text-transform: uppercase; letter-spacing: 0.7px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .th-chk { width: 44px; padding-left: 20px; }
        .tbl td {
          padding: 13px 16px; font-size: 13.5px; color: #c8d0e0;
          border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle;
        }
        .tr { cursor: pointer; animation: rowIn 0.3s cubic-bezier(.4,0,.2,1) both; transition: background 0.15s; }
        .tr:hover td { background: rgba(255,255,255,0.025); }
        .tr:hover .ra { opacity: 1; }
        .tr.sel td { background: rgba(108,114,243,0.07); }
        .td-chk { padding-left: 20px; width: 44px; }
        .td-id { font-family: 'DM Mono', monospace; font-size: 12.5px; font-weight: 500; color: #6c72f3; }
        .td-cust { display: flex; align-items: center; gap: 10px; }
        .cust-n { font-weight: 600; color: #edf0f8; font-size: 13px; }
        .cust-p { font-size: 11.5px; color: #3a4460; margin-top: 2px; }
        .td-n { font-family: 'DM Mono', monospace; font-size: 13px; color: #9aa3b5; }
        .td-amt { font-family: 'DM Mono', monospace; font-size: 13.5px; font-weight: 600; color: #edf0f8; }
        .td-dim { color: #556070; font-size: 12.5px; }
        .td-act { white-space: nowrap; }
        .ra {
          display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 5px 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 7px;
          font-size: 12px; font-weight: 600; color: #9aa3b5; cursor: pointer; font-family: 'Outfit', sans-serif;
          opacity: 0; transition: all 0.18s; margin-right: 5px;
        }
        .ra:hover { background: rgba(255,255,255,0.09); color: #edf0f8; }
        .ra.icon { padding: 5px 7px; }
        .ra.icon:hover { background: rgba(108,114,243,0.15); color: #6c72f3; border-color: rgba(108,114,243,0.3); }
        .ra:disabled { opacity: 0.25 !important; cursor: not-allowed; }
        .empty-cell { padding: 60px !important; text-align: center; color: #3a4460; font-size: 14px; }

        .pag {
          display: flex; align-items: center; justify-content: space-between; padding: 12px 20px;
          border-top: 1px solid rgba(255,255,255,0.05); background: #0c0f18; flex-shrink: 0;
        }
        .pag-info { font-size: 12.5px; color: #3a4460; }
        .pag-right { display: flex; align-items: center; gap: 6px; }
        .pag-pp {
          padding: 6px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px; color: #9aa3b5; font-size: 12px; font-family: 'Outfit', sans-serif; outline: none; cursor: pointer;
        }
        .pag-b {
          width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 7px;
          color: #9aa3b5; cursor: pointer; transition: all 0.18s;
        }
        .pag-b:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: #edf0f8; }
        .pag-b:disabled { opacity: 0.3; cursor: not-allowed; }
        .pag-n {
          min-width: 30px; height: 30px; padding: 0 6px; display: flex; align-items: center; justify-content: center;
          background: transparent; border: 1px solid transparent; border-radius: 7px;
          color: #556070; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.18s; font-family: 'Outfit', sans-serif;
        }
        .pag-n:hover { color: #edf0f8; border-color: rgba(255,255,255,0.08); }
        .pag-n.on { background: rgba(108,114,243,0.18); color: #6c72f3; border-color: rgba(108,114,243,0.3); }

        .pv {
          flex: 1; display: flex; gap: 14px; overflow-x: auto; padding: 20px 28px;
          align-items: flex-start; min-height: 0; width: 100%; max-width: 100%; box-sizing: border-box;
        }
        .pv::-webkit-scrollbar { height: 5px; }
        .pv::-webkit-scrollbar-track { background: transparent; }
        .pv::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        .pl {
          min-width: 240px; max-width: 240px; background: #0c0f18; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; display: flex; flex-direction: column; max-height: calc(100vh - 220px);
          flex-shrink: 0; transition: border-color 0.2s;
        }
        .pl:hover { border-color: rgba(255,255,255,0.1); }
        .pl-h { display: flex; align-items: center; justify-content: space-between; padding: 13px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
        .pl-ht { display: flex; align-items: center; gap: 8px; }
        .pl-d { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .pl-t { font-size: 13px; font-weight: 600; color: #c8d0e0; }
        .pl-c { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
        .pl-b {
          flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 9px;
        }
        .pl-b::-webkit-scrollbar { width: 3px; }
        .pl-b::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
        .pl-e { font-size: 12px; color: #2e3a4e; text-align: center; padding: 20px; }

        .pc {
          background: #111520; border: 1px solid rgba(255,255,255,0.06); border-radius: 11px;
          padding: 12px 13px; cursor: pointer; display: flex; flex-direction: column; gap: 9px; transition: all 0.2s;
        }
        .pc:hover { border-color: rgba(255,255,255,0.12); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
        .pc-top { display: flex; align-items: center; justify-content: space-between; }
        .pc-id { font-family: 'DM Mono', monospace; font-size: 11.5px; font-weight: 500; color: #6c72f3; }
        .pc-cust { display: flex; align-items: center; gap: 8px; }
        .pc-nm { font-size: 12.5px; font-weight: 600; color: #edf0f8; }
        .pc-sub { font-size: 11px; color: #556070; margin-top: 1px; }
        .pc-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
        .pc-time { font-size: 11px; color: #3a4460; }
        .pc-wk { font-size: 11px; color: #3a4460; }

        .av { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
        .svc-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .pay-badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 600; white-space: nowrap; }
        .st-pip { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 500; white-space: nowrap; }
        .st-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .chk { width: 15px; height: 15px; border-radius: 4px; cursor: pointer; accent-color: #6c72f3; }

        .ov {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
          z-index: 40; opacity: 0; pointer-events: none; transition: opacity 0.3s;
        }
        .ov.on { opacity: 1; pointer-events: auto; }
        .op {
          position: fixed; top: 0; right: 0; width: 460px; max-width: 100%; height: 100dvh;
          background: #0c0f18; border-left: 1px solid rgba(255,255,255,0.07); z-index: 50;
          transform: translateX(100%); transition: transform 0.32s cubic-bezier(.4,0,.2,1);
          display: flex; flex-direction: column;
        }
        .op.on { transform: translateX(0); }
        .op-h { display: flex; align-items: flex-start; justify-content: space-between; padding: 22px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
        .op-oid { font-family: 'DM Mono', monospace; font-size: 20px; font-weight: 600; color: #6c72f3; margin-bottom: 4px; }
        .op-odt { font-size: 12px; color: #3a4460; }
        .op-hr { display: flex; align-items: center; gap: 10px; }
        .op-cl {
          width: 30px; height: 30px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: #556070; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.18s;
        }
        .op-cl:hover { background: rgba(255,255,255,0.06); color: #edf0f8; }
        .op-b { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 22px; min-height: 0; }
        .op-b::-webkit-scrollbar { width: 4px; }
        .op-b::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
        .ops { display: flex; flex-direction: column; gap: 10px; }
        .ops-lbl { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #2e3a4e; }
        .ops-cust { display: flex; align-items: flex-start; gap: 13px; }
        .ops-nm { font-size: 15px; font-weight: 600; color: #edf0f8; margin-bottom: 5px; }
        .ops-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #556070; margin-bottom: 3px; }
        .ops-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .og-i { display: flex; flex-direction: column; gap: 5px; }
        .og-i.full { grid-column: span 2; }
        .og-k { font-size: 11px; color: #3a4460; font-weight: 500; }
        .og-v { font-size: 13.5px; color: #c8d0e0; font-weight: 500; }
        .og-v.hi { color: #edf0f8; font-weight: 700; font-family: 'DM Mono', monospace; }
        .og-v.note { font-size: 12.5px; color: #9aa3b5; line-height: 1.5; font-style: italic; }

        .tl-wrap { display: flex; align-items: flex-start; gap: 0; padding: 8px 0 4px; overflow-x: auto; }
        .tl-wrap::-webkit-scrollbar { height: 3px; }
        .tl-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
        .tl-node { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 48px; }
        .tl-line { position: absolute; top: 50%; left: 0; width: 50%; height: 2px; transform: translateY(-50%); border-radius: 1px; transition: background 0.3s; }
        .tl-dot {
          width: 22px; height: 22px; border-radius: 50%; border: 2px solid; display: flex; align-items: center;
          justify-content: center; cursor: pointer; position: relative; z-index: 1; transition: all 0.25s; flex-shrink: 0; margin: 4px auto;
        }
        .tl-dot:hover { filter: brightness(1.2); transform: scale(1.1); }
        .tl-pulse { width: 8px; height: 8px; border-radius: 50%; animation: pulseDot 1.8s ease-in-out infinite; }
        .tl-lbl { font-size: 9.5px; font-weight: 600; text-align: center; white-space: nowrap; margin-top: 5px; letter-spacing: 0.3px; transition: color 0.25s; }

        .op-f { display: flex; gap: 10px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
        .opf-s {
          flex: 1; padding: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9px; color: #9aa3b5; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.18s;
        }
        .opf-s:hover { background: rgba(255,255,255,0.08); color: #edf0f8; }
        .opf-p {
          flex: 2; padding: 10px 16px; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: #6c72f3; border: none; border-radius: 9px; color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Outfit', sans-serif; box-shadow: 0 0 16px rgba(108,114,243,0.3); transition: all 0.18s;
        }
        .opf-p:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .opf-p:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

        @keyframes fadeDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rowIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spinA { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }

        @media (max-width: 900px) {
          .os-top { padding: 20px 20px 0; }
          .os-filters { padding: 16px 20px; }
          .os-title { font-size: 18px; }
          .bulk { padding: 10px 20px; } 
          .op { width: 100%; }
        }
        @media (max-width: 640px) {
          .os-filters { gap: 8px; }
          .srch-wrap { max-width: 100%; min-width: 0; flex: 1 1 100%; }
          .vt { margin-left: 0; }
          .os-actions { gap: 6px; }
          .ops-grid { grid-template-columns: 1fr; }
          .og-i.full { grid-column: span 1; }
          
          .tbl thead { display: none; }
          .tr { display: block; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; }
          .tr td { display: block; padding: 8px 12px 8px 40%; border: none; text-align: right; position: relative; }
          .tr td::before {
            content: attr(data-label);
            position: absolute; left: 12px; top: 8px; font-size: 10px; color: #556070;
            text-transform: uppercase; font-weight: 700; text-align: left;
          }
          .td-chk { padding-left: 12px; }
          .td-chk::before { display: none; }
          .td-act { text-align: right; }
        }
      `}</style>

      {/* ✅ Toast Notification */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 10000, background: toast.type === 'error' ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)", border: `1px solid ${toast.type === 'error' ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)"}`, borderRadius: 10, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 14px 36px rgba(0,0,0,0.45)", animation: "fadeDown 0.3s ease both" }}>
          <span style={{ fontSize: 14, color: toast.type === 'error' ? "#f87171" : "#34d399", fontWeight: 500, fontFamily: "var(--os-font, system-ui)" }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ padding: 4, background: "transparent", border: "none", color: "#556070", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      <div className="os-top">
        <div>
          <h2 className="os-title">Orders</h2>
          <p className="os-sub">
            <span>{orders.length} total</span>
            <span className="dot-sep">·</span>
            <span>{orders.filter(o => o.status !== "completed").length} active</span>
            <span className="dot-sep">·</span>
            <span style={{ color: "#f87171" }}>{orders.filter(o => o.payment === "pending").length} unpaid</span>
          </p>
        </div>
        <div className="os-actions">
          <button className="os-btn ghost" title="Refresh"
            onClick={async () => { 
              setLoading(true); 
              await fetchFromSupabase(); 
              setTimeout(() => setLoading(false), 700); 
            }}>
            <RefreshCw size={15} className={loading ? "spin" : ""} />
          </button>
          <button className="os-btn ghost" title="Export" onClick={() => {
            const headers = ["Order ID", "Customer", "Phone", "Service", "Items", "Amount", "Stage", "Payment", "Date"];
            const rows = filtered.map(o => [o.id, o.customer, o.phone, o.service, o.items, o.amount, o.status, o.payment, o.date]);
            const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chapman-orders-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            setToast({ msg: 'CSV exported successfully', type: 'success' });
          }}><Download size={15} /></button>
          <button 
            className="os-btn primary" 
            onClick={() => canEdit && (window.location.href = '/new-order')}
            disabled={!canEdit}
            style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? "pointer" : "not-allowed" }}
          >
            <Plus size={15} /> {canEdit ? "New Order" : "View Only"}
          </button>
        </div>
      </div>

      <div className="os-filters">
        <div className="srch-wrap">
          <Search size={13} className="srch-ico" />
          <input ref={searchRef} className="srch-inp"
            placeholder="Search name or ID..." value={q}
            onChange={e => { setQ(e.target.value); setPg(1); }} />
          {q && <button className="srch-x" onClick={() => setQ("")}><X size={11} /></button>}
          <kbd className="srch-kbd">/</kbd>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Calendar size={13} style={{ color: 'var(--os-text-tert, #556070)' }} />
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => { setStartDate(e.target.value); setPg(1); }}
            style={{ padding: '6px 10px', background: 'var(--os-bg-raised, #111520)', border: '1px solid var(--os-border-soft, rgba(255,255,255,0.09))', borderRadius: 6, color: 'var(--os-text-primary, #edf0f8)', fontSize: 12, outline: 'none' }}
            title="Start date"
          />
          <span style={{ color: 'var(--os-text-tert, #556070)', fontSize: 12 }}>to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => { setEndDate(e.target.value); setPg(1); }}
            style={{ padding: '6px 10px', background: 'var(--os-bg-raised, #111520)', border: '1px solid var(--os-border-soft, rgba(255,255,255,0.09))', borderRadius: 6, color: 'var(--os-text-primary, #edf0f8)', fontSize: 12, outline: 'none' }}
            title="End date"
          />
        </div>

        <select className="fp" value={sf} onChange={e => { setSf(e.target.value); setPg(1); }}>
          <option value="all">All Statuses</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="fp" value={svf} onChange={e => { setSvf(e.target.value); setPg(1); }}>
          <option value="all">All Services</option>
          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="fp" value={pf} onChange={e => { setPf(e.target.value); setPg(1); }}>
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
        </select>

        {hasFilters && (
          <button className="fp-clr" onClick={clearFilters}><X size={11} /> Clear</button>
        )}

        {(startDate && endDate) && (
          <button 
            className="os-btn ghost" 
            title="Print orders in date range"
            onClick={async () => {
              setBulkOrders([]);
              setPrintMode(false);
              await fetchBulkOrders();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Printer size={13} /> Print Range
          </button>
        )}
        <button 
          className="os-btn ghost" 
          onClick={async () => {
            setLoading(true);
            await fetchFromSupabase();
            setBulkOrders([]);
            setToast({ msg: 'Data refreshed', type: 'success' });
            setLoading(false);
          }}
        >
          <RefreshCw size={15} /> Refresh Data
        </button>

        <div className="vt">
          <button className={`vt-b ${view === "list" ? "on" : ""}`} onClick={() => setView("list")} title="List view"><List size={14} /></button>
          <button className={`vt-b ${view === "pipeline" ? "on" : ""}`} onClick={() => setView("pipeline")} title="Pipeline view"><LayoutGrid size={14} /></button>
        </div>
      </div>

      <PermissionGuard>
        <div className="os-body">
          {view === "list" && (
            <div className="lv">
              {/* ✅ Wrapped modification actions in canEdit check */}
              {sel.length > 0 && (
                <div className="bulk">
                  <span>{sel.length} selected</span>
                  {canEdit && (
                    <>
                      <button className="blk-b" onClick={() => sel.forEach(id => {
                        const order = orders.find(o => o.id === id);
                        if (order) advance(order);
                      })}>Advance Stage</button>
                      <button className="blk-b red" onClick={async () => {
                        if (!window.confirm(`Delete ${sel.length} order(s)?`)) return;
                        const { error } = await supabase.from('orders').delete().in('order_id', sel);
                        if (error) {
                          console.error('Delete error:', error);
                          setToast({ msg: 'Failed to delete orders', type: 'error' });
                          return;
                        }
                        setSel([]);
                        fetchFromSupabase();
                        setToast({ msg: 'Orders deleted successfully', type: 'success' });
                      }}><X size={11} style={{marginRight:4}}/> Delete</button>
                    </>
                  )}
                  <button className="blk-b" onClick={() => {
                    const headers = ["Order ID", "Customer", "Phone", "Service", "Items", "Amount", "Stage", "Payment", "Date"];
                    const rows = filtered.map(o => [o.id, o.customer, o.phone, o.service, o.items, o.amount, o.status, o.payment, o.date]);
                    const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `chapman-orders-bulk-${new Date().toISOString().split("T")[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setToast({ msg: 'CSV exported successfully', type: 'success' });
                  }}>Export CSV</button>
                  <button className="blk-x" onClick={() => setSel([])}><X size={13} /></button>
                </div>
              )}
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th className="th-chk">
                        <input type="checkbox" className="chk"
                          checked={sel.length === paged.length && paged.length > 0}
                          onChange={toggleAll} />
                      </th>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Stage</th>
                      <th>Payment</th>
                      <th>Worker</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="empty-cell">
                          {isOffline 
                            ? "Connection issue — retry to load orders" 
                            : orders.length === 0 
                              ? "No orders added yet" 
                              : "No orders match your filters"}
                        </td>
                      </tr>
                    ) : (
                      paged.map((o, i) => (
                        <tr key={o.id} className={`tr ${sel.includes(o.id) ? "sel" : ""}`}
                          style={{ animationDelay: `${i * 22}ms` }}
                          onClick={() => setOpen(o)}>
                          <td data-label="Select" className="td-chk" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" className="chk" checked={sel.includes(o.id)} onChange={() => toggleRow(o.id)} />
                          </td>
                          <td data-label="Order" className="td-id">{o.id}</td>
                          <td data-label="Customer">
                            <div className="td-cust">
                              <Avatar name={o.customer} />
                              <div>
                                <div className="cust-n">{o.customer}</div>
                                <div className="cust-p">{o.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td data-label="Service"><SvcBadge s={o.service} /></td>
                          <td data-label="Items" className="td-n">{o.items}</td>
                          <td data-label="Amount" className="td-amt">₵{o.amount.toLocaleString()}</td>
                          <td data-label="Stage"><StPip s={o.status} /></td>
                          <td data-label="Payment"><PayBadge p={o.payment} /></td>
                          <td data-label="Worker" className="td-dim">{o.worker}</td>
                          <td data-label="Date" className="td-dim">{o.date}</td>
                          <td data-label="Action" className="td-act" onClick={e => e.stopPropagation()}>
                            <button className="ra" onClick={() => setOpen(o)}>View</button>
                            {/* ✅ Wrapped modification actions in canEdit check */}
                            {canEdit && (
                              <>
                                <button className="ra icon" onClick={() => advance(o)} disabled={o.status === "completed"} title="Next stage">
                                  <ArrowRight size={13} />
                                </button>
                                <button 
                                  className="ra icon" 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteSingle(o.id); }} 
                                  title="Delete order"
                                  style={{ color: "#f87171" }}
                                >
                                  <X size={13} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pag">
                <span className="pag-info">
                  {filtered.length === 0 ? "No results"
                    : `${(pg - 1) * pp + 1}–${Math.min(pg * pp, filtered.length)} of ${filtered.length}`}
                </span>
                <div className="pag-right">
                  <select className="pag-pp" value={pp} onChange={e => { setPp(Number(e.target.value)); setPg(1); }}>
                    {[10, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
                  </select>
                  <button className="pag-b" disabled={pg === 1} onClick={() => setPg(p => p - 1)}><ChevronLeft size={14} /></button>
                  {Array.from({ length: Math.min(totalPgs, 5) }, (_, i) => {
                    const n = totalPgs <= 5 ? i + 1
                      : pg <= 3 ? i + 1
                      : pg >= totalPgs - 2 ? totalPgs - 4 + i
                      : pg - 2 + i;
                    return <button key={n} className={`pag-n ${pg === n ? "on" : ""}`} onClick={() => setPg(n)}>{n}</button>;
                  })}
                  <button className="pag-b" disabled={pg === totalPgs} onClick={() => setPg(p => p + 1)}><ChevronRight size={14} /></button>
                </div>
              </div>
            </div>
          )}

          {view === "pipeline" && (
            <div className="pv">
              {stageGrps.map(stage => (
                <div key={stage.key} className="pl">
                  <div className="pl-h">
                    <div className="pl-ht">
                      <span className="pl-d" style={{ background: stage.color }} />
                      <span className="pl-t">{stage.label}</span>
                    </div>
                    <span className="pl-c" style={{ color: stage.color, background: stage.color + "18" }}>
                      {stage.rows.length}
                    </span>
                  </div>
                  <div className="pl-b">
                    {stage.rows.length === 0
                      ? <div className="pl-e">Empty</div>
                      : stage.rows.map(o => <PCard key={o.id} order={o} onClick={() => setOpen(o)} />)
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PermissionGuard>

      <div className={`ov ${open ? "on" : ""}`} onClick={() => setOpen(null)} />
      <aside className={`op ${open ? "on" : ""}`}>
        {open && (
          <>
            <div className="op-h">
              <div>
                <div className="op-oid">{open.id}</div>
                <div className="op-odt">{open.date}</div>
              </div>
              <div className="op-hr">
                <StPip s={open.status} />
                <button className="op-cl" onClick={() => setOpen(null)}><X size={16} /></button>
              </div>
            </div>

            <div className="op-b">
              <div className="ops">
                <div className="ops-lbl">Customer</div>
                <div className="ops-cust">
                  <Avatar name={open.customer} size={44} />
                  <div>
                    <div className="ops-nm">{open.customer}</div>
                    <div className="ops-row"><Phone size={11} /> {open.phone}</div>
                    <div className="ops-row"><MapPin size={11} /> {open.address}</div>
                  </div>
                </div>
              </div>

              <div className="ops">
                <div className="ops-lbl">Order Details</div>
                <div className="ops-grid">
                  <div className="og-i"><span className="og-k">Service</span><SvcBadge s={open.service} /></div>
                  <div className="og-i"><span className="og-k">Items</span><span className="og-v">{open.items}</span></div>
                  <div className="og-i"><span className="og-k">Amount</span><span className="og-v hi">₵{open.amount.toLocaleString()}</span></div>
                  <div className="og-i"><span className="og-k">Payment</span><PayBadge p={open.payment} /></div>
                  <div className="og-i"><span className="og-k">Worker</span><span className="og-v">{open.worker}</span></div>
                  {open.notes && <div className="og-i full"><span className="og-k">Notes</span><span className="og-v note">{open.notes}</span></div>}
                </div>
              </div>

              <div className="ops">
                <div className="ops-lbl">Workflow Stage</div>
                {/* ✅ Passed canEdit to Timeline */}
                <Timeline order={open} onUpdate={(s) => updateStatus(open.id, s)} canEdit={canEdit} />
              </div>
            </div>

            <div className="op-f">
              <button className="opf-s" onClick={() => setOpen(null)}>Close</button>
              <button 
                className="opf-p" 
                disabled={open.status === "completed" || !canEdit} 
                onClick={() => canEdit && advance(open)}
                style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? "pointer" : "not-allowed" }}
              >
                Advance <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default Orders;