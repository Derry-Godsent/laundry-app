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

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const T = {
  bgBase: "#07090e", bgSurface: "#0c0f18", bgRaised: "#111520", bgElevated: "#161c2c",
  borderFaint: "rgba(255,255,255,0.05)", borderSoft: "rgba(255,255,255,0.09)", borderMid: "rgba(255,255,255,0.15)",
  textPrimary: "#edf0f8", textSec: "#9aa3b5", textTert: "#556070", textHint: "#2e3a4e",
  accent: "#6c72f3", accentDim: "rgba(108,114,243,0.13)", accentBord: "rgba(108,114,243,0.28)",
  gold: "#dba96a", goldDim: "rgba(219,169,106,0.1)", goldBord: "rgba(219,169,106,0.22)",
  emerald: "#34d399", emeraldDim: "rgba(52,211,153,0.1)", emeraldBord: "rgba(52,211,153,0.2)",
  danger: "#f87171", dangerDim: "rgba(248,113,113,0.1)", dangerBord: "rgba(248,113,113,0.25)",
};

const FONT = "'DM Sans', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', 'Fira Mono', ui-monospace, monospace";
const CHART_COLORS = [T.accent, T.emerald, T.gold, "#22d3ee", "#a78bfa", "#f87171"];

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export const Reports = () => {
  const location = useLocation();
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: T.textTert, fontFamily: FONT, background: T.bgBase }}>
        <RefreshCw size={20} style={{ marginRight: 12, animation: "spin 1s linear infinite" }} /> Loading reports...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!canView) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: T.textTert, fontFamily: FONT, background: T.bgBase }}>
        <AlertCircle size={20} style={{ marginRight: 12 }} /> Access denied.
      </div>
    );
  }

  return (
    <PermissionGuard>
      <div style={{ padding: "28px 32px", maxWidth: 1600, margin: "0 auto", fontFamily: FONT, color: T.textPrimary, minHeight: "100vh", background: T.bgBase }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>Business Intelligence</h2>
            <p style={{ fontSize: 13, color: T.textTert, marginTop: 4 }}>Comprehensive overview of revenue, expenses, growth, and clientele.</p>
          </div>
          <div style={{ display: "flex", gap: 4, background: T.bgRaised, padding: 4, borderRadius: 10, border: `1px solid ${T.borderSoft}` }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28 }}>
              <KPICard title="Total Revenue" value={`₵${data.totalRevenue.toLocaleString()}`} icon={<DollarSign size={18} />} color={T.emerald} growth={data.revenueGrowth} />
              <KPICard title="Net Profit" value={`₵${data.netProfit.toLocaleString()}`} icon={<Target size={18} />} color={T.accent} sub={`Expenses: ₵${data.totalExpenses.toLocaleString()}`} />
              <KPICard title="Total Orders" value={data.totalOrders.toLocaleString()} icon={<Package size={18} />} color={T.gold} sub={`AOV: ₵${data.totalOrders > 0 ? Math.round(data.totalRevenue / data.totalOrders) : 0}`} />
              <KPICard title="Clientele" value={data.totalClients.toLocaleString()} icon={<Users size={18} />} color="#22d3ee" sub={`${data.newClients} new this period`} />
              <KPICard title="Outstanding Balance" value={`${data.outstandingBalance.toLocaleString()}`} icon={<AlertCircle size={18} />} color={T.danger} />
            </div>

            {/* CHARTS ROW 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              <div className="report-card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Revenue vs Expenses (Daily)</h3>
                <ResponsiveContainer width="100%" height={320}>
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

              <div className="report-card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Busiest Days</h3>
                <ResponsiveContainer width="100%" height={320}>
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

            {/* CHARTS ROW 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div className="report-card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Service Revenue Mix</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={data.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {data.pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textPrimary, fontFamily: FONT }} formatter={(value: any) => `₵${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
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
        .report-card { background: ${T.bgRaised}; border: 1px solid ${T.borderSoft}; border-radius: 14px; padding: 20px; transition: border-color 0.2s; }
        .report-card:hover { border-color: ${T.borderMid}; }
      `}</style>
    </PermissionGuard>
  );
};

/* ─── SUB-COMPONENTS ────────────────────────────────────────── */
function KPICard({ title, value, icon, color, sub, growth }: { title: string; value: string | number; icon: React.ReactNode; color: string; sub?: string; growth?: number }) {
  return (
    <div className="report-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
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