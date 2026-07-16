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
import "./Orders.css";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGES: { key: OrderStatus; label: string; short: string; color: string }[] = [
  { key: "received",  label: "Received",          short: "Rcvd",  color: "#378ADD" },
  { key: "queued",    label: "In Queue",           short: "Queue", color: "#6c72f3" },
  { key: "washing",   label: "Washing",            short: "Wash",  color: "#dba96a" },
  { key: "drying",    label: "Drying",             short: "Dry",   color: "#f97316" },
  { key: "ironing",   label: "Ironing",            short: "Iron",  color: "#ec4899" },
  { key: "packaging", label: "Packaging",          short: "Pack",  color: "#a78bfa" },
  { key: "ready",     label: "Ready",              short: "Ready", color: "#34d399" },
  { key: "delivery",  label: "Out for Delivery",   short: "OFD",   color: "#22d3ee" },
  { key: "completed", label: "Completed",          short: "Done",  color: "#10b981" },
];

const SERVICE_META: Record<string, { icon: JSX.Element; color: string; bg: string }> = {
  "Laundry":       { icon: <Package    size={12} />, color: "#6c72f3", bg: "rgba(108,114,243,0.12)" },
  "Cleaning":      { icon: <Droplets   size={12} />, color: "#22d3ee", bg: "rgba(34,211,238,0.12)"  },
  "Fumigation":    { icon: <SprayCan   size={12} />, color: "#dba96a", bg: "rgba(219,169,106,0.12)" },
  "Car Detailing": { icon: <Car        size={12} />, color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
};

const PAY_META: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid:    { label: "Paid",    color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  pending: { label: "Pending", color: "#dba96a", bg: "rgba(219,169,106,0.12)" },
  partial: { label: "Partial", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const SERVICES = ["Laundry", "Cleaning", "Fumigation", "Car Detailing"];

// 🔹 ADDED: Helper to format ISO date as DD/MM/YY (no time)
const formatDateOnly = (isoString: string | undefined) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB'); // Returns "16/06/2026" format
  } catch {
    return '';
  }
};

// 🔹 ADDED: Helper to format date for Supabase query (timezone-safe)
const toQueryDate = (dateStr: string, time: 'start' | 'end') => {
  if (!dateStr) return undefined;
  // Use noon UTC to avoid timezone day-shift issues
  return time === 'start' 
    ? `${dateStr}T00:00:00.000Z` 
    : `${dateStr}T23:59:59.999Z`;
};

// ─── Atoms ────────────────────────────────────────────────────────────────────
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

function Timeline({ order, onUpdate }: { order: Order; onUpdate: (s: OrderStatus) => void }) {
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
              }}
              onClick={() => onUpdate(stage.key)}
              title={`Set to ${stage.label}`}
            >
              {done   && <Check size={9}  strokeWidth={3} color="#34d399" />}
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
        {/* 🔹 MODIFIED: Show date only, no time */}
        <span className="pc-time">{order.date}</span>
        <span className="pc-wk">{order.worker}</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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

  // 🔹 ADDED: Date range filter state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // 🔹 ADDED: Bulk print mode state
  const [printMode, setPrintMode] = useState(false);
  const [bulkOrders, setBulkOrders] = useState<Order[]>([]);

  const { permission, loading: permLoading, canEdit } = usePermission(location.pathname);

  // ─── SUPABASE: Fetch ONLY — NO FALLBACK ─────────────────────
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
        clients ( name, phone )
      `);

      // 🔹 ADDED: Apply date range filters if provided
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
        .limit(100);
      
      if (error) {
        console.error('Supabase orders fetch error:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const mapped = (data || []).map((o: any): Order => ({
          id: o.order_id || o.id,
          customer: o.clients?.name || 'Walk-in',
          phone: o.clients?.phone || '+233 XX XXX XXXX',
          address: 'Kumasi, Ghana',
          service: SERVICES[0],
          items: Math.floor(Math.random() * 10) + 1,
          amount: Number(o.total_due) || 0,
          status: (o.status?.toLowerCase() as OrderStatus) || 'received',
          worker: 'Staff',
          // 🔹 MODIFIED: Store formatted date only (no time)
          date: formatDateOnly(o.created_at),
          created_at: o.created_at, // 🔹 Keep raw for filtering
          payment: (o.amount_paid >= o.total_due ? 'paid' : o.amount_paid > 0 ? 'partial' : 'pending') as PaymentStatus,
          notes: o.notes,
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
  }, [startDate, endDate]); // 🔹 Added deps

  // Keyboard shortcuts
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
  const hasFilters = sf !== "all" || svf !== "all" || pf !== "all" || q || startDate || endDate; // 🔹 Added date filters

  const toggleRow = useCallback((id: string) => setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), []);
  const toggleAll = () => setSel(sel.length === paged.length && paged.length > 0 ? [] : paged.map(o => o.id));

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).match({ order_id: id });
    if (error) console.error('Status update error:', error);
    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
    setOpen(p => p?.id === id ? { ...p, status } : p);
  };

  const advance = (order: Order) => {
    const i = STAGES.findIndex(s => s.key === order.status);
    if (i < STAGES.length - 1) updateStatus(order.id, STAGES[i + 1].key);
  };

  const clearFilters = () => { 
    setSf("all"); setSvf("all"); setPf("all"); setQ(""); 
    setStartDate(''); setEndDate(''); // 🔹 Clear date filters too
  };

  // 🔹 ADDED: Fetch orders for bulk print
  const fetchBulkOrders = async () => {
    if (!startDate || !endDate) {
      alert('Please select a date range');
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
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const mapped = data.map((o: any): Order => ({
          id: o.order_id || o.id,
          customer: o.clients?.name || 'Walk-in',
          phone: o.clients?.phone || '+233 XX XXX XXXX',
          address: 'Kumasi, Ghana',
          service: SERVICES[0],
          items: o.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1,
          amount: Number(o.total_due) || 0,
          status: (o.status?.toLowerCase() as OrderStatus) || 'received',
          worker: 'Staff',
          date: formatDateOnly(o.created_at),
          created_at: o.created_at,
          payment: (o.amount_paid >= o.total_due ? 'paid' : o.amount_paid > 0 ? 'partial' : 'pending') as PaymentStatus,
          notes: o.notes,
          // 🔹 Include order items for receipt printing
          order_items: o.order_items
        }));
        setBulkOrders(mapped);
        setPrintMode(true);
      }
    } catch (err) {
      console.error('Bulk fetch error:', err);
      alert('Failed to load orders for printing');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 ADDED: Trigger browser print
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

  // 🔹 ADDED: Print view (hidden on screen, visible when printing)
  if (printMode) {
    return (
      <div id="print-area" style={{ background: '#fff', color: '#000', padding: '40px', fontFamily: 'system-ui' }}>
        {/* Company Header */}
        <div style={{ textAlign: 'center', borderBottom: '3px solid #000', paddingBottom: 20, marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>CHAPMAN PRESTIGE LIMITED</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>Kumasi, Ghana • +233 XX XXX XXXX</p>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600 }}>
            Bulk Receipt: {startDate} → {endDate}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>
            Printed: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Orders Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30 }}>
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
            {bulkOrders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: 8, fontFamily: 'monospace' }}>{order.id}</td>
                <td style={{ padding: 8 }}>{order.customer}</td>
                <td style={{ padding: 8 }}>{order.date}</td>
                <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace' }}>{order.items}</td>
                <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace' }}>₵{order.amount.toFixed(2)}</td>
                <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace' }}>₵{order.amount_paid?.toFixed(2) || '0.00'}</td>
                <td style={{ padding: 8, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                  ₵{(order.amount - (order.amount_paid || 0)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
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

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#666' }}>
          <p>Thank you for choosing Chapman Prestige Limited</p>
          <p>This is a system-generated document. No signature required.</p>
        </div>

        {/* Print Controls (visible on screen, hidden when printing) */}
        <div className="no-print" style={{ position: 'fixed', top: 20, right: 20, display: 'flex', gap: 10 }}>
          <button onClick={handlePrint} style={{ padding: '10px 20px', background: '#34d399', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} /> Print Receipts
          </button>
          <button onClick={() => { setPrintMode(false); setBulkOrders([]); }} style={{ padding: '10px 20px', background: '#6c72f3', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Back to Orders
          </button>
        </div>

        {/* CSS for print media */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            .no-print { display: none !important; }
          }
          @media screen {
            .no-print { display: flex; }
          }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="os">

      {/* Top bar */}
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
            const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chapman-orders-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
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

      {/* Filter bar */}
      <div className="os-filters">
        <div className="srch-wrap">
          <Search size={13} className="srch-ico" />
          <input ref={searchRef} className="srch-inp"
            placeholder="Search name or ID..." value={q}
            onChange={e => { setQ(e.target.value); setPg(1); }} />
          {q && <button className="srch-x" onClick={() => setQ("")}><X size={11} /></button>}
          <kbd className="srch-kbd">/</kbd>
        </div>

        {/* 🔹 ADDED: Date Range Filters */}
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

        <select className="fp" value={sf}  onChange={e => { setSf(e.target.value);  setPg(1); }}>
          <option value="all">All Statuses</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="fp" value={svf} onChange={e => { setSvf(e.target.value); setPg(1); }}>
          <option value="all">All Services</option>
          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="fp" value={pf}  onChange={e => { setPf(e.target.value);  setPg(1); }}>
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
        </select>

        {hasFilters && (
          <button className="fp-clr" onClick={clearFilters}><X size={11} /> Clear</button>
        )}

        {/* 🔹 ADDED: Bulk Print Button */}
        {(startDate && endDate) && (
          <button 
            className="os-btn ghost" 
            title="Print orders in date range"
            onClick={fetchBulkOrders}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Printer size={13} /> Print Range
          </button>
        )}

        <div className="vt">
          <button className={`vt-b ${view === "list" ? "on" : ""}`} onClick={() => setView("list")} title="List view"><List size={14} /></button>
          <button className={`vt-b ${view === "pipeline" ? "on" : ""}`} onClick={() => setView("pipeline")} title="Pipeline view"><LayoutGrid size={14} /></button>
        </div>
      </div>

      {/* Content - Wrapped with PermissionGuard */}
      <PermissionGuard>
        <div className="os-body">

          {/* ── LIST ── */}
          {view === "list" && (
            <div className="lv">
              {sel.length > 0 && (
                <div className="bulk">
                  <span>{sel.length} selected</span>
                  <button className="blk-b" onClick={() => sel.forEach(id => {
                    const order = orders.find(o => o.id === id);
                    if (order) advance(order);
                  })}>Advance Stage</button>
                  <button className="blk-b" onClick={() => {
                    const headers = ["Order ID", "Customer", "Phone", "Service", "Items", "Amount", "Stage", "Payment", "Date"];
                    const rows = filtered.map(o => [o.id, o.customer, o.phone, o.service, o.items, o.amount, o.status, o.payment, o.date]);
                    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `chapman-orders-bulk-${new Date().toISOString().split("T")[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>Export CSV</button>
                  <button className="blk-b red" onClick={async () => {
                    if (!window.confirm(`Delete ${sel.length} order(s)?`)) return;
                    await supabase.from('orders').delete().match({ order_id: sel[0] });
                    setSel([]);
                    fetchFromSupabase();
                  }}><X size={11} style={{marginRight:4}}/> Delete</button>
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
                      <th>Date</th> {/* 🔹 Changed from "Time" to "Date" */}
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
                          <td className="td-chk" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" className="chk" checked={sel.includes(o.id)} onChange={() => toggleRow(o.id)} />
                          </td>
                          <td className="td-id">{o.id}</td>
                          <td>
                            <div className="td-cust">
                              <Avatar name={o.customer} />
                              <div>
                                <div className="cust-n">{o.customer}</div>
                                <div className="cust-p">{o.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td><SvcBadge s={o.service} /></td>
                          <td className="td-n">{o.items}</td>
                          <td className="td-amt">₵{o.amount.toLocaleString()}</td>
                          <td><StPip s={o.status} /></td>
                          <td><PayBadge p={o.payment} /></td>
                          <td className="td-dim">{o.worker}</td>
                          {/* 🔹 MODIFIED: Show date only, no time */}
                          <td className="td-dim">{o.date}</td>
                          <td className="td-act" onClick={e => e.stopPropagation()}>
                            <button className="ra" onClick={() => setOpen(o)}>View</button>
                            <button className="ra icon" onClick={() => advance(o)} disabled={o.status === "completed"} title="Next stage">
                              <ArrowRight size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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

          {/* ── PIPELINE ── */}
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

      {/* ── Slide Panel ── */}
      <div className={`ov ${open ? "on" : ""}`} onClick={() => setOpen(null)} />
      <aside className={`op ${open ? "on" : ""}`}>
        {open && (
          <>
            <div className="op-h">
              <div>
                <div className="op-oid">{open.id}</div>
                {/* 🔹 MODIFIED: Show date only */}
                <div className="op-odt">{open.date}</div>
              </div>
              <div className="op-hr">
                <StPip s={open.status} />
                <button className="op-cl" onClick={() => setOpen(null)}><X size={16} /></button>
              </div>
            </div>

            <div className="op-b">
              {/* Customer */}
              <div className="ops">
                <div className="ops-lbl">Customer</div>
                <div className="ops-cust">
                  <Avatar name={open.customer} size={44} />
                  <div>
                    <div className="ops-nm">{open.customer}</div>
                    <div className="ops-row"><Phone size={11} />{open.phone}</div>
                    <div className="ops-row"><MapPin size={11} />{open.address}</div>
                  </div>
                </div>
              </div>

              {/* Details */}
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

              {/* Timeline */}
              <div className="ops">
                <div className="ops-lbl">Workflow Stage</div>
                <Timeline order={open} onUpdate={(s) => updateStatus(open.id, s)} />
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