import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus, X, Search, Phone, MapPin, Shield, Package, ArrowRight,
  Check, ChevronLeft, ChevronRight, RefreshCw, Download, Users,
  UserCheck, TrendingUp, Clock, AlertCircle, WifiOff,
} from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { usePermission } from "../hooks/usePermission";
import { useConnection, isNetworkError } from "../hooks/useConnection"; 
import { PermissionGuard } from "../components/PermissionGuard";
import { LoadingRows } from "../components/ui";

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  const cleanDigits = digits.startsWith('233') ? digits.slice(3) : digits;
  const limited = cleanDigits.slice(0, 10);
  if (limited.length <= 2) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
  return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5)}`;
}

function getCleanPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const cleanDigits = digits.startsWith('233') ? digits.slice(3) : digits;
  const noLeadingZero = cleanDigits.startsWith('0') ? cleanDigits.slice(1) : cleanDigits;
  return `+233${noLeadingZero.slice(0, 9)}`;
}

/* ─── TYPES ──────────────────────────────────────────────────────────────── */
type StaffRole   = "admin" | "staff" | "courier" | "manager" | "strategist";
type StaffStatus = "active" | "onduty" | "offline";

interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  status: StaffStatus;
  activeOrders: number;
  completedOrders: number;
  efficiency: number;
  assignedOrderIds: string[];
  joinedDate: string;
  address?: string;
  is_banned?: boolean;
}

interface NewStaffForm {
  firstName: string;
  lastName: string;
  phone: string;
  role: StaffRole;
  branch: string;
  email: string; 
  password: string;
}

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const ROLE_META: Record<StaffRole, { label: string; color: string; bg: string }> = {
  admin:      { label: "Admin",      color: "var(--brand-500)", bg: "var(--brand-soft)" },
  staff:      { label: "Staff",      color: "var(--ok-500)", bg: "var(--ok-soft)"  },
  courier:    { label: "Courier",    color: "var(--warn-500)", bg: "var(--warn-soft)" },
  manager:    { label: "Manager",    color: "var(--brand-400)", bg: "var(--brand-soft)" },
  strategist: { label: "Strategist", color: "var(--info-500)", bg: "var(--info-soft)"  },
};

const STATUS_META: Record<StaffStatus, { label: string; color: string; next: StaffStatus }> = {
  active:  { label: "Active",   color: "var(--ok-500)", next: "onduty"  },
  onduty:  { label: "On Duty",  color: "var(--warn-500)", next: "offline" },
  offline: { label: "Offline",  color: "var(--text-4)", next: "active"  },
};

const STATUS_CYCLE: StaffStatus[] = ["active", "onduty", "offline"];

/* ─── SUB-COMPONENTS ─────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 900, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const t = setTimeout(() => {
      const step = (ts: number) => {
        if (!startTime) startTime = ts;
        const p = Math.min((ts - startTime) / duration, 1);
        setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
        else setVal(target);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return val;
}

function EfficiencyRing({ value, size = 52, color }: { value: number; size?: number; color: string }) {
  const [anim, setAnim] = useState(0);
  const R = (size - 6) / 2;
  const circ = 2 * Math.PI * R;

  useEffect(() => {
    const t = setTimeout(() => setAnim(value), 200);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="eff-ring">
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={R} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={circ}
        strokeDashoffset={circ - (anim / 100) * circ}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
      />
      <text x={size/2} y={size/2 + 4} textAnchor="middle"
        fill="var(--text-1)" fontSize={size > 48 ? 12 : 11} fontWeight="700"
        fontFamily="var(--font-mono)">
        {value}%
      </text>
    </svg>
  );
}

function Avatar({ name, size = 36, ring }: { name: string; size?: number; ring?: string }) {
  const safeName = name || "U";
  const initials = safeName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  /* One neutral avatar surface: a different hue per person made a staff list
     read as a colour chart, and the hue carried no information. */
  return (
    <div className="stf-av" style={{
      width: size, height: size, minWidth: size,
      background: "var(--ink-active)",
      color: "var(--text-2)",
      fontSize: size < 40 ? 12 : size < 60 ? 15 : 20,
      boxShadow: ring ? `0 0 0 2px ${ring}` : "none",
    }}>{initials}</div>
  );
}

function RoleBadge({ role }: { role: StaffRole }) {
  const m = ROLE_META[role] || { label: role || "Staff", color: "var(--text-2)", bg: "var(--ink-raised)" };
  return <span className="role-badge" style={{ color: m.color, background: m.bg, borderColor: m.color + "35" }}>{m.label}</span>;
}

function StatusChip({ status, onClick, canEdit }: { status: StaffStatus; onClick?: (e?: any) => void; canEdit?: boolean }) {
  const m = STATUS_META[status] || { label: status || "Unknown", color: "var(--text-2)", next: "active" as StaffStatus };
  const nextMeta = STATUS_META[m.next];
  return (
    <button 
      className="status-chip" 
      style={{ 
        color: m.color, 
        borderColor: m.color + "40", 
        background: m.color + "12",
        opacity: canEdit === false ? 0.6 : 1,
        cursor: canEdit === false ? "not-allowed" : "pointer"
      }}
      onClick={(e) => canEdit && onClick?.(e)} 
      title={canEdit ? `Click to set to ${nextMeta?.label || "Active"}` : "View only"}
    >
      <span className="sc-dot" style={{ background: m.color }} />
      {m.label}
    </button>
  );
}

function KpiCard({ label, value, of, unit, icon, accent, sub, delay = 0 }: {
  label: string; value: number; icon: JSX.Element;
  accent: string; sub?: string; delay?: number;
  /** The whole this figure is part of. The bar only exists when there is one. */
  of?: number;
  /** What the denominator counts, for the bar's tooltip: "12 staff". */
  unit?: string;
}) {
  const counted = useCountUp(value, 900, delay);
  const share = typeof of === "number" && of > 0 ? Math.min(1, value / of) : null;
  return (
    <div className="kpi" style={{ "--kpi-accent": accent, animationDelay: `${delay}ms` } as any}>
      <div className="kpi-top">
        <div className="kpi-ico" style={{ background: accent + "18", color: accent }}>{icon}</div>
      </div>
      <div className="kpi-lbl">{label}</div>
      <div className="kpi-val">{counted}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {share !== null && (
        <div className="kpi-bar" title={`${value} of ${of} ${unit ?? ""}`.trim()} role="img"
             aria-label={`${value} of ${of} ${unit ?? ""}`.trim()}>
          <div className="kpi-bar-fill" style={{ width: `${Math.round(share * 100)}%`, background: accent }} />
        </div>
      )}
    </div>
  );
}

function EffBar({ value, color }: { value: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 300); return () => clearTimeout(t); }, [value]);
  return (
    <div className="eff-wrap">
      <span className="eff-num" style={{ color }}>{value}%</span>
      <div className="eff-track">
        <div className="eff-fill" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  );
}

/* ─── TOAST COMPONENT ────────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{ 
      position: "fixed", bottom: 24, right: 24, zIndex: 10000, 
      background: type === 'error' ? "var(--bad-soft)" : "var(--ok-soft)", 
      border: `1px solid ${type === 'error' ? "var(--bad-soft)" : "var(--ok-soft)"}`, 
      borderRadius: 10, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, 
      boxShadow: "var(--shadow-modal)", animation: "sfFadeUp 0.3s ease both" 
    }}>
      <span style={{ fontSize: "var(--fs-md)", color: type === 'error' ? "var(--bad-500)" : "var(--ok-500)", fontWeight: 500, fontFamily: "var(--font-ui)" }}>
        {msg}
      </span>
      <button onClick={onClose} style={{ padding: 4, background: "transparent", border: "none", color: "var(--text-4)", cursor: "pointer" }}>
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export const Staff = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [staff, setStaff]         = useState<StaffMember[]>([]);
  const [loading, setLoading]     = useState(true);
  /* The shell reports the connection on every page; this page no longer
     carries its own banner for it. */
  const { isOffline, retry: retryConnection } = useConnection();
  const [roleFilter, setRoleFilter]     = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ]                 = useState("");
  const [pg, setPg]               = useState(1);
  const [pp, setPp]               = useState(10);
  const [openStaff, setOpenStaff] = useState<StaffMember | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<NewStaffForm>({
    firstName: "", lastName: "", phone: "", role: "staff", branch: "Chapman Prestige Limited - Kumasi",
    email: "", password: "",
  }); 
  const [formErr, setFormErr]     = useState<Partial<NewStaffForm>>({});
  const [toast, setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { permission, loading: permLoading, canEdit } = usePermission(location.pathname);

  const fetchStaff = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Supabase staff fetch error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const mapped = data.map((s: any): StaffMember => ({
          id:               s.id ?? s.staff_id,
          name:             `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.name,
          role:             (s.role ?? "staff").toLowerCase() as StaffRole,
          phone:            s.phone ?? s.phone_number ?? "",
          status:           (s.status ?? "active").toLowerCase() as StaffStatus,
          activeOrders:     s.active_orders ?? 0,
          completedOrders:  s.completed_orders ?? 0,
          efficiency:       s.efficiency ?? Math.floor(Math.random() * 20) + 80,
          assignedOrderIds: s.assigned_order_ids ?? [],
          joinedDate:       s.joined_date ?? new Date(s.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          address:          s.address ?? "",
          is_banned:        s.is_banned ?? false, 
        }));
        setStaff(mapped);
      }
    } catch (err) {
      console.error('Staff fetch error:', err);
      if (isNetworkError(err)) retryConnection();
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [retryConnection]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setOpenStaff(null); setModalOpen(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setModalOpen(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const filtered = useMemo(() => staff.filter(s => {
    if (roleFilter   !== "all" && s.role   !== roleFilter)   return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (q) { 
      const lq = q.toLowerCase(); 
      if (!s.name.toLowerCase().includes(lq) && !s.id.toLowerCase().includes(lq)) return false; 
    }
    return true;
  }), [staff, roleFilter, statusFilter, q]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / pp));
  const paged    = filtered.slice((pg - 1) * pp, pg * pp);

  const stats = useMemo(() => ({
    total:      staff.length,
    active:     staff.filter(s => s.status === "active").length,
    onDuty:     staff.filter(s => s.status === "onduty").length,
    offline:    staff.filter(s => s.status === "offline").length,
    avgEff:     (() => {
      if (staff.length === 0) return 0;
      const total = staff.reduce((a, s) => a + (s.efficiency || 0), 0);
      return Math.round(total / staff.length);
    })(),
    totalAssigned: staff.reduce((a, s) => a + s.activeOrders, 0),
  }), [staff]);

  const toggleStatus = useCallback(async (id: string) => {
    if (!canEdit) return;
    const current = staff.find(s => s.id === id);
    if (!current) return;

    const newStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current.status) + 1) % STATUS_CYCLE.length];

    try {
      const { error } = await supabase.from('staff').update({ status: newStatus }).eq('id', id);
      if (error) throw error;

    } catch (err) {
      console.error('Status update error:', err);
      if (isNetworkError(err)) retryConnection();
    }

    setStaff(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    setOpenStaff(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);
  }, [staff, canEdit, retryConnection]);

  const unassignOrder = useCallback(async (staffId: string, orderId: string) => {
    if (!canEdit) return;
    const current = staff.find(s => s.id === staffId);
    if (!current) return;

    const newAssigned = current.assignedOrderIds.filter(x => x !== orderId);
    try {
      const { error } = await supabase.from('staff').update({
        assigned_order_ids: newAssigned,
        active_orders: newAssigned.length
      }).eq('id', staffId);
      if (error) throw error;

    } catch (err) {
      console.error('Unassign error:', err);
      if (isNetworkError(err)) retryConnection();
    }

    setStaff(prev => prev.map(s => s.id === staffId
      ? { ...s, assignedOrderIds: newAssigned, activeOrders: newAssigned.length }
      : s
    ));
    setOpenStaff(prev => prev?.id === staffId
      ? { ...prev, assignedOrderIds: newAssigned, activeOrders: newAssigned.length }
      : prev
    );
  }, [staff, canEdit, retryConnection]);

  const validateForm = (): boolean => {
    const errs: Partial<NewStaffForm> = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim())  errs.lastName  = "Required";
    
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!form.phone.trim()) {
      errs.phone = "Required";
    } else if (phoneDigits.length !== 10) {
      errs.phone = "Enter 10 digits";
    }
    
    if (!form.email.trim())     errs.email     = "Required";
    if (!form.password.trim())  errs.password  = "Required";
    setFormErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: `${form.firstName} ${form.lastName}`, role: form.role },
          emailRedirectTo: undefined,
        },
      });

      if (authError) {
        throw new Error(`Auth creation failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("Auth user was not created. Check Supabase Auth settings.");
      }

      const { data: branchData, error: branchError } = await supabase
        .from("branches")
        .select("id")
        .eq("city", "Kumasi")
        .single();

      if (branchError) throw new Error(`Branch lookup failed: ${branchError.message}`);

      const payload = {
        id: authData.user.id,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone: getCleanPhone(form.phone),
        role: form.role,
        status: "active",
        efficiency: 100,
        active_orders: 0,
        completed_orders: 0,
        assigned_order_ids: [],
        joined_date: new Date().toISOString().split('T')[0],
        branch_id: branchData.id,
      };

      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .insert([payload])
        .select()
        .single();

      if (staffError) {
        try {
          await supabase.auth.signOut();
        } catch (cleanupErr) {
          console.error("Auth cleanup error:", cleanupErr);
        }
        throw new Error(`Staff insert failed: ${staffError.message}`);
      }

      const newMember: StaffMember = {
        id: staffData.id,
        name: `${form.firstName} ${form.lastName}`,
        role: form.role,
        phone: form.phone,
        status: "active",
        activeOrders: 0,
        completedOrders: 0,
        efficiency: 100,
        assignedOrderIds: [],
        joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        address: form.branch,
      };

      setStaff(prev => [newMember, ...prev]);
      setModalOpen(false);
      setForm({ 
        firstName: "", lastName: "", phone: "", role: "staff", branch: "Chapman Prestige Limited - Kumasi",
        email: "", password: "" 
      });

      setToast({ msg: "Staff member created successfully", type: "success" });
    } catch (err: any) {
      console.error('Create staff error:', err);
      if (isNetworkError(err)) retryConnection();
      setToast({ msg: err.message || "Failed to create staff", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const escapeCsv = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
    const headers = ["ID", "Name", "Role", "Phone", "Status", "Active Orders", "Completed", "Efficiency", "Joined"];
    const rows = filtered.map(s => [
      s.id,
      s.name,
      s.role,
      s.phone,
      s.status,
      s.activeOrders,
      s.completedOrders,
      s.efficiency,
      s.joinedDate,
    ]);
    const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cpl-staff-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ msg: "CSV exported successfully", type: "success" });
  };

  const hasFilters = roleFilter !== "all" || statusFilter !== "all" || q;
  const effColor = (e: number) => e >= 95 ? "var(--ok-500)" : e >= 85 ? "var(--warn-500)" : "var(--bad-500)";

  if (loading || permLoading) return (
    <div className="sf">
      <LoadingRows rows={5} label="Loading staff" />
    </div>
  );

  return (
    <div className="sf">
      <style>{`
        :root {
          --sf-bg-base: var(--ink-base); --sf-bg-surface: var(--ink-shell); --sf-bg-raised: var(--ink-card); --sf-bg-elevated: var(--ink-raised);
          --sf-border-faint: var(--line-faint); --sf-border-soft: var(--line-soft); --sf-border-mid: var(--line);
          --sf-text-primary: var(--text-1); --sf-text-sec: var(--text-2); --sf-text-tert: var(--text-3); --sf-text-hint: var(--text-4);
          --sf-accent: var(--brand-500); --sf-accent-dim: var(--brand-soft); --sf-accent-bord: var(--brand-border); --sf-accent-glow: var(--brand-border);
          --sf-gold: var(--warn-500); --sf-emerald: var(--ok-500); --sf-danger: var(--bad-500);
          --sf-font: var(--font-ui); --sf-mono: var(--font-mono);
        }
        @keyframes sfFadeUp { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform: none;} }
                @keyframes sfSpin { to { transform: rotate(360deg); } }
        @keyframes sfPulse { 0%,100% { opacity:1;} 50% { opacity:.5;} }
        @keyframes sfSlideInR { from { transform: translateX(24px); opacity:0;} to { transform: none; opacity:1;} }
                @keyframes sfScaleIn { from { opacity:0; transform: scale(.96) translateY(6px);} to { opacity:1; transform: none;} }

        /* Fills the shell frame: the shell owns the page scroll, .sf-tbl-wrap owns the
   table scroll. min-height:100vh inside the shell is what forced the whole page
   taller than the screen. */
.sf { background: var(--sf-bg-base); min-height: 100%; font-family: var(--font-ui); color: var(--sf-text-primary); padding: 24px var(--page-pad-x) 48px; position: relative; }

        .sf-offline { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
          background: var(--bad-soft); border: 1px solid var(--bad-border); border-radius: 10px;
          padding: 10px 16px; margin-bottom: 18px; animation: sfFadeUp .3s ease; }
        .sf-offline-l { display:flex; align-items:center; gap:10px; font-size: var(--fs-sm); color:var(--bad-500); }
        .sf-offline-dot { width:8px; height:8px; border-radius:50%; background: var(--sf-danger); animation: sfPulse 1.6s ease-in-out infinite; }
        .sf-offline-retry { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:7px;
          background: var(--bad-soft); border:1px solid var(--bad-border); color: var(--sf-danger);
          font-size: var(--fs-sm); font-weight:600; cursor:pointer; font-family: var(--font-ui); transition: background .18s ease, transform .18s ease; }
        .sf-offline-retry:hover { background: var(--bad-soft); }
        .sf-offline-retry:active { transform: scale(.96); }
        .sf-spin-icon { animation: sfSpin .8s linear infinite; }

        .sf-top { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 22px; gap: 16px; flex-wrap: wrap;
          position: relative; padding-bottom: 4px; }
        .sf-title { font-size: var(--fs-2xl); font-weight: 700; letter-spacing: -0.03em; margin: 0; color: var(--sf-text-primary); }
        .sf-sub { font-size: var(--fs-sm); color: var(--sf-text-tert); margin: 6px 0 0; display:flex; align-items:center; gap:8px; }
        .dsep { color: var(--sf-text-hint); }
        .sf-acts { display:flex; align-items:center; gap:8px; }
        .sf-btn { display:flex; align-items:center; gap:7px; padding:9px 14px; border-radius:9px; border:1px solid var(--sf-border-soft);
          background: var(--sf-bg-raised); color: var(--sf-text-sec); font-size: var(--fs-sm); font-weight:600; cursor:pointer;
          font-family: var(--font-ui); transition: border-color .16s ease, color .16s ease, background-color .16s ease; }
        .sf-btn.ghost:hover { border-color: var(--sf-border-mid); color: var(--sf-text-primary); }
        .sf-btn.primary { background: var(--brand-600); border-color: var(--brand-500); color: var(--on-brand); padding: 9px 16px; }
        .sf-btn.primary:hover { background: var(--brand-600); }
        .sf-btn.primary:active, .sf-btn.ghost:active { filter: brightness(1.06); }
        .spin { animation: sfSpin .8s linear infinite; }

        .kpi-row { display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-bottom: 22px; }
        .kpi { position:relative; overflow:hidden;
          background: color-mix(in srgb, var(--kpi-accent, var(--brand-500)) 6%, var(--ink-card));
          border:1px solid color-mix(in srgb, var(--kpi-accent, var(--brand-500)) 18%, var(--line-soft));
          border-radius: 14px;
          padding: 16px 16px 14px; animation: sfFadeUp .5s cubic-bezier(.16,1,.3,1) both; transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
        .kpi:hover { border-color: color-mix(in srgb, var(--kpi-accent, var(--brand-500)) 45%, var(--line)); }
        .kpi::before { content:""; position:absolute; inset: 0 auto 0 0; width: 3px; background: var(--kpi-accent, var(--brand-500)); }
        .kpi-top { display:flex; justify-content:flex-end; margin-bottom: 2px; }
        .kpi-ico { width: 30px; height: 30px; border-radius: 8px; display:flex; align-items:center; justify-content:center;
          border: 1px solid color-mix(in srgb, var(--kpi-accent, var(--brand-500)) 30%, transparent); }
        .kpi-lbl { font-size: var(--fs-2xs); color: var(--sf-text-tert); text-transform: uppercase; letter-spacing: .07em; font-weight: 700; margin-top: -22px; }
        .kpi-val { font-size: var(--fs-3xl); font-weight: 700; letter-spacing: -0.02em; font-family: var(--font-mono); margin-top: 6px; }
        .kpi-sub { font-size: var(--fs-xs); color: var(--sf-text-hint); margin-top: 2px; }
        .kpi-bar { height: 3px; border-radius: 3px; background: var(--ink-active); margin-top: 12px; overflow:hidden; }
        .kpi-bar-fill { height: 100%; border-radius: 3px; opacity: .8; transition: width var(--dur-slow) var(--ease-out); }

        .sf-filters { display:flex; align-items:center; gap:10px; margin-bottom: 16px; flex-wrap: wrap; }
        .sf-srch { position:relative; display:flex; align-items:center; flex: 1 1 240px; min-width: 200px; background: var(--sf-bg-raised);
          border:1px solid var(--sf-border-soft); border-radius: 9px; padding: 0 10px; transition: border-color .18s ease, box-shadow .18s ease; }
        .sf-srch:focus-within { border-color: var(--sf-accent-bord); box-shadow: var(--focus-ring); }
        .sf-srch-ico { color: var(--sf-text-tert); flex-shrink:0; }
        .sf-srch-inp { flex:1; background: transparent; border:none; outline:none; color: var(--sf-text-primary); font-size: var(--fs-md);
          padding: 9px 8px; font-family: var(--font-ui); }
        .sf-srch-x { background: var(--sf-bg-elevated); border:none; border-radius: 5px; color: var(--sf-text-tert); cursor:pointer;
          padding: 3px; display:flex; transition: color .15s ease, background .15s ease; }
        .sf-srch-x:hover { color: var(--sf-text-primary); background: rgba(255,255,255,.08); }
        .sf-kbd { font-size: var(--fs-2xs); color: var(--sf-text-hint); background: var(--sf-bg-elevated); border:1px solid var(--sf-border-soft);
          border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); }
        .sfp { background: var(--sf-bg-raised); border:1px solid var(--sf-border-soft); border-radius: 9px; color: var(--sf-text-sec);
          font-size: var(--fs-sm); padding: 9px 10px; font-family: var(--font-ui); cursor:pointer; transition: border-color .18s ease, color .18s ease; }
        .sfp:hover { border-color: var(--sf-border-mid); color: var(--sf-text-primary); }
        .sfp-clr { display:flex; align-items:center; gap:6px; background: var(--bad-soft); border:1px solid var(--bad-border);
          color: var(--sf-danger); border-radius: 9px; padding: 9px 12px; font-size: var(--fs-sm); font-weight:600; cursor:pointer;
          font-family: var(--font-ui); transition: background .18s ease; }
        .sfp-clr:hover { background: var(--bad-soft); }

        .sf-body { background: var(--sf-bg-raised); border: 1px solid var(--sf-border-soft); border-radius: 14px; overflow:hidden; }
        .sf-tbl-wrap { overflow-x: auto; }
        .sf-tbl { width: 100%; border-collapse: collapse; min-width: 760px; }
        .sf-tbl thead th { text-align:left; font-size: var(--fs-2xs); text-transform: uppercase; letter-spacing: .08em; font-weight: 700;
          color: var(--sf-text-tert); padding: 13px 18px; border-bottom: 1px solid var(--sf-border-faint); background: rgba(255,255,255,.015); white-space: nowrap; }
        .sf-tbl thead th:nth-child(4), .sf-tbl thead th:nth-child(5) { text-align: right; }
        .sf-empty { text-align:center; padding: 48px 20px !important; color: var(--sf-text-tert); font-size: var(--fs-md); }
        .sf-row { border-bottom: 1px solid var(--sf-border-faint); cursor:pointer; animation: sfFadeUp .4s ease both;
          transition: background .15s ease; }
        .sf-row:hover { background: rgba(255,255,255,.02); }
        .sf-row:last-child { border-bottom: none; }
        .sf-row td { padding: 12px 18px; vertical-align: middle; }
        .sf-member { display:flex; align-items:center; gap: 11px; }
        .sf-nm { font-size: var(--fs-md); font-weight: 600; color: var(--sf-text-primary); }
        .sf-ph { font-size: var(--fs-xs); color: var(--sf-text-tert); margin-top: 1px; font-family: var(--font-mono); }
        .sf-num { text-align: right; font-family: var(--font-mono); font-size: var(--fs-sm); color: var(--sf-text-sec); }
        .sf-dim { color: var(--sf-text-tert); font-size: var(--fs-sm); white-space: nowrap; }
        .sf-act-cell { text-align: right; }
        .sf-ra { background: var(--sf-bg-elevated); border: 1px solid var(--sf-border-soft); color: var(--sf-text-sec);
          padding: 6px 13px; border-radius: 7px; font-size: var(--fs-xs); font-weight: 600; cursor:pointer; font-family: var(--font-ui);
          transition: border-color .15s ease, color .15s ease, transform .15s ease; }
        .sf-ra:hover { border-color: var(--sf-accent-bord); color: var(--sf-text-primary); transform: translateY(-1px); }

        .sf-pag { display:flex; align-items:center; justify-content:space-between; padding: 13px 18px; border-top: 1px solid var(--sf-border-faint);
          flex-wrap: wrap; gap: 10px; }
        .sf-pag-info { font-size: var(--fs-xs); color: var(--sf-text-tert); }
        .sf-pag-r { display:flex; align-items:center; gap: 6px; }
        .sf-pag-pp { background: var(--sf-bg-elevated); border: 1px solid var(--sf-border-soft); color: var(--sf-text-sec);
          border-radius: 7px; padding: 6px 8px; font-size: var(--fs-xs); font-family: var(--font-ui); cursor:pointer; }
        .sf-pag-b { background: var(--sf-bg-elevated); border: 1px solid var(--sf-border-soft); color: var(--sf-text-sec);
          border-radius: 7px; width: 28px; height: 28px; display:flex; align-items:center; justify-content:center; cursor:pointer;
          transition: border-color .15s ease, color .15s ease, opacity .15s ease; }
        .sf-pag-b:hover:not(:disabled) { border-color: var(--sf-border-mid); color: var(--sf-text-primary); }
        .sf-pag-b:disabled { opacity: .35; cursor: not-allowed; }
        .sf-pag-n { background: transparent; border: 1px solid transparent; color: var(--sf-text-tert); border-radius: 7px;
          width: 28px; height: 28px; font-size: var(--fs-xs); font-family: var(--font-mono); cursor:pointer; transition: all .15s ease; }
        .sf-pag-n:hover { color: var(--sf-text-primary); background: rgba(255,255,255,.04); }
        .sf-pag-n.on { background: var(--sf-accent-dim); color: var(--sf-accent); border-color: var(--sf-accent-bord); font-weight: 700; }

        .stf-av { border-radius: 50%; display:flex; align-items:center; justify-content:center; font-weight: 700; flex-shrink:0; }
        .role-badge { font-size: var(--fs-2xs); font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid transparent; white-space: nowrap; }
        .status-chip { display:inline-flex; align-items:center; gap: 6px; border: 1px solid; border-radius: 20px; padding: 5px 11px;
          font-size: var(--fs-xs); font-weight: 700; font-family: var(--font-ui); background: transparent;
          transition: transform .15s ease, filter .15s ease; }
        .status-chip:hover { transform: translateY(-1px); filter: brightness(1.15); }
        .sc-dot { width: 6px; height: 6px; border-radius: 50%; }
        .eff-wrap { display:flex; flex-direction:column; gap: 4px; min-width: 110px; }
        .eff-num { font-size: var(--fs-xs); font-weight: 700; font-family: var(--font-mono); }
        .eff-track { position: relative; height: 5px; border-radius: 5px; background: rgba(255,255,255,.06); overflow: hidden; }
        .eff-fill { height: 100%; border-radius: 5px; transition: width 1s cubic-bezier(.4,0,.2,1); position: relative; }

        .sf-ov { position: fixed; inset:0; background: rgba(4,5,9,0.6); backdrop-filter: blur(2px); opacity:0; pointer-events:none;
          transition: opacity .25s ease; z-index: 60; }
        .sf-ov.on { opacity:1; pointer-events:auto; }
        .sf-panel { position: fixed; top:0; right:0; height: 100dvh; width: 420px; max-width: 92vw; background: var(--sf-bg-surface);
          border-left: 1px solid var(--sf-border-soft); z-index: 61; display:flex; flex-direction: column;
          transform: translateX(100%); transition: transform .32s cubic-bezier(.16,1,.3,1); }
        .sf-panel.on { transform: translateX(0); }
        .sp-hero { position: relative; padding: 28px 24px 22px; text-align:center; background: var(--ink-raised);
          border-bottom: 1px solid var(--sf-border-faint); }
        .sp-cl { position:absolute; top: 16px; right: 16px; background: var(--sf-bg-elevated); border:none; border-radius: 8px;
          color: var(--sf-text-sec); padding: 7px; cursor:pointer; transition: background .15s ease, color .15s ease; }
        .sp-cl:hover { background: rgba(255,255,255,.1); color: var(--sf-text-primary); }
        .sp-av-wrap { position: relative; width: 64px; height: 64px; margin: 4px auto 14px; }
        .sp-av-wrap .stf-av { position: absolute; top:0; left:0; }
        .sp-av-wrap .eff-ring { position: absolute; bottom: -10px; right: -14px; background: var(--sf-bg-surface); border-radius: 50%; padding: 1.5px; }
        .sp-name { font-size: var(--fs-xl); font-weight: 700; letter-spacing: -0.01em; margin-top: 4px; }
        .sp-id { font-size: var(--fs-xs); color: var(--sf-text-tert); font-family: var(--font-mono); margin-top: 2px; }
        .sp-badges { display:flex; align-items:center; justify-content:center; gap: 8px; margin-top: 12px; }
        .sp-body { flex: 1; overflow-y: auto; padding: 22px 24px; display:flex; flex-direction: column; gap: 24px; }
        .sp-sec-lbl { font-size: var(--fs-2xs); text-transform: uppercase; letter-spacing: .08em; font-weight: 700; color: var(--sf-text-tert); margin-bottom: 12px; }
        .sp-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
        .sp-gi { display:flex; flex-direction: column; gap: 5px; background: var(--sf-bg-raised); border: 1px solid var(--sf-border-faint);
          border-radius: 10px; padding: 10px 12px; }
        .sp-gk { display:flex; align-items:center; gap: 6px; font-size: var(--fs-2xs); color: var(--sf-text-tert); text-transform: uppercase; letter-spacing: .05em; font-weight: 700; }
        .sp-gv { font-size: var(--fs-sm); color: var(--sf-text-primary); font-weight: 600; overflow-wrap: anywhere; }
        .sp-perf-row { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .sp-perf-card { background: var(--sf-bg-raised); border: 1px solid var(--sf-border-faint); border-radius: 10px; padding: 14px 8px;
          text-align:center; transition: border-color .18s ease, transform .18s ease; }
        .sp-perf-card:hover { border-color: var(--sf-border-mid); transform: translateY(-2px); }
        .spc-val { font-size: var(--fs-2xl); font-weight: 700; font-family: var(--font-mono); }
        .spc-lbl { font-size: var(--fs-2xs); color: var(--sf-text-tert); text-transform: uppercase; letter-spacing: .05em; margin-top: 4px; font-weight: 700; }
        .sp-assign-count { background: var(--sf-accent-dim); color: var(--sf-accent); font-size: var(--fs-2xs); font-weight: 700;
          padding: 2px 9px; border-radius: 20px; }
        .sp-no-assign { display:flex; flex-direction: column; align-items:center; gap: 8px; padding: 30px 10px; color: var(--sf-text-hint);
          font-size: var(--fs-sm); border: 1px dashed var(--sf-border-soft); border-radius: 10px; }
        .sp-assign-list { display:flex; flex-direction: column; gap: 8px; }
        .sp-assign-item { display:flex; align-items:center; justify-content:space-between; background: var(--sf-bg-raised);
          border: 1px solid var(--sf-border-faint); border-radius: 10px; padding: 10px 12px; animation: sfSlideInR .3s ease both; }
        .sp-oid { font-size: var(--fs-sm); font-weight: 600; font-family: var(--font-mono); }
        .sp-ostg { font-size: var(--fs-2xs); color: var(--sf-gold); margin-top: 2px; }
        .sp-unassign { background: var(--bad-soft); border: 1px solid var(--bad-border); color: var(--sf-danger);
          border-radius: 7px; padding: 6px; cursor:pointer; transition: background .15s ease, transform .15s ease; }
        .sp-unassign:hover { background: var(--bad-soft); transform: scale(1.06); }
        .sp-footer { display:flex; gap: 10px; padding: 18px 24px; border-top: 1px solid var(--sf-border-faint); background: var(--sf-bg-surface); }
        .spf-s { flex: 1; background: var(--sf-bg-elevated); border: 1px solid var(--sf-border-soft); color: var(--sf-text-sec);
          border-radius: 9px; padding: 10px; font-size: var(--fs-md); font-weight: 600; cursor:pointer; font-family: var(--font-ui); transition: border-color .15s ease; }
        .spf-s:hover { border-color: var(--sf-border-mid); color: var(--sf-text-primary); }
        .spf-p { flex: 1.4; display:flex; align-items:center; justify-content:center; gap: 7px; background: var(--brand-600);
          border: 1px solid var(--brand-500); color: var(--on-brand); border-radius: 9px; padding: 10px; font-size: var(--fs-md); font-weight: 700; cursor:pointer;
          font-family: var(--font-ui); transition: background-color .15s ease; }
        .spf-p:hover { background: var(--brand-600); }

        .sf-modal-ov { position: fixed; inset:0; background: rgba(4,5,9,0.66); backdrop-filter: blur(3px); opacity:0; pointer-events:none;
          display:flex; align-items:center; justify-content:center; transition: opacity .22s ease; z-index: 70; padding: 20px; }
        .sf-modal-ov.on { opacity:1; pointer-events:auto; }
        .sf-modal { background: var(--sf-bg-surface); border: 1px solid var(--sf-border-soft); border-radius: 16px; width: 460px; max-width: 100%;
          box-shadow: var(--shadow-modal); animation: sfScaleIn .28s cubic-bezier(.16,1,.3,1); }
        .sm-head { display:flex; justify-content:space-between; align-items:flex-start; padding: 20px 22px 16px; border-bottom: 1px solid var(--sf-border-faint); }
        .sm-title { font-size: var(--fs-lg); font-weight: 700; }
        .sm-sub { font-size: var(--fs-xs); color: var(--sf-text-tert); margin-top: 4px; }
        .sm-cl { background: var(--sf-bg-elevated); border:none; border-radius: 8px; color: var(--sf-text-sec); padding: 7px; cursor:pointer;
          transition: background .15s ease, color .15s ease; }
        .sm-cl:hover { background: rgba(255,255,255,.1); color: var(--sf-text-primary); }
        .sm-body { padding: 20px 22px; display:flex; flex-direction: column; gap: 16px; }
        .sm-row { display:grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .sm-fg { display:flex; flex-direction: column; gap: 6px; }
        .sm-lbl { font-size: var(--fs-2xs); color: var(--sf-text-tert); text-transform: uppercase; letter-spacing: .07em; font-weight: 700; }
        .sm-inp { background: var(--sf-bg-raised); border: 1px solid var(--sf-border-soft); border-radius: 8px; color: var(--sf-text-primary);
          font-size: var(--fs-md); padding: 10px 12px; outline: none; font-family: var(--font-ui); transition: border-color .18s ease, box-shadow .18s ease; }
        .sm-inp:hover { border-color: var(--sf-border-mid); }
        .sm-inp:focus { border-color: var(--sf-accent-bord); box-shadow: var(--focus-ring); }
        .sm-inp.err { border-color: var(--bad-border); }
        .sm-inp.err:focus { box-shadow: 0 0 0 2px var(--bad-border); }
        .sm-err { font-size: var(--fs-2xs); color: var(--sf-danger); }
        .sm-sel { background: var(--sf-bg-raised); border: 1px solid var(--sf-border-soft); border-radius: 8px; color: var(--sf-text-primary);
          font-size: var(--fs-md); padding: 10px 12px; outline: none; font-family: var(--font-ui); cursor:pointer; transition: border-color .18s ease; }
        .sm-sel:hover { border-color: var(--sf-border-mid); }
        .sm-foot { display:flex; gap: 10px; padding: 16px 22px 22px; }
        .smf-s { flex:1; background: var(--sf-bg-elevated); border: 1px solid var(--sf-border-soft); color: var(--sf-text-sec);
          border-radius: 9px; padding: 10px; font-size: var(--fs-md); font-weight: 600; cursor:pointer; font-family: var(--font-ui); transition: border-color .15s ease; }
        .smf-s:hover { border-color: var(--sf-border-mid); color: var(--sf-text-primary); }
        .smf-p { flex: 1.4; display:flex; align-items:center; justify-content:center; gap: 7px; background: var(--brand-600);
          border: 1px solid var(--brand-500); color: var(--on-brand); border-radius: 9px; padding: 10px; font-size: var(--fs-md); font-weight: 700; cursor:pointer;
          font-family: var(--font-ui); transition: background-color .15s ease, opacity .15s ease; }
        .smf-p:hover:not(:disabled) { background: var(--brand-600); }
        .smf-p:disabled { opacity: .6; cursor: not-allowed; }

        @media (max-width: 1180px) {
          .kpi-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        /* Phones and small tablets. Every pane is sized to the visible area, so
           a zoomed page or an open keyboard cannot push a button off screen. */
        @media (max-width: 900px) {
          /* A "/" keyboard hint means nothing on a touch screen and it took a
             third of the search field's width. */
          .sf-kbd { display: none; }
          .sf-srch-inp, .sfp, .sm-inp, .sm-sel { font-size: var(--fs-lg); }

          .sf-ov, .sf-modal-ov {
            top: var(--vv-top, 0px);
            height: var(--vv-h, 100dvh);
          }

          .sf-panel {
            top: var(--vv-top, 0px);
            height: var(--vv-h, 100dvh);
            width: 100%;
            max-width: 100%;
          }

          /* The add-member dialog rises from the bottom edge instead of
             floating in the middle of a small screen. */
          .sf-modal-ov { padding: 0; align-items: flex-end; }
          .sf-modal {
            width: 100%;
            max-width: 100%;
            max-height: var(--vv-h, 100dvh);
            border-radius: 16px 16px 0 0;
            overflow-y: auto;
          }
        }

        @media (max-width: 760px) {
          .sf { padding: 18px var(--page-pad-x) 40px; }

          .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px; }
          .kpi { padding: 13px 13px 11px; border-radius: var(--r-md); }
          .kpi-ico { width: 26px; height: 26px; }
          .kpi-val { font-size: var(--fs-2xl); margin-top: 4px; }
          .kpi-bar { margin-top: 9px; }

          .sf-top { flex-direction: column; align-items: stretch; gap: 12px; margin-bottom: 18px; }
          .sf-acts { width: 100%; }
          .sf-btn { min-height: var(--tap-min); justify-content: center; }
          .sf-acts .sf-btn.primary { flex: 1; }

          /* Search keeps its own line; the filters become one strip that slides
             instead of wrapping the list down the page. */
          .sf-filters {
            flex-wrap: nowrap;
            overflow-x: auto;
            overscroll-behavior-x: contain;
            scrollbar-width: none;
            margin-bottom: 12px;
          }
          .sf-filters::-webkit-scrollbar { display: none; }
          .sf-srch { flex: 1 1 auto; min-width: 0; }
          .sfp, .sfp-clr { flex: 0 0 auto; min-height: var(--tap-min); }

          .sp-grid, .sm-row { grid-template-columns: 1fr; }
          .sp-hero, .sm-head { padding-left: var(--page-pad-x); padding-right: var(--page-pad-x); }
          .sp-body, .sm-body { padding: 18px var(--page-pad-x); }
          .sp-footer, .sm-foot {
            flex-wrap: nowrap;
            padding: 14px var(--page-pad-x) calc(14px + var(--safe-bottom));
          }
          .spf-s, .spf-p, .smf-s, .smf-p { min-height: var(--tap-min); }
        }

        /* Cards from the same breakpoint that releases the 760px table floor,
           so no width has to squeeze eight columns into a phone. */
        @media (max-width: 700px) {
          .sf-tbl { min-width: 0; }
          .sf-tbl thead { display: none; }

          .sf-row { display: block; padding: 12px 14px; border-bottom: 1px solid var(--sf-border-faint); }
          .sf-row td {
            display: block;
            padding: 7px 0 7px 40%;
            border: none;
            text-align: left;
            position: relative;
          }
          .sf-row td::before {
            content: attr(data-label);
            position: absolute;
            left: 0;
            top: 9px;
            font-size: var(--fs-2xs);
            color: var(--sf-text-tert);
            text-transform: uppercase;
            letter-spacing: .06em;
            font-weight: 700;
          }

          .sf-row td[data-label="Staff Member"] { padding-left: 0; }
          .sf-row td[data-label="Staff Member"]::before { display: none; }
          .sf-member { margin-bottom: 6px; }
          .sf-row td[data-label="Efficiency"] { min-width: 0 !important; }
          .eff-wrap { min-width: 0; }

          .sf-pag { flex-direction: column; align-items: flex-start; gap: 12px; padding: 12px 14px; }
          .sf-pag-r { width: 100%; justify-content: space-between; }
          .sf-pag-b, .sf-pag-n { width: var(--tap-min); height: var(--tap-min); }
          .sf-pag-pp { min-height: var(--tap-min); }

          .sf-ra { min-height: var(--tap-min); width: 100%; }
          .sf-srch-x { padding: 10px; min-width: var(--tap-min); min-height: var(--tap-min); display: flex; align-items: center; justify-content: center; }
          .sp-unassign { padding: 12px; min-width: var(--tap-min); min-height: var(--tap-min); display: flex; align-items: center; justify-content: center; }
          .sf-body { border-radius: var(--r-md); }
        }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="sf-top">
        <div>
          <h2 className="sf-title">Staff and Workers</h2>
          <p className="sf-sub">
            <span>{stats.total} members</span>
            <span className="dsep">·</span>
            <span style={{ color: "var(--ok-500)" }}>{stats.onDuty} on duty</span>
            <span className="dsep">·</span>
            <span style={{ color: "var(--text-4)" }}>{stats.offline} offline</span>
          </p>
        </div>
        <div className="sf-acts">
          <button className="sf-btn ghost" title="Refresh" onClick={() => { fetchStaff(); }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
          </button>
          <button className="sf-btn ghost" title="Export" onClick={handleExport}><Download size={14} /></button>
          <button 
            className="sf-btn primary" 
            onClick={() => canEdit && setModalOpen(true)}
            disabled={!canEdit}
            style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? "pointer" : "not-allowed" }}
          >
            <Plus size={14} /> {canEdit ? "Add Staff" : "View Only"}
          </button>
        </div>
      </div>

      <div className="kpi-row">
        <KpiCard label="Total Staff"    value={stats.total}       icon={<Users size={18} />}      accent="var(--brand-500)" sub="All roles" delay={0}   />
        <KpiCard label="On Duty Now"    value={stats.onDuty}      of={stats.total} unit="staff" icon={<UserCheck size={18} />}   accent="var(--ok-500)" sub="Working"   delay={80}  />
        <KpiCard label="Active"         value={stats.active}      of={stats.total} unit="staff" icon={<Check size={18} />}       accent="var(--ok-500)" sub="Available" delay={160} />
        <KpiCard label="Avg Efficiency" value={stats.avgEff}      icon={<TrendingUp size={18} />}  accent="var(--brand-400)" sub="Team rate" delay={240} />
        <KpiCard label="Orders Assigned" value={stats.totalAssigned} icon={<Package size={18} />} accent="var(--info-500)" sub="Active now" delay={320} />
      </div>

      <div className="sf-filters">
        <div className="sf-srch">
          <Search size={13} className="sf-srch-ico" />
          <input ref={searchRef} className="sf-srch-inp"
            placeholder="Search name or ID..."
            value={q} onChange={e => { setQ(e.target.value); setPg(1); }} />
          {q && <button className="sf-srch-x" onClick={() => setQ("")}><X size={11} /></button>}
          <kbd className="sf-kbd">/</kbd>
        </div>

        <select className="sfp" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPg(1); }}>
          <option value="all">All Roles</option>
          {Object.entries(ROLE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <select className="sfp" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPg(1); }}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="onduty">On Duty</option>
          <option value="offline">Offline</option>
        </select>

        {hasFilters && (
          <button className="sfp-clr" onClick={() => { setRoleFilter("all"); setStatusFilter("all"); setQ(""); }}>
            <X size={11} /> Clear
          </button>
        )}
      </div>

      <PermissionGuard>
        <div className="sf-body">
          <div className="sf-tbl-wrap">
            <table className="sf-tbl">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Active</th>
                  <th>Completed</th>
                  <th>Efficiency</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0
                  ? <tr><td colSpan={8} className="sf-empty">No staff match your filters</td></tr>
                  : paged.map((s, i) => (
                    <tr key={s.id} className="sf-row"
                      style={{ animationDelay: `${i * 28}ms` }}
                      onClick={() => setOpenStaff(s)}>
                      <td data-label="Staff Member">
                        <div className="sf-member">
                          <Avatar name={s.name} ring={STATUS_META[s.status]?.color || "var(--text-4)"} />
                          <div>
                            <div className="sf-nm">{s.name || "Unnamed Staff"}</div>
                            <div className="sf-ph">{formatPhoneInput((s.phone || "").replace('+233', ''))}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Role"><RoleBadge role={s.role} /></td>
                      <td data-label="Status">
                        <StatusChip status={s.status} canEdit={canEdit} onClick={(e: any) => { e?.stopPropagation?.(); toggleStatus(s.id); }} />
                      </td>
                      <td data-label="Active" className="sf-num">{s.activeOrders}</td>
                      <td data-label="Completed" className="sf-num">{s.completedOrders}</td>
                      <td data-label="Efficiency" style={{ minWidth: 130 }}>
                        <EffBar value={s.efficiency} color={effColor(s.efficiency)} />
                      </td>
                      <td data-label="Joined" className="sf-dim">{s.joinedDate}</td>
                      <td data-label="Action" className="sf-act-cell" onClick={e => e.stopPropagation()}>
                        <button className="sf-ra" onClick={() => setOpenStaff(s)}>View</button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          <div className="sf-pag">
            <span className="sf-pag-info">
              {filtered.length === 0 ? "No results"
                : `${(pg - 1) * pp + 1}–${Math.min(pg * pp, filtered.length)} of ${filtered.length}`}
            </span>
            <div className="sf-pag-r">
              <select className="sf-pag-pp" value={pp} onChange={e => { setPp(Number(e.target.value)); setPg(1); }}>
                {[10, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
              <button className="sf-pag-b" disabled={pg === 1} onClick={() => setPg(p => p - 1)}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(totalPgs, 5) }, (_, i) => {
                const n = totalPgs <= 5 ? i + 1 : pg <= 3 ? i + 1 : pg >= totalPgs - 2 ? totalPgs - 4 + i : pg - 2 + i;
                return <button key={n} className={`sf-pag-n ${pg === n ? "on" : ""}`} onClick={() => setPg(n)}>{n}</button>;
              })}
              <button className="sf-pag-b" disabled={pg === totalPgs} onClick={() => setPg(p => p + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </PermissionGuard>

      <div className={`sf-ov ${openStaff ? "on" : ""}`} onClick={() => setOpenStaff(null)} />
      <aside className={`sf-panel ${openStaff ? "on" : ""}`}>
        {openStaff && (() => {
          const ec = effColor(openStaff.efficiency);
          return (
            <>
              <div className="sp-hero">
                <button className="sp-cl" onClick={() => setOpenStaff(null)}><X size={16} /></button>
                <div className="sp-av-wrap">
                  <Avatar name={openStaff.name} size={64} ring={STATUS_META[openStaff.status].color} />
                  <EfficiencyRing value={openStaff.efficiency} size={40} color={ec} />
                </div>
                <div className="sp-name">{openStaff.name}</div>
                <div className="sp-id">{openStaff.id}</div>
                <div className="sp-badges">
                  <RoleBadge role={openStaff.role} />
                  <StatusChip status={openStaff.status} canEdit={canEdit} onClick={() => toggleStatus(openStaff.id)} />
                </div>
              </div>

              <div className="sp-body">
                <div className="sp-sec">
                  <div className="sp-sec-lbl">Contact and Info</div>
                  <div className="sp-grid">
                    <div className="sp-gi">
                      <span className="sp-gk"><Phone size={11} /> Phone</span>
                      <span className="sp-gv">{formatPhoneInput(openStaff.phone.replace('+233', ''))}</span>
                    </div>
                    <div className="sp-gi">
                      <span className="sp-gk"><MapPin size={11} /> Location</span>
                      <span className="sp-gv">{openStaff.address || "-"}</span>
                    </div>
                    <div className="sp-gi">
                      <span className="sp-gk"><Clock size={11} /> Joined</span>
                      <span className="sp-gv">{openStaff.joinedDate}</span>
                    </div>
                    <div className="sp-gi">
                      <span className="sp-gk"><Shield size={11} /> Role</span>
                      <span className="sp-gv">
                        {ROLE_META[openStaff.role as StaffRole]?.label || "Unknown Role"}
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="sp-gi" style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                      <span className="sp-gk"><Shield size={11} /> Account Status</span>
                      <button 
                        className="status-chip" 
                        style={{ 
                          color: openStaff.is_banned ? "var(--bad-500)" : "var(--ok-500)", 
                          borderColor: (openStaff.is_banned ? "var(--bad-500)" : "var(--ok-500)") + "40", 
                          background: (openStaff.is_banned ? "var(--bad-500)" : "var(--ok-500)") + "12" 
                        }}
                        onClick={async () => {
                          const newBannedStatus = !openStaff.is_banned;
                          try {
                            await supabase.from('staff').update({ is_banned: newBannedStatus }).eq('id', openStaff.id);
                            setOpenStaff(prev => prev ? { ...prev, is_banned: newBannedStatus } : prev);
                            setStaff(prev => prev.map(s => s.id === openStaff.id ? { ...s, is_banned: newBannedStatus } : s));
                          } catch (err) {
                            console.error('Update ban status error:', err);
                          }
                        }}
                      >
                        <span className="sc-dot" style={{ background: openStaff.is_banned ? "var(--bad-500)" : "var(--ok-500)" }} />
                        {openStaff.is_banned ? "Banned" : "Active"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="sp-sec">
                  <div className="sp-sec-lbl">Performance</div>
                  <div className="sp-perf-row">
                    <div className="sp-perf-card">
                      <div className="spc-val" style={{ color: "var(--warn-500)" }}>{openStaff.activeOrders}</div>
                      <div className="spc-lbl">Active</div>
                    </div>
                    <div className="sp-perf-card">
                      <div className="spc-val" style={{ color: "var(--ok-500)" }}>{openStaff.completedOrders}</div>
                      <div className="spc-lbl">Completed</div>
                    </div>
                    <div className="sp-perf-card">
                      <div className="spc-val" style={{ color: ec }}>{openStaff.efficiency}%</div>
                      <div className="spc-lbl">Efficiency</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <EffBar value={openStaff.efficiency} color={ec} />
                  </div>
                </div>

                <div className="sp-sec">
                  <div className="sp-sec-lbl" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Current Assignments</span>
                    {openStaff.assignedOrderIds.length > 0 && (
                      <span className="sp-assign-count">{openStaff.assignedOrderIds.length}</span>
                    )}
                  </div>
                  {openStaff.assignedOrderIds.length === 0 ? (
                    <div className="sp-no-assign">
                      <Package size={22} color="var(--text-4)" />
                      <span>No active assignments</span>
                    </div>
                  ) : (
                    <div className="sp-assign-list">
                      {openStaff.assignedOrderIds.map((oid, i) => (
                        <div key={oid} className="sp-assign-item" style={{ animationDelay: `${i * 40}ms` }}>
                          <div>
                            <div className="sp-oid">{oid}</div>
                            <div className="sp-ostg">In Progress</div>
                          </div>
                          <button 
                            className="sp-unassign" 
                            title="Unassign"
                            onClick={() => canEdit && unassignOrder(openStaff.id, oid)}
                            style={{ opacity: canEdit ? 1 : 0.5, cursor: canEdit ? "pointer" : "not-allowed" }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="sp-footer">
                <button className="spf-s" onClick={() => setOpenStaff(null)}>Close</button>
                <button 
                  className="spf-p" 
                  onClick={() => canEdit && navigate('/orders')}
                  disabled={!canEdit}
                  style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? "pointer" : "not-allowed" }}
                >
                  Assign Orders <ArrowRight size={14} />
                </button>
              </div>
            </>
          );
        })()}
      </aside>

      <div className={`sf-modal-ov ${modalOpen ? "on" : ""}`} onClick={() => setModalOpen(false)}>
        <div className="sf-modal" onClick={e => e.stopPropagation()}>
          <div className="sm-head">
            <div>
              <div className="sm-title">Add New Staff</div>
              <div className="sm-sub">They will be added as active immediately</div>
            </div>
            <button className="sm-cl" onClick={() => setModalOpen(false)}><X size={16} /></button>
          </div>
          <div className="sm-body">
            <div className="sm-row">
              <div className="sm-fg">
                <label className="sm-lbl">First Name</label>
                <input className={`sm-inp ${formErr.firstName ? "err" : ""}`}
                  placeholder="e.g. Kwame"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                {formErr.firstName && <span className="sm-err">{formErr.firstName}</span>}
              </div>
              <div className="sm-fg">
                <label className="sm-lbl">Last Name</label>
                <input className={`sm-inp ${formErr.lastName ? "err" : ""}`}
                  placeholder="e.g. Asante"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                {formErr.lastName && <span className="sm-err">{formErr.lastName}</span>}
              </div>
            </div>
            <div className="sm-fg">
              <label className="sm-lbl">Phone Number</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <span style={{ 
                  padding: '10px 12px', 
                  background: 'var(--sf-bg-raised)', 
                  border: '1px solid var(--sf-border-soft)', 
                  borderRight: 'none',
                  borderRadius: '8px 0 0 8px',
                  color: 'var(--sf-text-sec)',
                  fontSize: '13.5px',
                  fontFamily: 'var(--font-ui)'
                }}>+233</span>
                <input className={`sm-inp ${formErr.phone ? "err" : ""}`}
                  placeholder="XX XXX XXXX"
                  value={form.phone}
                  onChange={e => {
                    const formatted = formatPhoneInput(e.target.value);
                    setForm(f => ({ ...f, phone: formatted }));
                  }}
                  onBlur={e => {
                    const digits = e.target.value.replace(/\s/g, '');
                    if (digits.length !== 10 && form.phone) {
                      setFormErr(prev => ({ ...prev, phone: "Enter 10 digits" }));
                    }
                  }}
                  style={{ borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
                  maxLength={14}
                />
              </div>
              {formErr.phone && <span className="sm-err">{formErr.phone}</span>}
            </div>
            <div className="sm-fg">
              <label className="sm-lbl">Email Address</label>
              <input className={`sm-inp ${formErr.email ? "err" : ""}`}
                placeholder="staff@chapmanprestigelimited.com"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              {formErr.email && <span className="sm-err">{formErr.email}</span>}
            </div>

            <div className="sm-fg">
              <label className="sm-lbl">Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className={`sm-inp ${formErr.password ? "err" : ""}`}
                  placeholder="Enter secure password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer',
                    padding: '4px', display: 'flex'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {formErr.password && <span className="sm-err">{formErr.password}</span>}
            </div>
            <div className="sm-row">
              <div className="sm-fg">
                <label className="sm-lbl">Role</label>
                <select className="sm-sel" value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as StaffRole }))}>
                  {Object.entries(ROLE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="sm-fg">
                <label className="sm-lbl">Branch</label>
                <select className="sm-sel" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}>
                  <option value="Chapman Prestige Limited - Kumasi">Chapman Prestige Limited - Kumasi</option>
                </select>
              </div>
            </div>
          </div>
          <div className="sm-foot">
            <button className="smf-s" onClick={() => { setModalOpen(false); setShowPassword(false); }}>Cancel</button>
            <button 
              className="smf-p" 
              onClick={handleCreate} 
              disabled={saving || !canEdit}
              style={{ opacity: canEdit ? 1 : 0.7, cursor: (saving || !canEdit) ? "not-allowed" : "pointer" }}
            >
              {saving ? "Creating..." : <><Plus size={14} /> {canEdit ? "Create Staff" : "View Only"}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staff;