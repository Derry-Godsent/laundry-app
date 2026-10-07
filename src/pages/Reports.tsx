import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Legend
} from "recharts";
import {
  DollarSign, Users, Package, AlertCircle, RefreshCw, TrendingUp, TrendingDown,
  Calendar, Target, Activity
} from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { usePermission } from "../hooks/usePermission";
import { PermissionGuard } from "../components/PermissionGuard";
import { LoadingRows } from "../components/ui";

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const T = {
  bgBase: "var(--ink-base)", bgSurface: "var(--ink-shell)", bgRaised: "var(--ink-card)", bgElevated: "var(--ink-raised)",
  borderFaint: "var(--line-faint)", borderSoft: "var(--line-soft)", borderMid: "var(--line)",
  textPrimary: "var(--text-1)", textSec: "var(--text-2)", textTert: "var(--text-3)", textHint: "var(--text-4)",
  accent: "var(--brand-500)", accentDim: "var(--brand-soft)", accentBord: "var(--brand-border)",
  gold: "var(--warn-500)", goldDim: "var(--warn-soft)", goldBord: "var(--warn-border)",
  emerald: "var(--ok-500)", emeraldDim: "var(--ok-soft)", emeraldBord: "var(--ok-border)",
  danger: "var(--bad-500)", dangerDim: "var(--bad-soft)", dangerBord: "var(--bad-border)",
};

const FONT = "var(--font-ui)";
const MONO = "var(--font-mono)";
/* Chart series, in the order a legend reads: the accent first, then the three
   states, then two quieter steps. Every one of them is a token, so a chart can
   never drift from the console's palette. */
const CHART_COLORS = [
  "var(--brand-500)", "var(--ok-500)", "var(--warn-500)",
  "var(--info-500)", "var(--brand-400)", "var(--bad-500)",
];

/* Recharts sizes a chart from the props it is given, not from the container's
   CSS: it measures the box, then draws at the width and height it was told. A
   media query that changes only the container's height therefore leaves the
   chart drawn at the taller size, and it paints past the bottom of its card.
   The height is chosen here instead, from the same breakpoint the layout uses,
   so the box and the drawing are always the same size. */
function useNarrowChart(maxWidth = 640) {
  const query = `(max-width: ${maxWidth}px)`;
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(query);
    const onChange = () => setNarrow(mq.matches);
    onChange();
    /* Safari before 14 only carries the older listener API. */
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [query]);
  return narrow;
}

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export const Reports = () => {
  const location = useLocation();
  const narrowChart = useNarrowChart();
  const { canView, loading: permLoading } = usePermission(location.pathname);
  
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "month" | "year">("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

    useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let startDate = new Date();
        let prevStartDate = new Date();
        let prevEndDate = new Date();
        
        if (timeRange === "7d") {
          startDate.setDate(now.getDate() - 7);
          prevStartDate.setDate(startDate.getDate() - 7);
        } else if (timeRange === "30d") {
          startDate.setDate(now.getDate() - 30);
          prevStartDate.setDate(startDate.getDate() - 30);
        } else if (timeRange === "month") {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (timeRange === "year") {
          startDate = new Date(now.getFullYear(), 0, 1);
          prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
          prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
        }

        // FIX 1: Explicitly include the end of the day to capture today's orders
        const startStr = startDate.toISOString().split("T")[0];
        const endStr = `${now.toISOString().split("T")[0]}T23:59:59.999Z`;
        const prevStartStr = prevStartDate.toISOString().split("T")[0];
        const prevEndStr = `${prevEndDate.toISOString().split("T")[0]}T23:59:59.999Z`;

        // FIX 2: Explicitly select columns instead of using "*" to prevent relation errors
        const [{ data: orders, error: ordersError }, { data: prevOrders }, { data: newClients }, { count: totalClients }] = await Promise.all([
          supabase
            .from("orders")
            .select(`
              id, order_id, total_due, amount_paid, created_at,
              clients ( name ),
              order_items ( quantity, unit_price, services ( name ) )
            `)
            .gte("created_at", startStr)
            .lte("created_at", endStr),
            
          supabase
            .from("orders")
            .select("total_due")
            .gte("created_at", prevStartStr)
            .lte("created_at", prevEndStr),
            
          supabase
            .from("clients")
            .select("id, created_at")
            .gte("created_at", startStr)
            .lte("created_at", endStr),
            
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
        ]);

        if (ordersError) {
          console.error("Supabase Orders Error:", ordersError);
        }

        const safeOrders = orders || [];
        const safePrevOrders = prevOrders || [];
        const safeNewClients = newClients || [];

        let totalRevenue = 0;
        let totalOrders = safeOrders.length;
        let outstandingBalance = 0;
        const serviceRevenue: Record<string, number> = {};
        const clientRevenue: Record<string, number> = {};
        const dailyData: Record<string, { date: string; revenue: number; orders: number }> = {};
        const dayOfWeekData: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

        safeOrders.forEach((order: any) => {
          const revenue = Number(order.total_due) || 0;
          const paid = Number(order.amount_paid) || 0;
          totalRevenue += revenue;
          outstandingBalance += Math.max(0, revenue - paid);

          const dateKey = order.created_at.split("T")[0];
          if (!dailyData[dateKey]) dailyData[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
          dailyData[dateKey].revenue += revenue;
          dailyData[dateKey].orders += 1;

          const dayName = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short' });
          if (dayOfWeekData[dayName] !== undefined) dayOfWeekData[dayName] += revenue;

          const clientName = order.clients?.name || "Walk-in";
          clientRevenue[clientName] = (clientRevenue[clientName] || 0) + revenue;

          if (order.order_items) {
            order.order_items.forEach((item: any) => {
              const serviceName = item.services?.name || "Other";
              const itemTotal = (item.quantity || 1) * (item.unit_price || 0);
              serviceRevenue[serviceName] = (serviceRevenue[serviceName] || 0) + itemTotal;
            });
          }
        });

        const prevRevenue = safePrevOrders.reduce((sum: number, o: any) => sum + (Number(o.total_due) || 0), 0);
        const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

        const chartData = Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date));
        const pieData = Object.entries(serviceRevenue).map(([name, value], index) => ({
          name, value, color: CHART_COLORS[index % CHART_COLORS.length]
        }));
        const topClients = Object.entries(clientRevenue)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 5)
          .map(([name, value]) => ({ name, revenue: value }));
        const dowData = Object.entries(dayOfWeekData).map(([name, value]) => ({ name, revenue: value }));

        setData({
          totalRevenue,
          totalExpenses: 0, // Expenses table omitted to prevent crashes if it doesn't exist yet
          netProfit: totalRevenue,
          totalOrders,
          outstandingBalance,
          newClients: safeNewClients.length,
          totalClients: totalClients || 0,
          revenueGrowth,
          chartData,
          pieData,
          topClients,
          dowData
        });
      } catch (err) {
        console.error("Reports fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [timeRange]);

  if (permLoading || loading) {
    return (
      <div style={{ padding: "var(--page-pad-y) var(--page-pad-x)", fontFamily: FONT, background: T.bgBase }}>
        <LoadingRows rows={4} label="Loading reports" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="rp-status" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: T.textTert, fontFamily: FONT, background: T.bgBase }}>
        <AlertCircle size={20} style={{ marginRight: 12 }} /> Access denied.
      </div>
    );
  }

  const chartHeight = narrowChart ? 210 : 320;
  const pieHeight = narrowChart ? 200 : 280;

  return (
    <PermissionGuard>
      <style>{`
        .rp-page { padding: var(--page-pad-y) var(--page-pad-x) var(--page-pad-bottom); min-height: 100%; }
        .rp-status { min-height: 60vh; }

        @media (max-width: 900px) {
          /* Two fixed columns cannot fit a phone: the charts stack. */
          .rp-split, .rp-half { grid-template-columns: minmax(0, 1fr) !important; }
        }

        @media (max-width: 640px) {
          .rp-head { margin-bottom: 18px !important; flex-direction: column; align-items: stretch !important; }
          /* Four range buttons do not fit 320px: they scroll sideways instead
             of pushing the whole page sideways. */
          .rp-range {
            width: 100%;
            overflow-x: auto;
            overscroll-behavior-x: contain;
            scrollbar-width: none;
          }
          .rp-range::-webkit-scrollbar { display: none; }
          .rp-range button { flex: 0 0 auto; min-height: var(--tap-min); }

          .rp-kpis { gap: 10px !important; margin-bottom: 18px !important; }
          .report-card { padding: 15px; border-radius: var(--r-md); }
          /* A 320px-tall chart on a 320px-wide phone is mostly empty space, so
             the height is reduced. It is reduced in JS, by useNarrowChart, and
             not here: a CSS height shrinks the container while the chart inside
             stays drawn at the taller size and paints past the card. */
        }
      `}</style>
      <div className="rp-page" style={{ maxWidth: 1600, margin: "0 auto", fontFamily: FONT, color: T.textPrimary, background: T.bgBase }}>
        <div className="rp-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>Business Intelligence</h2>
            <p style={{ fontSize: 13, color: T.textTert, marginTop: 4 }}>Comprehensive overview of revenue, expenses, growth, and clientele.</p>
          </div>
          <div className="rp-range" style={{ display: "flex", gap: 4, background: T.bgRaised, padding: 4, borderRadius: 10, border: `1px solid ${T.borderSoft}` }}>
            {(["7d", "30d", "month", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: "8px 16px", borderRadius: 7, fontSize: 12.5, fontWeight: 600, fontFamily: FONT,
                  background: timeRange === range ? T.accent : "transparent",
                  color: timeRange === range ? "#fff" : T.textSec,
                  border: "none", cursor: "pointer", transition: "all 0.18s"
                }}
              >
                {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : range === "month" ? "This Month" : "This Year"}
              </button>
            ))}
          </div>
        </div>

        {data && (
          <>
            {/* KPI GRID */}
            <div className="rp-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 16, marginBottom: 28 }}>
              <KPICard title="Total Revenue" value={`GH₵${data.totalRevenue.toLocaleString()}`} icon={<DollarSign size={18} />} color={T.emerald} growth={data.revenueGrowth} />
              <KPICard title="Net Profit" value={`GH₵${data.netProfit.toLocaleString()}`} icon={<Target size={18} />} color={T.accent} sub={`Expenses: GH₵${data.totalExpenses.toLocaleString()}`} />
              <KPICard title="Total Orders" value={data.totalOrders.toLocaleString()} icon={<Package size={18} />} color={T.gold} sub={`AOV: GH₵${data.totalOrders > 0 ? Math.round(data.totalRevenue / data.totalOrders) : 0}`} />
              <KPICard title="Clientele" value={data.totalClients.toLocaleString()} icon={<Users size={18} />} color="var(--info-500)" sub={`${data.newClients} new this period`} />
              <KPICard title="Outstanding Balance" value={`${data.outstandingBalance.toLocaleString()}`} icon={<AlertCircle size={18} />} color={T.danger} />
            </div>

            {/* CHARTS ROW 1 */}
            <div className="rp-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }}>
              <div className="report-card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Revenue vs Expenses (Daily)</h3>
                <div className="rp-chart">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <ComposedChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderFaint} vertical={false} />
                    <XAxis dataKey="date" stroke={T.textTert} fontSize={11} tickFormatter={(str) => str.slice(5)} />
                    <YAxis stroke={T.textTert} fontSize={11} />
                    <Tooltip contentStyle={{ background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textPrimary, fontFamily: FONT }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: T.textSec }} />
                    <Bar dataKey="revenue" fill={T.emerald} radius={[4, 4, 0, 0]} name="Revenue" />
                    <Line type="monotone" dataKey="orders" stroke={T.accent} strokeWidth={2} dot={false} name="Orders" yAxisId="right" />
                  </ComposedChart>
                </ResponsiveContainer>
                </div>
              </div>

              <div className="report-card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Busiest Days</h3>
                <div className="rp-chart">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={data.dowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderFaint} vertical={false} />
                    <XAxis dataKey="name" stroke={T.textTert} fontSize={11} />
                    <YAxis stroke={T.textTert} fontSize={11} />
                    <Tooltip contentStyle={{ background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textPrimary, fontFamily: FONT }} formatter={(value: any) => `${Number(value).toLocaleString()}`} />
                    <Bar dataKey="revenue" fill={T.gold} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* CHARTS ROW 2 */}
            <div className="rp-half" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }}>
              <div className="report-card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Service Revenue Mix</h3>
                <div className="rp-chart">
                <ResponsiveContainer width="100%" height={pieHeight}>
                  <PieChart>
                    <Pie data={data.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {data.pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textPrimary, fontFamily: FONT }} formatter={(value: any) => `GH₵${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
                  {data.pieData.map((entry: any, index: number) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textSec }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="report-card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top 5 Clients</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                        {["Rank", "Client", "Revenue"].map(h => (
                          <th key={h} style={{ padding: "12px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.topClients.length === 0 ? (
                        <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: T.textTert }}>No data</td></tr>
                      ) : (
                        data.topClients.map((client: any, index: number) => (
                          <tr key={client.name} style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
                            <td style={{ padding: "12px 12px", color: T.textSec, fontFamily: MONO }}>#{index + 1}</td>
                            <td style={{ padding: "12px 12px", fontWeight: 600, color: T.textPrimary }}>{client.name}</td>
                            <td style={{ padding: "12px 12px", fontFamily: MONO, color: T.emerald, fontWeight: 600 }}>{client.revenue.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`
        .report-card { background: ${T.bgRaised}; border: 1px solid ${T.borderSoft}; border-radius: 14px; padding: 20px; transition: border-color 0.2s; min-width: 0; }
        /* A chart measures its box in pixels, so the card has to be allowed to
           be narrower than that measurement, and the box must clip whatever
           the chart draws in the moment before it re-measures. Nothing a chart
           draws is allowed to reach the card's edge. */
        .rp-chart { min-width: 0; overflow: hidden; }
        /* A summary tile carries a flat wash of its own accent; a chart card
           under it stays neutral so the figures stand out. */
        .rp-kpi { background: color-mix(in srgb, var(--kpi-accent, var(--brand-500)) 6%, ${T.bgRaised});
          border-color: color-mix(in srgb, var(--kpi-accent, var(--brand-500)) 18%, ${T.borderSoft}); position: relative; overflow: hidden; }
        .rp-kpi::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 3px; background: var(--kpi-accent, var(--brand-500)); }
        .rp-kpi:hover { border-color: color-mix(in srgb, var(--kpi-accent, var(--brand-500)) 45%, ${T.borderMid}); }
        .report-card:hover { border-color: ${T.borderMid}; }
      `}</style>
    </PermissionGuard>
  );
};

/* ─── SUB-COMPONENTS ────────────────────────────────────────── */
function KPICard({ title, value, icon, color, sub, growth }: { title: string; value: string | number; icon: React.ReactNode; color: string; sub?: string; growth?: number }) {
  return (
    <div className="report-card rp-kpi" style={{ display: "flex", flexDirection: "column", gap: 12, "--kpi-accent": color } as React.CSSProperties}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `color-mix(in srgb, ${color} 20%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        {growth !== undefined && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: growth >= 0 ? T.emerald : T.danger, background: growth >= 0 ? T.emeraldDim : T.dangerDim, padding: "2px 8px", borderRadius: 12 }}>
            {growth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 11, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: MONO, color: T.textPrimary }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default Reports;