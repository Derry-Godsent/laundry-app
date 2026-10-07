import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Shield, Package, Users, FileText, DollarSign,
  RefreshCw, Plus, ArrowRight, AlertCircle,
  BarChart3, CheckCircle2, Clock,
  Inbox, Settings, Receipt, ClipboardList
} from "lucide-react";
import "./Dashboard.css";

/* Added permission imports */
import { usePermission } from "../hooks/usePermission";
import { PermissionGuard } from "../components/PermissionGuard";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  SegmentedControl,
  Sparkline,
  StatTile,
} from "../components/ui";

import type { Session } from "@supabase/supabase-js";

interface Order {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  amount_paid: number;
  clients?: { name: string };
}

interface OrderItem {
  service_id: string;
  quantity: number;
  services?: { name: string; category: string };
}

interface Activity {
  text: string;
  time: string;
  meta: string;
  type: "success" | "warning" | "info" | "danger";
}

interface WorkflowStage {
  label: string;
  key: string;
  value: number;
  count: number;
  color: string;
}

interface ServiceSegment {
  label: string;
  value: number;
  color: string;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface Metrics {
  totalOrders: number;
  todayOrders: number;
  yesterdayOrders: number;
  inProgress: number;
  pendingReview: number;
  revenueToday: number;
  revenueYesterday: number;
  completed: number;
  completedYesterday: number;
}

type TimeRange = "week" | "month" | "year";

const RANGE_LABEL: Record<TimeRange, string> = {
  week: "last 7 days",
  month: "last 30 days",
  year: "last 12 months",
};

function useCountUp(target: number, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const timeout = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(step);
        else setValue(target);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

/**
 * The width of a box, measured rather than guessed.
 *
 * The chart is drawn in the units of its own box. Scaling a 600-unit drawing
 * down to a phone made its axis labels a few pixels tall, which is worse than
 * no labels at all; measuring keeps text at the size it was written.
 */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      setWidth((prev) => (Math.abs(prev - next) > 1 ? next : prev));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

function AreaChart({ data, timeRange }: { data: ChartPoint[]; timeRange: TimeRange }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: wrapRef, width } = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, [data]);

  if (!data.length) {
    return (
      <EmptyState
        icon={<BarChart3 size={22} />}
        title="No orders in this period"
        message="Once the office records orders, the volume trend appears here."
      />
    );
  }

  /* Drawn at the measured width, clamped, so it is never scaled to illegible
     text on a phone nor blown up to silly text on a wide desk. */
  const W = Math.round(Math.min(Math.max(width || 600, 280), 900));
  const H = W < 420 ? 170 : 200;
  const max = Math.max(...data.map(d => d.value), 1);
  const pad = { t: W < 420 ? 18 : 44, b: 28, l: 8, r: 8 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const pts = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * cw,
    y: pad.t + ch - (d.value / max) * ch,
    label: d.label,
    value: d.value,
    i,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${H - pad.b} L ${pts[0].x},${H - pad.b} Z`;

  /* One label per ~58px, so they never collide at any width. */
  const perRow = Math.max(2, Math.floor(cw / 58));
  const showEvery = Math.max(1, Math.ceil(data.length / perRow));
  const TOOLTIP_H = 26, TOOLTIP_W = 86;
  const getTooltipY = (pointY: number) =>
    pointY - TOOLTIP_H - 10 < pad.t ? pointY + 14 : pointY - TOOLTIP_H - 10;

  return (
    <div className="area-chart-wrap" ref={wrapRef}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className={`area-svg ${animated ? "animated" : ""}`}
        onMouseLeave={() => setHovered(null)}
        style={{ overflow: "visible" }}
        role="img"
        aria-label={`Order volume chart for the ${RANGE_LABEL[timeRange]}`}
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.26" />
            <stop offset="85%" stopColor="var(--brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f}
            x1={pad.l} y1={pad.t + ch - f * ch}
            x2={W - pad.r} y2={pad.t + ch - f * ch}
            stroke="rgba(255,255,255,0.045)" strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#chartGrad)" className="chart-area-path" />
        <path d={linePath} fill="none" stroke="var(--brand-500)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="chart-line-path" />

        {pts.map((p, idx) => {
          const x0 = idx === 0 ? pad.l : (pts[idx - 1].x + p.x) / 2;
          const x1 = idx === pts.length - 1 ? pad.l + cw : (p.x + pts[idx + 1].x) / 2;
          return (
            <rect key={p.i}
              x={x0} y={pad.t}
              width={x1 - x0} height={ch}
              fill="transparent"
              className="chart-hover-zone"
              onMouseEnter={() => setHovered(p.i)}
            />
          );
        })}

        {hovered !== null && pts[hovered] && (() => {
          const p = pts[hovered];
          const tipY = getTooltipY(p.y);
          const tipX = Math.min(Math.max(p.x - TOOLTIP_W / 2, pad.l), pad.l + cw - TOOLTIP_W);
          return (
            <>
              <line x1={p.x} y1={pad.t} x2={p.x} y2={H - pad.b}
                stroke="rgba(111,119,247,0.35)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={p.x} cy={p.y} r="5" fill="var(--brand-500)" />
              <circle cx={p.x} cy={p.y} r="9" fill="rgba(111,119,247,0.18)" />
              <rect x={tipX} y={tipY} width={TOOLTIP_W} height={TOOLTIP_H} rx={6}
                fill="var(--ink-hover)" stroke="rgba(111,119,247,0.45)" strokeWidth="1" />
              <text x={tipX + TOOLTIP_W / 2} y={tipY + 10} textAnchor="middle"
                fill="var(--text-3)" fontSize="9" fontWeight="500">{p.label}</text>
              <text x={tipX + TOOLTIP_W / 2} y={tipY + 21} textAnchor="middle"
                fill="var(--text-1)" fontSize="11" fontWeight="700">{p.value} order{p.value !== 1 ? "s" : ""}</text>
            </>
          );
        })()}

        {pts.filter((_, i) => i % showEvery === 0 || i === pts.length - 1).map(p => (
          <text key={p.i} x={p.x} y={H - 6} textAnchor="middle" fill="var(--text-4)" fontSize="10">{p.label}</text>
        ))}
      </svg>
    </div>
  );
}

function DonutChart({ segments }: { segments: ServiceSegment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 54, cx = 70, cy = 70, stroke = 18;
  let offset = -90;
  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const deg = pct * 360;
    const circ = 2 * Math.PI * R;
    const arc = { ...seg, pct, dashArray: `${(deg / 360) * circ} ${circ}`, dashOffset: -(offset / 360) * circ, offset };
    offset += deg;
    return arc;
  });
  return (
    <svg viewBox="0 0 140 140" className="donut-svg" role="img" aria-label="Service mix distribution">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      {arcs.map((a, i) => (
        <circle key={i} cx={cx} cy={cy} r={R}
          fill="none" stroke={a.color} strokeWidth={stroke}
          strokeDasharray={a.dashArray} strokeDashoffset={a.dashOffset}
          className="donut-arc" style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-1)" fontSize="20" fontWeight="750">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-4)" fontSize="9" fontWeight="600" letterSpacing="1.4">
        ORDERS
      </text>
    </svg>
  );
}

function LiveBar({ label, value, color, count, delay = 0 }: { label: string; value: number; color: string; count: number; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 200 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="live-bar">
      <div className="live-bar__head">
        <span className="live-bar__label">{label}</span>
        <span className="live-bar__right">
          <span className="live-bar__count">{count}</span>
          <span className="live-bar__pct">{value}%</span>
        </span>
      </div>
      <div className="live-bar__track">
        <div className="live-bar__fill" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

function ActivityItem({ text, time, meta, type, index }: Activity & { index: number }) {
  const tone: Record<Activity["type"], string> = {
    success: "var(--ok-500)",
    warning: "var(--warn-500)",
    info: "var(--brand-500)",
    danger: "var(--bad-500)",
  };
  return (
    <div className="act-item" style={{ animationDelay: `${index * 0.05}s` }}>
      <span className="act-pip" style={{ background: tone[type] }} aria-hidden="true" />
      <div className="act-body">
        <div className="act-row">
          <span className="act-text">{text}</span>
          <span className="act-time">{time}</span>
        </div>
        <span className="act-meta">{meta}</span>
      </div>
    </div>
  );
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get permission state for this specific page
  const { canEdit } = usePermission(location.pathname);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [now] = useState(new Date());

  const [metrics, setMetrics] = useState<Metrics>({
    totalOrders: 0, todayOrders: 0, yesterdayOrders: 0,
    inProgress: 0, pendingReview: 0, revenueToday: 0, revenueYesterday: 0,
    completed: 0, completedYesterday: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStage[]>([
    { label: "Received & Sorted", key: "Pending", value: 0, count: 0, color: "#6f77f7" },
    { label: "Washing", key: "Washing", value: 0, count: 0, color: "#62cdff" },
    { label: "Ironing", key: "Ironing", value: 0, count: 0, color: "#e0b473" },
    { label: "Ready for Delivery", key: "Ready", value: 0, count: 0, color: "#3ddc97" },
    { label: "Delivered", key: "Delivered", value: 0, count: 0, color: "#b18cff" },
  ]);
  const [services, setServices] = useState<ServiceSegment[]>([
    { label: "Laundry", value: 42, color: "#6f77f7" },
    { label: "Cleaning", value: 28, color: "#62cdff" },
    { label: "Fumigation", value: 18, color: "#e0b473" },
    { label: "Car Detail", value: 12, color: "#3ddc97" },
  ]);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const yesterdayStart = new Date(now.getTime() - 86400000).toISOString();
      const rangeDays = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365;

      const [{ data: orders }, { count: totalOrders }] = await Promise.all([
        supabase.from("orders").select("*, clients(name)").order("created_at", { ascending: false }).limit(500),
        supabase.from("orders").select("id", { count: "exact", head: true }),
      ]);

      if (!orders) throw new Error("Failed to load orders");

      const todayO = orders.filter((o: Order) => new Date(o.created_at) >= new Date(todayStart));
      const yestO = orders.filter((o: Order) => {
        const d = new Date(o.created_at);
        return d >= new Date(yesterdayStart) && d < new Date(todayStart);
      });
      const completedToday = todayO.filter((o: Order) => o.status === "Delivered").length;
      const completedYest = yestO.filter((o: Order) => o.status === "Delivered").length;

      setMetrics({
        totalOrders: totalOrders ?? 0,
        todayOrders: todayO.length,
        yesterdayOrders: yestO.length,
        inProgress: orders.filter((o: Order) => ["Washing", "Ironing", "Ready"].includes(o.status)).length,
        pendingReview: orders.filter((o: Order) => o.status === "Pending").length,
        revenueToday: todayO.reduce((s: number, o: Order) => s + (Number(o.amount_paid) || 0), 0),
        revenueYesterday: yestO.reduce((s: number, o: Order) => s + (Number(o.amount_paid) || 0), 0),
        completed: completedToday,
        completedYesterday: completedYest,
      });

      const daysMap = new Map<string, ChartPoint>();
      for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split("T")[0];
        const lbl = rangeDays <= 7
          ? d.toLocaleDateString("en-US", { weekday: "short" })
          : rangeDays <= 30
            ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : d.toLocaleDateString("en-US", { month: "short" });
        if (!daysMap.has(key)) daysMap.set(key, { label: lbl, value: 0 });
      }
      orders.forEach((o: Order) => {
        const key = o.created_at.split("T")[0];
        const entry = daysMap.get(key);
        if (entry) entry.value++;
      });
      setChartData(Array.from(daysMap.values()));

      const last10: Record<string, number[]> = { orders: [], revenue: [], completed: [] };
      for (let i = 9; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split("T")[0];
        const dayOrders = orders.filter((o: Order) => o.created_at.startsWith(key));
        last10.orders.push(dayOrders.length);
        last10.revenue.push(dayOrders.reduce((s: number, o: Order) => s + (Number(o.amount_paid) || 0), 0));
        last10.completed.push(dayOrders.filter((o: Order) => o.status === "Delivered").length);
      }
      setSparklines(last10);

      const total = Math.max(orders.length, 1);
      const counts: Record<string, number> = orders.reduce((a: Record<string, number>, o: Order) => {
        a[o.status] = (a[o.status] || 0) + 1;
        return a;
      }, {});
      setWorkflow(prev => prev.map(s => ({
        ...s,
        count: counts[s.key] || 0,
        value: Math.round(((counts[s.key] || 0) / total) * 100),
      })));

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("service_id, quantity, services(name, category)")
        .limit(500);

      const items = orderItems || [];

      if (items.length > 0) {
        const serviceCounts: Record<string, number> = {};
        items.forEach((item: OrderItem) => {
          const cat = item.services?.category || "Other";
          serviceCounts[cat] = (serviceCounts[cat] || 0) + (item.quantity || 1);
        });
        const colors = ["#6f77f7", "#62cdff", "#e0b473", "#3ddc97", "#b18cff"];
        const totalSvc = Object.values(serviceCounts).reduce((a, b) => a + b, 0) || 1;
        setServices(Object.entries(serviceCounts).slice(0, 4).map(([label, value], i) => ({
          label,
          value: Math.round(((value as number) / totalSvc) * 100),
          color: colors[i % colors.length],
        })));
      }

      setActivities(orders.slice(0, 8).map((o: Order) => ({
        text: `Order ${o.order_id || "#???"}`,
        time: new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: o.status === "Delivered" ? "success" : o.status === "Pending" ? "info" : o.status === "Cancelled" ? "danger" : "warning",
        meta: `${o.status} · ${o.clients?.name || "Walk-in"}`,
      })));

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, now]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fmt = useCallback((v: number) => {
    return `₵${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, []);

  const delta = useCallback((a: number, b: number) => {
    return b === 0 ? 0 : Math.round(((a - b) / b) * 100);
  }, []);

  /* Counters animate once, at the top of the component, so the numbers in the
     tiles never re-trigger a hook from inside a memo. */
  const countedTotal = useCountUp(metrics.totalOrders, 900, 0);
  const countedInProgress = useCountUp(metrics.inProgress, 900, 60);
  const countedCompleted = useCountUp(metrics.completed, 900, 120);
  const countedRevenue = useCountUp(Math.round(metrics.revenueToday), 900, 180);

  const statCards = useMemo<Array<{
    label: string;
    role?: "hero" | "standard" | "compact" | "split";
    value: ReactNode;
    icon: ReactNode;
    accent: string;
    delta?: { value: number; label?: string };
    meta?: ReactNode;
    sparkline?: ReactNode;
  }>>(() => [
    {
      label: "Total Orders",
      value: countedTotal.toLocaleString(),
      icon: <ClipboardList size={19} />,
      accent: "var(--brand-500)",
      role: "hero" as const,
      meta: `${metrics.todayOrders} recorded today, ${delta(metrics.todayOrders, metrics.yesterdayOrders)}% against yesterday`,
      sparkline: <Sparkline data={sparklines.orders ?? []} color="var(--brand-500)" />,
    },
    {
      label: "In Progress",
      value: countedInProgress.toLocaleString(),
      icon: <Clock size={19} />,
      accent: "var(--info-500)",
      meta: <span>{metrics.pendingReview} still awaiting review</span>,
      sparkline: <Sparkline data={(sparklines.orders ?? []).map(v => Math.floor(v * 0.4))} color="var(--info-500)" />,
    },
    {
      label: "Completed Today",
      value: countedCompleted.toLocaleString(),
      icon: <CheckCircle2 size={19} />,
      accent: "var(--ok-500)",
      meta: `${delta(metrics.completed, metrics.completedYesterday)}% against yesterday`,
      sparkline: <Sparkline data={sparklines.completed ?? []} color="var(--ok-500)" />,
    },
    {
      label: "Revenue Today",
      value: `₵${countedRevenue.toLocaleString()}`,
      icon: <DollarSign size={19} />,
      accent: "var(--gold-500)",
      delta: { value: delta(metrics.revenueToday, metrics.revenueYesterday), label: `${fmt(metrics.revenueToday - metrics.revenueYesterday)} against yesterday` },
      sparkline: <Sparkline data={sparklines.revenue ?? []} color="var(--gold-500)" />,
    },
  ], [countedTotal, countedInProgress, countedCompleted, countedRevenue, metrics, sparklines, delta, fmt]);

  const quickActions = useMemo(() => [
    { icon: <ClipboardList size={19} />, label: "New Order", tone: "brand", path: "/new-order", needsEdit: true },
    { icon: <Users size={19} />, label: "Add Client", tone: "info", path: "/clients", needsEdit: true },
    { icon: <Receipt size={19} />, label: "Receipts", tone: "gold", path: "/receipt", needsEdit: false },
    { icon: <Package size={19} />, label: "Mobile Requests", tone: "ok", path: "/mobile-requests", needsEdit: false },
    { icon: <BarChart3 size={19} />, label: "Reports", tone: "info", path: "/reports", needsEdit: false },
    { icon: <Shield size={19} />, label: "Staff", tone: "violet", path: "/staff", needsEdit: false },
    { icon: <FileText size={19} />, label: "Services", tone: "warn", path: "/services", needsEdit: false },
    { icon: <Settings size={19} />, label: "Settings", tone: "neutral", path: "/settings", needsEdit: false },
  ], []);

  /* ── Loading ─────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="page">
        <div className="dash-skeleton-head">
          {/* Percentages with a cap: fixed pixel widths overflowed 320px. */}
          <div className="skeleton" style={{ width: "52%", maxWidth: 200, height: 14 }} />
          <div className="skeleton" style={{ width: "72%", maxWidth: 280, height: 30, marginTop: 12 }} />
          <div className="skeleton" style={{ width: "88%", maxWidth: 340, height: 12, marginTop: 12 }} />
        </div>
        <div className="stat-grid" style={{ marginBottom: "var(--sp-5)" }}>
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 148, borderRadius: "var(--r-lg)" }} />)}
        </div>
        <div className="dash-mid-grid">
          <div className="skeleton" style={{ height: 320, borderRadius: "var(--r-lg)" }} />
          <div className="skeleton" style={{ height: 320, borderRadius: "var(--r-lg)" }} />
        </div>
        <span className="sr-only" role="status">Loading operations data…</span>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="page">
        <Card padded>
          <EmptyState
            icon={<AlertCircle size={22} />}
            title="Unable to load the dashboard"
            message={error}
            action={<Button variant="primary" leadingIcon={<RefreshCw size={15} />} onClick={() => fetchData(true)}>Try again</Button>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={
          <>
            <span className="live-dot" aria-hidden="true" />
            Live operations
          </>
        }
        title="Chapman Prestige"
        subtitle={`${now.toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · every number below is read live from the records the office works on.`}
        actions={
          <>
            <Button
              variant="secondary"
              iconOnly
              onClick={() => fetchData(true)}
              disabled={refreshing}
              aria-label="Refresh dashboard data"
              title="Refresh"
            >
              <RefreshCw size={16} className={refreshing ? "spin" : ""} />
            </Button>
            <SegmentedControl<TimeRange>
              ariaLabel="Chart time range"
              value={timeRange}
              onChange={setTimeRange}
              options={[
                { value: "week", label: "7D" },
                { value: "month", label: "30D" },
                { value: "year", label: "1Y" },
              ]}
            />
            {/* Only show "New Order" if the role may create records */}
            {canEdit && (
              <Button variant="primary" leadingIcon={<Plus size={16} />} onClick={() => navigate("/new-order")}>
                New Order
              </Button>
            )}
          </>
        }
      />

      {/* View-only banner comes from the guard, the cards below stay readable */}
      <PermissionGuard>
        <section className="stat-grid" aria-label="Key figures">
          {statCards.map((card) => (
            <StatTile
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              accent={card.accent}
              role={card.role}
              meta={card.meta}
              sparkline={card.sparkline}
            />
          ))}
        </section>

        <section className="dash-mid-grid">
          <Card className="dash-span-2">
            <CardHeader
              title="Order volume"
              subtitle={`${chartData.reduce((s, d) => s + d.value, 0)} orders created in the ${RANGE_LABEL[timeRange]}`}
            />
            <CardBody>
              <AreaChart data={chartData} timeRange={timeRange} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Service mix" subtitle="Share of items by service category" />
            <CardBody className="dash-donut-body">
              <div className="donut-wrap">
                <DonutChart segments={services} />
              </div>
              <div className="donut-legend">
                {services.map((s) => (
                  <div key={s.label} className="legend-row">
                    <span className="legend-row__dot" style={{ background: s.color }} />
                    <span className="legend-row__name">{s.label}</span>
                    <span className="legend-row__value">{s.value}%</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </section>

        <section className="dash-bot-grid">
          <Card>
            <CardHeader
              title="Live workflow"
              subtitle="Where the work sits right now"
              actions={<Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>Open orders <ArrowRight size={14} /></Button>}
            />
            <CardBody className="workflow-list">
              {workflow.map((s, i) => (
                <LiveBar key={s.key} label={s.label} value={s.value} count={s.count} color={s.color} delay={i * 70} />
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Latest activity"
              subtitle="The newest records as they were entered"
              actions={<Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>View all <ArrowRight size={14} /></Button>}
            />
            <CardBody tight className="act-list">
              {activities.length === 0 ? (
                <EmptyState icon={<Inbox size={20} />} title="No recent activity" message="New orders will appear here the moment they are recorded." />
              ) : (
                activities.map((a, i) => <ActivityItem key={i} {...a} index={i} />)
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick actions" subtitle="The tasks the office repeats most" />
            <CardBody className="qa-grid">
              {quickActions.map((a) => {
                if (a.needsEdit && !canEdit) return null;
                return (
                  <button key={a.label} className={`qa-btn qa-btn--${a.tone}`} onClick={() => navigate(a.path)}>
                    <span className="qa-icon">{a.icon}</span>
                    <span className="qa-label">{a.label}</span>
                    <ArrowRight size={14} className="qa-arrow" />
                  </button>
                );
              })}
            </CardBody>
          </Card>
        </section>
      </PermissionGuard>
    </div>
  );
};
