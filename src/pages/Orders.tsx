import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  List, LayoutGrid, Search, X, ChevronLeft, ChevronRight,
  Package, Droplets, SprayCan, Car, ArrowRight, Check,
  Phone, MapPin, Download, Plus, RefreshCw, Calendar, Printer,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { usePermission } from "../hooks/usePermission";
import { useConnection, isNetworkError } from "../hooks/useConnection";
import { PermissionGuard } from "../components/PermissionGuard";
import {
  Avatar,
  Button,
  EmptyState,
  PageHeader,
  StatusPill,
} from "../components/ui";
import type { PillTone } from "../components/ui";
import "./Orders.css";
import { BRAND } from "../components/brand/brand";

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

/* Stage colours come from the shared workflow ramp in tokens.css, so a stage
   reads the same here, in the pipeline board and on the dashboard. */
const STAGES: { key: OrderStatus; label: string; short: string; color: string }[] = [
  { key: "received",  label: "Received",         short: "Rcvd",  color: "var(--stage-received)" },
  { key: "queued",    label: "In Queue",         short: "Queue", color: "var(--stage-queued)" },
  { key: "washing",   label: "Washing",          short: "Wash",  color: "var(--stage-washing)" },
  { key: "drying",    label: "Drying",           short: "Dry",   color: "var(--stage-drying)" },
  { key: "ironing",   label: "Ironing",          short: "Iron",  color: "var(--stage-ironing)" },
  { key: "packaging", label: "Packaging",        short: "Pack",  color: "var(--stage-packaging)" },
  { key: "ready",     label: "Ready",            short: "Ready", color: "var(--stage-ready)" },
  { key: "delivery",  label: "Out for Delivery", short: "OFD",   color: "var(--stage-delivery)" },
  { key: "completed", label: "Completed",        short: "Done",  color: "var(--stage-completed)" },
];

const SERVICE_TONE: Record<string, PillTone> = {
  Laundry: "brand",
  Cleaning: "info",
  Fumigation: "warn",
  "Car Detailing": "ok",
};

const SERVICE_ICON: Record<string, JSX.Element> = {
  Laundry: <Package size={12} />,
  Cleaning: <Droplets size={12} />,
  Fumigation: <SprayCan size={12} />,
  "Car Detailing": <Car size={12} />,
};

const PAY_META: Record<PaymentStatus, { label: string; tone: PillTone }> = {
  paid: { label: "Paid", tone: "ok" },
  pending: { label: "Pending", tone: "warn" },
  partial: { label: "Partial", tone: "bad" },
};

const SERVICES = ["Laundry", "Cleaning", "Fumigation", "Car Detailing"];

const formatDateOnly = (isoString: string | undefined) => {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("en-GB");
  } catch {
    return "";
  }
};

const toQueryDate = (dateStr: string, time: "start" | "end") => {
  if (!dateStr) return undefined;
  return time === "start" ? `${dateStr}T00:00:00.000Z` : `${dateStr}T23:59:59.999Z`;
};

const escapeCsv = (val: any) => `"${String(val).replace(/"/g, '""')}"`;

const hueFor = (name: string) => ((name.charCodeAt(0) || 0) * 37 + (name.charCodeAt(1) || 0) * 11) % 360;
const stageOf = (status: OrderStatus) => STAGES.find((s) => s.key === status);

function ServiceTag({ s }: { s: string }) {
  return (
    <StatusPill tone={SERVICE_TONE[s] ?? "neutral"}>
      {SERVICE_ICON[s] ?? <Package size={12} />}
      {s}
    </StatusPill>
  );
}

function PayTag({ p }: { p: PaymentStatus }) {
  const meta = PAY_META[p];
  return <StatusPill tone={meta.tone}>{meta.label}</StatusPill>;
}

function StageTag({ s }: { s: OrderStatus }) {
  const stage = stageOf(s);
  return (
    <span className="ord-stage">
      <span className="ord-stage__dot" style={{ background: stage?.color }} />
      {stage?.label ?? s}
    </span>
  );
}

/* ── Workflow timeline ──────────────────────────────────────────────────────
   One button per stage: staff can jump straight to any point in the flow. The
   control is disabled for a view-only role rather than swallowing the click.  */
function Timeline({
  order,
  onUpdate,
  canEdit,
}: {
  order: Order;
  onUpdate: (s: OrderStatus) => void;
  canEdit: boolean;
}) {
  const current = STAGES.findIndex((s) => s.key === order.status);

  return (
    <div className="ord-tl" role="group" aria-label="Workflow stage">
      {STAGES.map((stage, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <div className="ord-tl__node" key={stage.key}>
            {index > 0 && (
              <span
                className="ord-tl__line"
                style={{ background: index <= current ? stage.color : "var(--line-faint)" }}
              />
            )}
            <button
              type="button"
              className="ord-tl__dot"
              style={{
                borderColor: active ? stage.color : done ? "var(--ok-500)" : "var(--line)",
                background: active
                  ? `color-mix(in srgb, ${stage.color} 18%, transparent)`
                  : done
                    ? "var(--ok-soft)"
                    : "transparent",
                boxShadow: active ? `0 0 0 4px color-mix(in srgb, ${stage.color} 14%, transparent)` : "none",
              }}
              onClick={() => onUpdate(stage.key)}
              disabled={!canEdit}
              title={canEdit ? `Set to ${stage.label}` : "View only"}
              aria-label={`Set stage to ${stage.label}`}
              aria-pressed={active}
            >
              {done && <Check size={10} strokeWidth={3} color="var(--ok-500)" />}
              {active && <span className="ord-tl__pulse" style={{ background: stage.color }} />}
            </button>
            <span
              className="ord-tl__label"
              style={{
                color: active ? stage.color : done ? "var(--ok-500)" : "var(--text-4)",
                fontWeight: active ? 700 : 600,
              }}
            >
              {stage.short}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Pipeline card ──────────────────────────────────────────────────────── */
function PipelineCard({ order, onClick }: { order: Order; onClick: () => void }) {
  return (
    <div className="ord-card" onClick={onClick}>
      <div className="ord-card__top">
        <span className="ord-card__id">{order.id}</span>
        <PayTag p={order.payment} />
      </div>
      <div className="ord-card__cust">
        <Avatar name={order.customer} size="sm" hue={hueFor(order.customer)} />
        <div>
          <div className="ord-card__name">{order.customer}</div>
          <div className="ord-card__sub">
            {order.items} items · GH₵{order.amount.toLocaleString()}
          </div>
        </div>
      </div>
      <div className="ord-card__foot">
        <span>{order.date}</span>
        <span>{order.worker}</span>
      </div>
    </div>
  );
}

export const Orders = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [view, setView] = useState<"list" | "pipeline">("list");
  const [sf, setSf] = useState("all");
  const [svf, setSvf] = useState("all");
  const [pf, setPf] = useState("all");
  const [q, setQ] = useState("");
  const [pg, setPg] = useState(1);
  const [pp, setPp] = useState(10);
  const [sel, setSel] = useState<string[]>([]);
  const [open, setOpen] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  /* The connection is owned by the shell; this page only needs it to explain
     an empty table honestly. */
  const { isOffline, retry: retryConnection } = useConnection();
  const searchRef = useRef<HTMLInputElement>(null);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [printMode, setPrintMode] = useState(false);
  const [bulkOrders, setBulkOrders] = useState<Order[]>([]);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { canEdit } = usePermission(location.pathname);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchFromSupabase = useCallback(async (customStart?: string, customEnd?: string) => {
    setLoading(true);
    try {
      let query = supabase.from("orders").select(`
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

      if (start) query = query.gte("created_at", toQueryDate(start, "start"));
      if (end) query = query.lte("created_at", toQueryDate(end, "end"));

      const { data, error } = await query.order("created_at", { ascending: false }).range(0, 1999);

      if (error) {
        console.error("Supabase orders fetch error:", error);
        throw error;
      }

      if (data && data.length > 0) {
        const mapped = data.map((o: any): Order => ({
          id: o.order_id || o.id,
          customer: o.clients?.name || "Walk-in",
          phone: o.clients?.phone || "+233 53 413 4809",
          address: "Kumasi, Ghana",
          service: o.notes || "Laundry",
          items: o.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1,
          amount: Number(o.total_due) || 0,
          amount_paid: Number(o.amount_paid) || 0,
          status: (o.status?.toLowerCase() as OrderStatus) || "received",
          worker: "Staff",
          date: formatDateOnly(o.created_at),
          created_at: o.created_at,
          payment: (o.amount_paid >= o.total_due ? "paid" : o.amount_paid > 0 ? "partial" : "pending") as PaymentStatus,
          notes: o.notes,
          order_items: o.order_items,
        }));
        setOrders(mapped);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Orders fetch failed:", err);
      if (isNetworkError(err)) retryConnection();
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, retryConnection]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  const filtered = useMemo(() => orders.filter((o) => {
    if (sf !== "all" && o.status !== sf) return false;
    if (svf !== "all" && o.service !== svf) return false;
    if (pf !== "all" && o.payment !== pf) return false;
    if (q) {
      const lq = q.toLowerCase();
      if (!o.customer.toLowerCase().includes(lq) && !o.id.toLowerCase().includes(lq)) return false;
    }
    return true;
  }), [orders, sf, svf, pf, q]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / pp));
  const paged = filtered.slice((pg - 1) * pp, pg * pp);
  const stageGrps = useMemo(
    () => STAGES.map((s) => ({ ...s, rows: filtered.filter((o) => o.status === s.key) })),
    [filtered]
  );

  const hasFilters = Boolean(sf !== "all" || svf !== "all" || pf !== "all" || q || startDate || endDate);

  const toggleRow = useCallback(
    (id: string) => setSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    []
  );
  const toggleAll = () =>
    setSel(sel.length === paged.length && paged.length > 0 ? [] : paged.map((o) => o.id));

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("order_id", id);
    if (error) console.error("Status update error:", error);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setOpen((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  const advance = (order: Order) => {
    const index = STAGES.findIndex((s) => s.key === order.status);
    if (index < STAGES.length - 1) updateStatus(order.id, STAGES[index + 1].key);
  };

  const handleDeleteSingle = async (orderId: string) => {
    if (!window.confirm("Delete this order?")) return;

    const { error } = await supabase.from("orders").delete().eq("order_id", orderId);

    if (error) {
      console.error("Delete error:", error);
      setToast({ msg: "Failed to delete order", type: "error" });
      return;
    }

    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (open?.id === orderId) setOpen(null);
    setToast({ msg: "Order deleted successfully", type: "success" });
  };

  const clearFilters = () => {
    setSf("all");
    setSvf("all");
    setPf("all");
    setQ("");
    setStartDate("");
    setEndDate("");
    setPg(1);
  };

  const exportCsv = (scope: "filtered" | "bulk") => {
    const headers = ["Order ID", "Customer", "Phone", "Service", "Items", "Amount", "Stage", "Payment", "Date"];
    const rows = filtered.map((o) => [o.id, o.customer, o.phone, o.service, o.items, o.amount, o.status, o.payment, o.date]);
    const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cpl-orders-${scope === "bulk" ? "selection-" : ""}${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ msg: "CSV exported successfully", type: "success" });
  };

  const fetchBulkOrders = async () => {
    if (!startDate || !endDate) {
      setToast({ msg: "Please select a date range", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
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
        .gte("created_at", toQueryDate(startDate, "start"))
        .lte("created_at", toQueryDate(endDate, "end"))
        .order("created_at", { ascending: true })
        .range(0, 1999);

      if (error) throw error;

      if (data) {
        const mapped = data.map((o: any): Order => ({
          id: o.order_id || o.id,
          customer: o.clients?.name || "Walk-in",
          phone: o.clients?.phone || "+233 53 413 4809",
          address: "Kumasi, Ghana",
          service: o.notes || "Laundry",
          items: o.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1,
          amount: Number(o.total_due) || 0,
          amount_paid: Number(o.amount_paid) || 0,
          status: (o.status?.toLowerCase() as OrderStatus) || "received",
          worker: "Staff",
          date: formatDateOnly(o.created_at),
          created_at: o.created_at,
          payment: (o.amount_paid >= o.total_due ? "paid" : o.amount_paid > 0 ? "partial" : "pending") as PaymentStatus,
          notes: o.notes,
          order_items: o.order_items,
        }));
        setBulkOrders(mapped);
        setPrintMode(true);
        setToast({ msg: "Orders loaded for printing", type: "success" });
      }
    } catch (err) {
      console.error("Bulk fetch error:", err);
      setToast({ msg: "Failed to load orders for printing", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ── Print sheet, unchanged in content ──────────────────────────────────── */
  if (printMode) {
    const monthGroups: Record<string, Order[]> = {};
    bulkOrders.forEach((o) => {
      const d = o.created_at ? new Date(o.created_at) : null;
      const key = d ? d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "Unknown";
      if (!monthGroups[key]) monthGroups[key] = [];
      monthGroups[key].push(o);
    });
    const monthKeys = Object.keys(monthGroups);

    return (
      <div
        id="print-area"
        style={{
          background: "#fff",
          color: "#000",
          padding: "40px",
          fontFamily: "system-ui",
          minHeight: "auto",
          height: "auto",
          maxHeight: "none",
          overflow: "visible",
        }}
      >
        <div style={{ textAlign: "center", borderBottom: "3px solid #000", paddingBottom: 20, marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontSize: "var(--fs-2xl)", fontWeight: 700 }}>CHAPMAN PRESTIGE LIMITED</h1>
          <p style={{ margin: "8px 0 0", fontSize: "var(--fs-md)" }}>Kumasi, Ghana • +233 53 413 4809</p>
          <p style={{ margin: "4px 0 0", fontSize: "var(--fs-md)", fontWeight: 600 }}>
            Bulk Receipt: {startDate} to {endDate}
          </p>
        </div>

        {monthKeys.map((monthKey) => {
          const rows = monthGroups[monthKey];
          const monthAmount = rows.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
          const monthPaid = rows.reduce((sum, o) => sum + (Number(o.amount_paid) || 0), 0);
          const monthBalance = monthAmount - monthPaid;

          return (
            <div key={monthKey} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: "var(--fs-lg)", fontWeight: 700, margin: "0 0 8px", borderBottom: "1px solid #999", paddingBottom: 4 }}>
                {monthKey}
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #000" }}>
                    <th style={{ textAlign: "left", padding: 8 }}>Order ID</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Customer</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Date</th>
                    <th style={{ textAlign: "right", padding: 8 }}>Items</th>
                    <th style={{ textAlign: "right", padding: 8 }}>Amount</th>
                    <th style={{ textAlign: "right", padding: 8 }}>Paid</th>
                    <th style={{ textAlign: "right", padding: 8 }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((order: any) => {
                    const amount = Number(order.amount) || 0;
                    const paid = Number(order.amount_paid) || 0;
                    const balance = amount - paid;

                    return (
                      <tr key={order.id} style={{ borderBottom: "1px solid #ddd" }}>
                        <td style={{ padding: 8, fontFamily: "monospace" }}>{order.id}</td>
                        <td style={{ padding: 8 }}>{order.customer}</td>
                        <td style={{ padding: 8 }}>{order.date}</td>
                        <td style={{ padding: 8, textAlign: "right", fontFamily: "monospace" }}>{order.items}</td>
                        <td style={{ padding: 8, textAlign: "right", fontFamily: "monospace" }}>GH₵{amount.toFixed(2)}</td>
                        <td style={{ padding: 8, textAlign: "right", fontFamily: "monospace" }}>GH₵{paid.toFixed(2)}</td>
                        <td style={{ padding: 8, textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                          GH₵{balance.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #000" }}>
                    <td colSpan={4} style={{ padding: 8, textAlign: "right", fontWeight: 700 }}>
                      Month Total ({rows.length} orders)
                    </td>
                    <td style={{ padding: 8, textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>GH₵{monthAmount.toFixed(2)}</td>
                    <td style={{ padding: 8, textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>GH₵{monthPaid.toFixed(2)}</td>
                    <td style={{ padding: 8, textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>GH₵{monthBalance.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}

        <div style={{ textAlign: "right", marginTop: 20 }}>
          <p style={{ margin: "4px 0", fontSize: "var(--fs-md)" }}>
            <strong>Total Orders:</strong> {bulkOrders.length}
          </p>
          <p style={{ margin: "4px 0", fontSize: "var(--fs-md)" }}>
            <strong>Grand Total:</strong> GH₵{bulkOrders.reduce((sum, o) => sum + o.amount, 0).toFixed(2)}
          </p>
          <p style={{ margin: "4px 0", fontSize: "var(--fs-md)" }}>
            <strong>Total Paid:</strong> GH₵{bulkOrders.reduce((sum, o) => sum + (o.amount_paid || 0), 0).toFixed(2)}
          </p>
          <p style={{ margin: "4px 0", fontSize: "var(--fs-md)", fontWeight: 700 }}>
            <strong>Outstanding Balance:</strong> GH₵
            {bulkOrders.reduce((sum, o) => sum + (o.amount - (o.amount_paid || 0)), 0).toFixed(2)}
          </p>
        </div>

        <div style={{ marginTop: 40, textAlign: "center", fontSize: "var(--fs-xs)", color: "#666" }}>
          <p>Thank you for choosing {BRAND.name}</p>
          <p>This is a system-generated document. No signature required.</p>
        </div>

        <div className="no-print" style={{ position: "fixed", top: 20, right: 20, gap: 10, zIndex: 20 }}>
          <Button variant="ok" leadingIcon={<Printer size={16} />} onClick={() => window.print()}>
            Print Receipts
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setPrintMode(false);
              setBulkOrders([]);
            }}
          >
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-page">
      <div className="table-page__head">
        <PageHeader
          eyebrow={<><Package size={13} /> Order book</>}
          title="Orders"
          subtitle={`${orders.length} total · ${orders.filter((o) => o.status !== "completed").length} active · ${orders.filter((o) => o.payment === "pending").length} unpaid`}
          actions={
            <>
              <Button
                variant="secondary"
                iconOnly
                aria-label="Refresh orders"
                title="Refresh"
                disabled={loading}
                onClick={async () => {
                  await fetchFromSupabase();
                  setToast({ msg: "Data refreshed", type: "success" });
                }}
              >
                <RefreshCw size={16} className={loading ? "spin" : ""} />
              </Button>
              <Button variant="secondary" iconOnly aria-label="Export CSV" title="Export CSV" onClick={() => exportCsv("filtered")}>
                <Download size={16} />
              </Button>
              <Button
                variant="primary"
                leadingIcon={<Plus size={16} />}
                disabled={!canEdit}
                onClick={() => canEdit && navigate("/new-order")}
              >
                {canEdit ? "New Order" : "View only"}
              </Button>
            </>
          }
        />
      </div>

      {/* ── Filters: stay pinned while the rows scroll ───────────────────── */}
      <div className="table-page__tools">
        <div className="ord-srch">
          <Search size={13} className="ord-srch__ico" />
          <input
            ref={searchRef}
            className="input ord-srch__inp"
            placeholder="Search name or order ID…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPg(1); }}
            aria-label="Search orders"
          />
          {q ? (
            <button
              type="button"
              className="ord-srch__x"
              onClick={() => { setQ(""); setPg(1); }}
              aria-label="Clear search"
            >
              <X size={11} />
            </button>
          ) : null}
          <kbd className="ord-srch__kbd">/</kbd>
        </div>

        <div className="ord-dates">
          <Calendar size={13} style={{ color: "var(--text-4)" }} />
          <input
            className="input"
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPg(1); }}
            title="Start date"
            aria-label="Start date"
          />
          <span className="ord-dates__sep">to</span>
          <input
            className="input"
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPg(1); }}
            title="End date"
            aria-label="End date"
          />
        </div>

        <span className="ord-fp-wrap">
          <select className="select ord-fp" value={sf} onChange={(e) => { setSf(e.target.value); setPg(1); }} aria-label="Filter by status">
            <option value="all">All Statuses</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </span>

        <span className="ord-fp-wrap">
          <select className="select ord-fp" value={svf} onChange={(e) => { setSvf(e.target.value); setPg(1); }} aria-label="Filter by service">
            <option value="all">All Services</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </span>

        <span className="ord-fp-wrap">
          <select className="select ord-fp" value={pf} onChange={(e) => { setPf(e.target.value); setPg(1); }} aria-label="Filter by payment">
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
          </select>
        </span>

        {hasFilters ? (
          <button type="button" className="ord-fp-clr" onClick={clearFilters}>
            <X size={11} /> Clear
          </button>
        ) : null}

        {startDate && endDate ? (
          <button
            type="button"
            className="ord-ghost"
            onClick={() => { setBulkOrders([]); setPrintMode(false); void fetchBulkOrders(); }}
          >
            <Printer size={13} /> Print Range
          </button>
        ) : null}

        <button
          type="button"
          className="ord-ghost"
          onClick={async () => {
            await fetchFromSupabase();
            setBulkOrders([]);
            setToast({ msg: "Data refreshed", type: "success" });
          }}
        >
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh Data
        </button>

        <div className="ord-vt" role="group" aria-label="Order view">
          <button
            type="button"
            className={`ord-vt__b ${view === "list" ? "is-active" : ""}`}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            title="List view"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            className={`ord-vt__b ${view === "pipeline" ? "is-active" : ""}`}
            aria-pressed={view === "pipeline"}
            onClick={() => setView("pipeline")}
            title="Pipeline view"
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {toast ? (
        <div className={`ord-toast ${toast.type === "error" ? "ord-toast--bad" : "ord-toast--ok"}`} role="status">
          {toast.msg}
          <button className="ord-toast__close" onClick={() => setToast(null)} aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      ) : null}

      <PermissionGuard>
        {sel.length > 0 ? (
          <div className="ord-bulk" role="region" aria-label="Bulk actions">
            <strong>{sel.length} selected</strong>
            {canEdit ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    sel.forEach((id) => {
                      const order = orders.find((o) => o.id === id);
                      if (order) advance(order);
                    })
                  }
                >
                  Advance stage
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (!window.confirm(`Delete ${sel.length} order(s)?`)) return;
                    const { error } = await supabase.from("orders").delete().in("order_id", sel);
                    if (error) {
                      console.error("Delete error:", error);
                      setToast({ msg: "Failed to delete orders", type: "error" });
                      return;
                    }
                    setSel([]);
                    fetchFromSupabase();
                    setToast({ msg: "Orders deleted successfully", type: "success" });
                  }}
                >
                  Delete
                </Button>
              </>
            ) : null}
            <Button variant="secondary" size="sm" leadingIcon={<Download size={14} />} onClick={() => exportCsv("bulk")}>
              Export CSV
            </Button>
            <span className="ord-spacer" />
            <Button variant="ghost" size="sm" iconOnly aria-label="Clear selection" onClick={() => setSel([])}>
              <X size={14} />
            </Button>
          </div>
        ) : null}

        <div className="table-page__body">
          {view === "list" ? (
            <div className="table-page__scroll">
              <table className="data-table ord-table">
                <thead>
                  <tr>
                    <th className="is-check">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={sel.length === paged.length && paged.length > 0}
                        onChange={toggleAll}
                        aria-label="Select every order on this page"
                      />
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
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [0, 1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td colSpan={11} className="is-full">
                          <div className="skeleton ord-skel" />
                        </td>
                      </tr>
                    ))
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="is-full">
                        <EmptyState
                          icon={isOffline ? <X size={20} /> : <Package size={20} />}
                          title={
                            isOffline
                              ? "Connection issue"
                              : orders.length === 0
                                ? "No orders added yet"
                                : "No orders match these filters"
                          }
                          message={
                            isOffline
                              ? "The order book could not be reached. Refresh to try again."
                              : orders.length === 0
                                ? "Orders recorded at the counter or from the app appear here."
                                : "Widen the date range, or clear a filter to see more of the order book."
                          }
                          action={
                            isOffline ? (
                              <Button variant="secondary" onClick={() => { retryConnection(); void fetchFromSupabase(); }}>Try again</Button>
                            ) : hasFilters ? (
                              <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
                            ) : null
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    paged.map((o) => (
                      <tr
                        key={o.id}
                        className={`ord-row ${sel.includes(o.id) ? "is-selected" : ""}`}
                        onClick={() => setOpen(o)}
                      >
                        <td className="is-check" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={sel.includes(o.id)}
                            onChange={() => toggleRow(o.id)}
                            aria-label={`Select order ${o.id}`}
                          />
                        </td>
                        <td data-label="Order" className="ord-id">{o.id}</td>
                        <td data-label="Customer">
                          <div className="ord-cust">
                            <Avatar name={o.customer} hue={hueFor(o.customer)} />
                            <div>
                              <div className="ord-cust__name">{o.customer}</div>
                              <div className="ord-cust__phone">{o.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Service"><ServiceTag s={o.service} /></td>
                        <td data-label="Items" className="ord-num">{o.items}</td>
                        <td data-label="Amount" className="ord-amount">GH₵{o.amount.toLocaleString()}</td>
                        <td data-label="Stage"><StageTag s={o.status} /></td>
                        <td data-label="Payment"><PayTag p={o.payment} /></td>
                        <td data-label="Worker" className="ord-dim">{o.worker}</td>
                        <td data-label="Date" className="ord-dim">{o.date}</td>
                        <td data-label="Actions" onClick={(e) => e.stopPropagation()}>
                          <div className="ord-actions">
                            <Button variant="ghost" size="sm" onClick={() => setOpen(o)}>View</Button>
                            {canEdit ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  iconOnly
                                  title="Next stage"
                                  aria-label={`Advance ${o.id} to the next stage`}
                                  disabled={o.status === "completed"}
                                  onClick={() => advance(o)}
                                >
                                  <ArrowRight size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  iconOnly
                                  title="Delete order"
                                  aria-label={`Delete ${o.id}`}
                                  onClick={() => void handleDeleteSingle(o.id)}
                                  style={{ color: "var(--bad-500)" }}
                                >
                                  <X size={14} />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ord-pipeline table-page__scroll">
              {stageGrps.map((stage) => (
                <div className="ord-col" key={stage.key}>
                  <div className="ord-col__head">
                    <span className="ord-col__title">
                      <span className="ord-col__dot" style={{ background: stage.color }} />
                      {stage.label}
                    </span>
                    <span className="tag-count">{stage.rows.length}</span>
                  </div>
                  <div className="ord-col__body">
                    {stage.rows.length === 0 ? (
                      <div className="ord-col__empty">Nothing at this stage</div>
                    ) : (
                      stage.rows.map((o) => <PipelineCard key={o.id} order={o} onClick={() => setOpen(o)} />)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="table-page__foot">
          <div className="ord-pag">
            <span className="ord-pag__info">
              {filtered.length === 0
                ? "No results"
                : `${(pg - 1) * pp + 1} to ${Math.min(pg * pp, filtered.length)} of ${filtered.length}`}
            </span>
            <div className="ord-pag__right">
              <select className="select" value={pp} onChange={(e) => { setPp(Number(e.target.value)); setPg(1); }} aria-label="Orders per page">
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>{n} / page</option>
                ))}
              </select>
              <Button variant="secondary" size="sm" iconOnly aria-label="Previous page" disabled={pg === 1} onClick={() => setPg((p) => p - 1)}>
                <ChevronLeft size={14} />
              </Button>
              {Array.from({ length: Math.min(totalPgs, 5) }, (_, i) => {
                const n = totalPgs <= 5 ? i + 1 : pg <= 3 ? i + 1 : pg >= totalPgs - 2 ? totalPgs - 4 + i : pg - 2 + i;
                return (
                  <button
                    key={n}
                    type="button"
                    className={`ord-page-num ${pg === n ? "is-active" : ""}`}
                    onClick={() => setPg(n)}
                    aria-current={pg === n ? "page" : undefined}
                  >
                    {n}
                  </button>
                );
              })}
              <Button variant="secondary" size="sm" iconOnly aria-label="Next page" disabled={pg === totalPgs} onClick={() => setPg((p) => p + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </PermissionGuard>

      {/* ── Detail drawer ────────────────────────────────────────────────── */}
      <div className={`ord-overlay ${open ? "is-open" : ""}`} onClick={() => setOpen(null)} />
      <aside className={`ord-drawer ${open ? "is-open" : ""}`} aria-hidden={!open} aria-label="Order details">
        {open ? (
          <>
            <div className="ord-drawer__head">
              <div>
                <div className="ord-drawer__id">{open.id}</div>
                <div className="ord-drawer__date">{open.date}</div>
              </div>
              <div className="ord-drawer__head-actions">
                <StageTag s={open.status} />
                <Button variant="ghost" size="sm" iconOnly aria-label="Close order details" onClick={() => setOpen(null)}>
                  <X size={16} />
                </Button>
              </div>
            </div>

            <div className="ord-drawer__body">
              <section>
                <div className="ord-block-label">Customer</div>
                <div className="ord-customer">
                  <Avatar name={open.customer} size="lg" hue={hueFor(open.customer)} />
                  <div>
                    <div className="ord-customer__name">{open.customer}</div>
                    <div className="ord-customer__row"><Phone size={12} /> {open.phone}</div>
                    <div className="ord-customer__row"><MapPin size={12} /> {open.address}</div>
                  </div>
                </div>
              </section>

              <section>
                <div className="ord-block-label">Order details</div>
                <div className="meta-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="meta-item">
                    <div><small>Service</small><ServiceTag s={open.service} /></div>
                  </div>
                  <div className="meta-item">
                    <div><small>Items</small><strong>{open.items}</strong></div>
                  </div>
                  <div className="meta-item">
                    <div><small>Amount</small><strong>GH₵{open.amount.toLocaleString()}</strong></div>
                  </div>
                  <div className="meta-item">
                    <div><small>Payment</small><PayTag p={open.payment} /></div>
                  </div>
                  <div className="meta-item">
                    <div><small>Worker</small><strong>{open.worker}</strong></div>
                  </div>
                  <div className="meta-item">
                    <div><small>Paid to date</small><strong>GH₵{(open.amount_paid || 0).toLocaleString()}</strong></div>
                  </div>
                </div>
                {open.notes ? <p className="ord-notes">{open.notes}</p> : null}
              </section>

              <section>
                <div className="ord-block-label">Workflow stage</div>
                <Timeline order={open} onUpdate={(s) => updateStatus(open.id, s)} canEdit={canEdit} />
              </section>
            </div>

            <div className="ord-drawer__foot">
              <Button variant="secondary" block onClick={() => setOpen(null)}>Close</Button>
              <Button
                variant="primary"
                block
                trailingIcon={<ArrowRight size={15} />}
                disabled={open.status === "completed" || !canEdit}
                onClick={() => canEdit && advance(open)}
              >
                Advance stage
              </Button>
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
};

export default Orders;
