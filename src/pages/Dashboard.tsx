import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import {
  Shield, Package, Users, FileText, DollarSign,
  RefreshCw, Plus, ArrowRight, AlertCircle,
  BarChart3, TrendingUp, CheckCircle2, Clock,
  Inbox, Settings, Receipt, ClipboardList
} from "lucide-react";
import "./Dashboard.css";

// ✅ Added permission imports
import { usePermission } from "../hooks/usePermission";
import { PermissionGuard } from "../components/PermissionGuard";

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

function useCountUp(target: number, duration = 1200, delay = 0) {
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

function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 6) - 3}`);
  const path = `M ${pts.join(" L ")}`;
  const area = `M ${pts[0]} L ${pts.join(" L ")} L ${w},${h} L 0,${h} Z`;
  const gradId = `sg-${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="sparkline" fill="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

function AreaChart({ data, timeRange }: { data: ChartPoint[]; timeRange: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, [data]);

  if (!data.length) {
    return (
      <div className="chart-empty-state">
        <BarChart3 size={32} />
        <span>No data for this period</span>
      </div>
    );
  }

  const W = 600, H = 200;
  const max = Math.max(...data.map(d => d.value), 1);
  const pad = { t: 44, b: 28, l: 8, r: 8 };
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

  const showEvery = Math.max(1, Math.floor(data.length / 7));
  const TOOLTIP_H = 26, TOOLTIP_W = 80;
  const getTooltipY = (pointY: number) =>
    pointY - TOOLTIP_H - 10 < pad.t ? pointY + 14 : pointY - TOOLTIP_H - 10;

  return (
    <div className="area-chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className={`area-svg ${animated ? "animated" : ""}`}
        onMouseLeave={() => setHovered(null)}
        style={{ overflow: "visible" }}
        role="img"
        aria-label={`Order volume chart for the last ${timeRange}`}
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6c72f3" stopOpacity="0.22" />
            <stop offset="80%" stopColor="#6c72f3" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="chartClip">
            <rect x={pad.l} y={pad.t} width={cw} height={ch} />
          </clipPath>
        </defs>

        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f}
            x1={pad.l} y1={pad.t + ch - f * ch}
            x2={W - pad.r} y2={pad.t + ch - f * ch}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#chartGrad)" clipPath="url(#chartClip)" className="chart-area-path" />
        <path d={linePath} fill="none" stroke="#6c72f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          clipPath="url(#chartClip)" className="chart-line-path" filter="url(#glow)" />

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
                stroke="rgba(108,114,243,0.3)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={p.x} cy={p.y} r="5" fill="#6c72f3" />
              <circle cx={p.x} cy={p.y} r="9" fill="rgba(108,114,243,0.18)" />
              <rect x={tipX} y={tipY} width={TOOLTIP_W} height={TOOLTIP_H} rx={6}
                fill="#1a1f35" stroke="rgba(108,114,243,0.45)" strokeWidth="1" />
              <text x={tipX + TOOLTIP_W / 2} y={tipY + 10} textAnchor="middle"
                fill="#9aa3b5" fontSize="9" fontWeight="500">{p.label}</text>
              <text x={tipX + TOOLTIP_W / 2} y={tipY + 21} textAnchor="middle"
                fill="#edf0f8" fontSize="11" fontWeight="700">{p.value} order{p.value !== 1 ? "s" : ""}</text>
            </>
          );
        })()}

        {pts.filter((_, i) => i % showEvery === 0 || i === pts.length - 1).map(p => (
          <text key={p.i} x={p.x} y={H - 6} textAnchor="middle" fill="#3a4460" fontSize="10">{p.label}</text>
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
      {arcs.map((a, i) => (
        <circle key={i} cx={cx} cy={cy} r={R}
          fill="none" stroke={a.color} strokeWidth={stroke}
          strokeDasharray={a.dashArray} strokeDashoffset={a.dashOffset}
          className="donut-arc" style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
      <circle cx={cx} cy={cy} r={R - stroke / 2 - 1} fill="#0c0f18" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#edf0f8" fontSize="18" fontWeight="800">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#556070" fontSize="9" fontWeight="600" letterSpacing="1">
        TOTAL
      </text>
    </svg>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta?: number;
  deltaLabel?: string;
  icon: React.ReactNode;
  accent: string;
  sparkData?: number[];
  delay?: number;
  decimals?: number;
}

function StatCard({ label, value, prefix = "", suffix = "", delta, deltaLabel, icon, accent, sparkData, delay = 0, decimals = 0 }: StatCardProps) {
  const counted = useCountUp(Math.round(value), 1000, delay);
  const isUp = delta === undefined ? true : delta >= 0;

  return (
    <div className="stat-card-new" style={{ "--accent": accent } as React.CSSProperties}>
      <div className="sc-glow" style={{ background: accent }} />
      <div className="sc-top">
        <div className="sc-icon-lucide" style={{ color: accent }}>{icon}</div>
        {delta !== undefined && (
          <div className={`sc-badge ${isUp ? "up" : "dn"}`}>
            <span>{isUp ? "↑" : "↓"}</span>
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div className="sc-label">{label}</div>
      <div className="sc-value">
        {prefix}
        {decimals > 0 ? counted.toFixed(decimals) : counted.toLocaleString()}
        {suffix}
      </div>
      {deltaLabel && <div className="sc-sub">{deltaLabel}</div>}
      {sparkData && <div className="sc-spark"><Sparkline data={sparkData} color={accent} /></div>}
      <div className="sc-bar-track"><div className="sc-bar-fill" style={{ background: accent }} /></div>
    </div>
  );
}

function LiveBar({ label, value, color, count, delay = 0 }: { label: string; value: number; color: string; count: number; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 300 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="live-bar">
      <div className="lb-head">
        <span className="lb-label">{label}</span>
        <div className="lb-right">
          <span className="lb-count">{count}</span>
          <span className="lb-pct">{value}%</span>
        </div>
      </div>
      <div className="lb-track">
        <div className="lb-fill" style={{ width: `${width}%`, background: color }} />
        <div className="lb-shine" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ActivityItem({ text, time, meta, type, index }: Activity & { index: number }) {
  const colors: Record<string, string> = {
    success: "#34d399",
    warning: "#dba96a",
    info: "#6c72f3",
    danger: "#f87171",
  };
  return (
    <div className="act-item" style={{ animationDelay: `${index * 0.07}s` }}>
      <div className="act-pip" style={{ background: colors[type] ?? colors.info }}>
        <div className="act-pip-ring" style={{ borderColor: colors[type] ?? colors.info }} />
      </div>
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
  
  // ✅ Get permission state for this specific page
  const { canEdit } = usePermission(location.pathname);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [now] = useState(new Date());

  const [metrics, setMetrics] = useState<Metrics>({
    totalOrders: 0, todayOrders: 0, yesterdayOrders: 0,
    inProgress: 0, pendingReview: 0, revenueToday: 0, revenueYesterday: 0,
    completed: 0, completedYesterday: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStage[]>([
    { label: "Received & Sorted", key: "Pending", value: 0, count: 0, color: "#6c72f3" },
    { label: "Washing", key: "Washing", value: 0, count: 0, color: "#22d3ee" },
    { label: "Ironing", key: "Ironing", value: 0, count: 0, color: "#dba96a" },
    { label: "Ready for Delivery", key: "Ready", value: 0, count: 0, color: "#34d399" },
    { label: "Delivered", key: "Delivered", value: 0, count: 0, color: "#a78bfa" },
  ]);
  const [services, setServices] = useState<ServiceSegment[]>([
    { label: "Laundry", value: 42, color: "#6c72f3" },
    { label: "Cleaning", value: 28, color: "#22d3ee" },
    { label: "Fumigation", value: 18, color: "#dba96a" },
    { label: "Car Detail", value: 12, color: "#34d399" },
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
        const colors = ["#6c72f3", "#22d3ee", "#dba96a", "#34d399", "#a78bfa"];
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

  const statCards = useMemo(() => [
    {
      label: "Total Orders",
      value: metrics.totalOrders,
      icon: <ClipboardList size={22} />,
      accent: "#6c72f3",
      delta: delta(metrics.todayOrders, metrics.yesterdayOrders),
      deltaLabel: `${metrics.todayOrders} today`,
      sparkData: sparklines.orders,
      delay: 0,
    },
    {
      label: "In Progress",
      value: metrics.inProgress,
      icon: <Clock size={22} />,
      accent: "#22d3ee",
      delta: 0,
      deltaLabel: `${metrics.pendingReview} pending review`,
      sparkData: sparklines.orders?.map(v => Math.floor(v * 0.4)),
      delay: 80,
    },
    {
      label: "Completed Today",
      value: metrics.completed,
      icon: <CheckCircle2 size={22} />,
      accent: "#34d399",
      delta: delta(metrics.completed, metrics.completedYesterday),
      deltaLabel: "vs yesterday",
      sparkData: sparklines.completed,
      delay: 160,
    },
    {
      label: "Revenue Today",
      value: metrics.revenueToday,
      prefix: "₵",
      icon: <DollarSign size={22} />,
      accent: "#dba96a",
      delta: delta(metrics.revenueToday, metrics.revenueYesterday),
      deltaLabel: `${fmt(metrics.revenueToday - metrics.revenueYesterday)} vs yesterday`,
      sparkData: sparklines.revenue,
      delay: 240,
    },
  ], [metrics, sparklines, delta, fmt]);

  const quickActions = useMemo(() => [
    { icon: <ClipboardList size={20} />, label: "New Order", color: "#6c72f3", path: "/new-order" },
    { icon: <Users size={20} />, label: "Add Client", color: "#22d3ee", path: "/clients" },
    { icon: <Receipt size={20} />, label: "Receipts", color: "#dba96a", path: "/receipt" },
    { icon: <BarChart3 size={20} />, label: "Reports", color: "#34d399", path: "/reports" },
    { icon: <Shield size={20} />, label: "Staff", color: "#a78bfa", path: "/staff" },
    { icon: <Settings size={20} />, label: "Settings", color: "#f87171", path: "/settings" },
  ], []);

  if (loading) {
    return (
      <div className="dash-loader">
        <div className="loader-ring">
          <div className="loader-inner">
            <span className="loader-icon">◈</span>
          </div>
        </div>
        <p className="loader-text">Loading Chapman Operations</p>
        <p className="loader-sub">Syncing live data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash">
        <div className="dash-grid-bg" aria-hidden />
        <div className="dash-error">
          <AlertCircle size={48} className="dash-error-icon" />
          <div className="dash-error-title">Unable to load dashboard</div>
          <div className="dash-error-text">{error}</div>
          <button className="dash-error-retry" onClick={() => fetchData(true)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <div className="dash-grid-bg" aria-hidden />

      <header className="dash-header">
        <div className="dh-left">
          <div className="dh-eyebrow">
            <span className="live-dot" />
            <span>Live Operations</span>
          </div>
          <h1 className="dh-title">Chapman Prestige</h1>
          <p className="dh-sub">
            {now.toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="dh-right">
          <button
            className={`refresh-btn ${refreshing ? "spinning" : ""}`}
            onClick={() => fetchData(true)}
            title="Refresh"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw size={18} />
          </button>
          <div className="time-toggle">
            {(["week", "month", "year"] as const).map(r => (
              <button
                key={r}
                className={`tt-btn ${timeRange === r ? "active" : ""}`}
                onClick={() => setTimeRange(r)}
                aria-pressed={timeRange === r}
              >
                {r === "week" ? "7D" : r === "month" ? "30D" : "1Y"}
              </button>
            ))}
          </div>
          
          {/* ✅ Only show "New Order" button if user has edit access */}
          {canEdit && (
            <button className="btn-action" onClick={() => navigate("/new-order")}>
              <Plus size={16} />
              New Order
            </button>
          )}
        </div>
      </header>

      {/* ✅ Wrap main content in PermissionGuard to show "View-only" banner if needed */}
      <PermissionGuard>
        <section className="kpi-row">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </section>

        <section className="mid-grid">
          <div className="panel chart-panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">Order Volume</div>
                <div className="panel-sub">
                  {chartData.reduce((s, d) => s + d.value, 0)} orders in the last {timeRange === "week" ? "7 days" : timeRange === "month" ? "30 days" : "year"}
                </div>
              </div>
            </div>
            <AreaChart data={chartData} timeRange={timeRange} />
          </div>

          <div className="panel donut-panel">
            <div className="panel-head">
              <div className="panel-title">Service Mix</div>
              <div className="panel-sub">By order volume</div>
            </div>
            <div className="donut-wrap">
              <DonutChart segments={services} />
            </div>
            <div className="donut-legend">
              {services.map((s, i) => (
                <div key={s.label} className="dl-row">
                  <span className="dl-dot" style={{ background: s.color }} />
                  <span className="dl-name">{s.label}</span>
                  <span className="dl-val">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bot-grid">
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Live Workflow</div>
              <div className="panel-sub">Real-time stage distribution</div>
            </div>
            <div className="workflow-list">
              {workflow.map((s, i) => (
                <LiveBar key={s.key} label={s.label} value={s.value} count={s.count} color={s.color} delay={i * 80} />
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Activity Feed</div>
              <button className="panel-link" onClick={() => navigate("/orders")}>
                View all <ArrowRight size={14} />
              </button>
            </div>
            <div className="act-list">
              {activities.length === 0 && (
                <div className="act-empty-state">
                  <Inbox size={32} />
                  <span>No recent activity</span>
                </div>
              )}
              {activities.map((a, i) => (
                <ActivityItem key={i} {...a} index={i} />
              ))}
            </div>
          </div>

          <div className="panel qa-panel">
            <div className="panel-head">
              <div className="panel-title">Quick Actions</div>
            </div>
            <div className="qa-grid">
              {quickActions.map((a) => {
                // ✅ Hide creation/editing actions if user only has view access
                if ((a.label === "New Order" || a.label === "Add Client") && !canEdit) return null;
                
                return (
                  <button
                    key={a.label}
                    className="qa-btn"
                    style={{ "--qa-color": a.color } as React.CSSProperties}
                    onClick={() => navigate(a.path)}
                  >
                    <div className="qa-icon-lucide" style={{ color: a.color }}>{a.icon}</div>
                    <span className="qa-label">{a.label}</span>
                    <div className="qa-arrow">
                      <ArrowRight size={14} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </PermissionGuard>
    </div>
  );
};

export default Dashboard;