import { useState, useEffect, useCallback, useRef } from "react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import {
  Shield, Users, Key, Lock, Eye, EyeOff, Save, AlertTriangle, Check, Clock,
  UserCheck, UserX, LogOut, RefreshCw, Database, FileText, WifiOff, Radio
} from "lucide-react";
import { usePermission } from "../hooks/usePermission";
import { useLocation } from "react-router-dom";
import { PermissionGuard } from "../components/PermissionGuard";

const PAGE_CONFIG = [
  { label: 'Dashboard', key: 'dashboard' },
  { label: 'New Order', key: 'new-order' },
  { label: 'Orders', key: 'orders' },
  { label: 'Staff', key: 'staff' },
  { label: 'Clients', key: 'clients' },
  { label: 'Services', key: 'services' },
  { label: 'Receipts', key: 'receipts' },
  { label: 'Payments', key: 'payments' },
  { label: 'Security', key: 'security' },
  { label: 'Settings', key: 'settings' },
];

/* ── DESIGN TOKENS ───────────────────────────────────────── */
const T = {
  bgBase:      "#05070b", bgSurface: "#0a0d15", bgRaised: "#10141f", bgElevated: "#161c2c",
  bgGlass:     "rgba(16,20,31,0.6)",
  borderFaint: "rgba(255,255,255,0.05)", borderSoft: "rgba(255,255,255,0.09)", borderMid: "rgba(255,255,255,0.16)",
  textPrimary: "#edf0f8", textSec: "#9aa3b5", textTert: "#556070", textHint: "#2e3a4e",
  accent: "#6c72f3", accentBright: "#8489ff", accentDim: "rgba(108,114,243,0.13)", accentBord: "rgba(108,114,243,0.28)", accentGlow: "rgba(108,114,243,0.45)",
  gold: "#dba96a", goldDim: "rgba(219,169,106,0.1)", goldBord: "rgba(219,169,106,0.22)", goldGlow: "rgba(219,169,106,0.35)",
  emerald: "#34d399", emeraldDim: "rgba(52,211,153,0.1)", emeraldBord: "rgba(52,211,153,0.2)", emeraldGlow: "rgba(52,211,153,0.5)",
  ember: "#f87171", emberDim: "rgba(248,113,113,0.1)", emberBord: "rgba(248,113,113,0.25)", emberGlow: "rgba(248,113,113,0.45)",
};

const FONT = "'DM Sans', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', 'Fira Mono', ui-monospace, monospace";

interface RoleGroupData {
  count: number;
  lastLogin: string | null;
}

interface AuditLog {
  id: number | string;
  user: string;
  action: string;
  time: string;
  ip: string;
}

interface Role {
  id: string;
  name: string;
  users: number;
  permissions: string[];
  lastActive: string;
}

/* Injected once — keyframes + interactive states that inline styles can't express (hover, focus, pseudo, media queries) */
const StyleSheet = () => (
  <style>{`
    @keyframes secFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes secFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes secPing { 0% { transform: scale(0.9); opacity: 0.7; } 70% { transform: scale(1.9); opacity: 0; } 100% { opacity: 0; } }
    @keyframes secPulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
    @keyframes secShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    @keyframes secSpin { to { transform: rotate(360deg); } }
    @keyframes secBounce { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
    @keyframes secBannerIn { from { transform: translateY(-100%); } to { transform: translateY(0); } }

    .sec-root * { box-sizing: border-box; }
    .sec-input { transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
    .sec-input:focus { border-color: ${T.accent} !important; box-shadow: 0 0 0 3px ${T.accentDim}, 0 0 16px ${T.accentDim}; background: ${T.bgElevated} !important; }
    .sec-input:hover { border-color: ${T.borderMid} !important; }

    .sec-btn-primary { transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease; }
    .sec-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px ${T.accentGlow}; }
    .sec-btn-primary:active { transform: translateY(0px) scale(0.98); }

    .sec-btn-ghost { transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease, transform 0.15s ease; }
    .sec-btn-ghost:hover { border-color: ${T.borderMid} !important; color: ${T.textPrimary} !important; background: ${T.bgElevated} !important; transform: translateY(-1px); }
    .sec-btn-ghost:active { transform: translateY(0); }

    .sec-tab { position: relative; transition: color 0.2s ease; }
    .sec-tab:hover { color: ${T.textPrimary} !important; }
    .sec-tab-bar { position: absolute; left: 10px; right: 10px; bottom: -1px; height: 2px; border-radius: 2px 2px 0 0; background: linear-gradient(90deg, ${T.accent}, ${T.accentBright}); transform: scaleX(0); transform-origin: center; transition: transform 0.28s cubic-bezier(.4,0,.2,1), box-shadow 0.28s ease; }
    .sec-tab-bar.active { transform: scaleX(1); box-shadow: 0 0 10px ${T.accentGlow}; }

    .sec-row { transition: background 0.15s ease, transform 0.15s ease; animation: secFadeUp 0.35s ease both; }
    .sec-row:hover { background: ${T.bgElevated}; }

    .sec-card { animation: secFadeUp 0.32s cubic-bezier(.2,.7,.3,1) both; }

    .sec-toggle { transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; }
    .sec-toggle:hover { box-shadow: 0 0 0 4px rgba(255,255,255,0.04); }
    .sec-toggle-thumb { transition: left 0.22s cubic-bezier(.4,0,.2,1); }

    .sec-eye-btn { transition: color 0.18s ease, transform 0.18s ease; }
    .sec-eye-btn:hover { color: ${T.textPrimary} !important; transform: scale(1.08); }

    .sec-edit-btn { transition: all 0.18s ease; }
    .sec-edit-btn:hover { background: ${T.accentDim} !important; border-color: ${T.accentBord} !important; color: ${T.accentBright} !important; }

    .sec-skeleton { background: linear-gradient(90deg, ${T.bgElevated} 0px, rgba(255,255,255,0.06) 40px, ${T.bgElevated} 80px); background-size: 800px 100%; animation: secShimmer 1.6s linear infinite; border-radius: 6px; }

    .sec-spin { animation: secSpin 0.9s linear infinite; }

    .sec-ping-ring { position: absolute; inset: 0; border-radius: 50%; animation: secPing 1.8s cubic-bezier(0,0,.2,1) infinite; }
    .sec-status-dot { animation: secPulseDot 2s ease-in-out infinite; }

    .sec-check-pop { animation: secBounce 0.4s cubic-bezier(.34,1.56,.64,1) both; }

    .sec-banner { animation: secBannerIn 0.35s cubic-bezier(.2,.8,.3,1) both; }

    .sec-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
    .sec-scroll::-webkit-scrollbar-thumb { background: ${T.borderMid}; border-radius: 8px; }

    @media (prefers-reduced-motion: reduce) {
      .sec-root *, .sec-root *::before, .sec-root *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
    }

    @media (max-width: 860px) {
      .sec-header { padding: 16px 18px !important; flex-wrap: wrap; gap: 12px; }
      .sec-tabs { padding: 0 12px !important; overflow-x: auto; }
      .sec-content { padding: 18px !important; }
      .sec-grid-2 { grid-template-columns: 1fr !important; }
      .sec-table-wrap { overflow-x: auto; }
    }
  `}</style>
);

export const Security = () => {
  const [activeTab, setActiveTab] = useState("roles");
  const [saved, setSaved] = useState(false);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // Connectivity awareness — additive only, does not alter existing fetch/save mechanics
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [syncFailed, setSyncFailed] = useState(false);
  const mountedAt = useRef(Date.now());

  const [config, setConfig] = useState({
    sheetPass: "cpl2024",
    sessionTimeout: 30,
    require2FA: false,
    passwordExpiry: 90,
    auditRetention: 365,
    allowRemote: true,
    ipWhitelist: "192.168.1.0/24",
  });

  // Roles now fetched from Supabase (no more placeholders)
  const [roles, setRoles] = useState<Role[]>([]);

  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);

  // Permission hook for guard
  const location = useLocation();
  const { permission, loading: permLoading, canEdit } = usePermission(location.pathname);

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

  const fetchSecurity = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setSyncFailed(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch security config
      const { data: configData, error: configError } = await supabase.from('security_config').select('*').maybeSingle();
      if (!configError && configData) {
        setConfig(prev => ({
          ...prev,
          sheetPass: configData?.sheet_password || prev.sheetPass,
          sessionTimeout: configData?.session_timeout ?? prev.sessionTimeout,
          require2FA: configData?.require_2fa ?? prev.require2FA,
          passwordExpiry: configData?.password_expiry ?? prev.passwordExpiry,
          auditRetention: configData?.audit_retention ?? prev.auditRetention,
          allowRemote: configData?.allow_remote ?? prev.allowRemote,
          ipWhitelist: configData?.ip_whitelist || prev.ipWhitelist,
        }));
      }

//  Fetch permissions map from DB
const { data: permData, error: permError } = await supabase.from('role_permissions').select('role, permissions');
const permMap: Record<string, string[]> = {};
if (!permError && permData) {
  permData.forEach((p: any) => { permMap[p.role] = p.permissions || []; });
}

// Fetch roles from staff table
const { data: rolesData, error: rolesError } = await supabase
  .from('staff')
  .select('role, last_login')
  .not('role', 'is', null);

if (!rolesError && rolesData) {
  const grouped = rolesData.reduce((acc: Record<string, RoleGroupData>, r: any) => {
    if (!acc[r.role]) acc[r.role] = { count: 0, lastLogin: null };
    acc[r.role].count += 1;
    if (!acc[r.role].lastLogin || (r.last_login && r.last_login > acc[r.role].lastLogin)) {
      acc[r.role].lastLogin = r.last_login;
    }
    return acc;
  }, {});

const formattedRoles: Role[] = Object.entries(grouped).map(([role, data]: [string, RoleGroupData]) => {
    let lastActive = 'Never';
    if (data?.lastLogin) {
      try {
        const diff = Date.now() - new Date(data?.lastLogin).getTime();
        if (diff < 0) lastActive = 'Just now';
        else if (diff < 60000) lastActive = 'Just now';
        else if (diff < 3600000) lastActive = `${Math.floor(diff / 60000)}m ago`;
        else if (diff < 86400000) lastActive = `${Math.floor(diff / 3600000)}h ago`;
        else if (diff < 604800000) lastActive = `${Math.floor(diff / 86400000)}d ago`;
        else lastActive = new Date(data?.lastLogin).toLocaleDateString();
      } catch { lastActive = 'Recently'; }
    }
    
    return {
      id: role,
      name: role.charAt(0).toUpperCase() + role.slice(1),
      users: data?.count,
      permissions: permMap[role] || ['dashboard'],
      lastActive
    };
  });
  setRoles(formattedRoles);
}
      // Fetch audit logs
      const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select('id, user_name, action, created_at, ip_address')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!logsError && logs) {
        setAuditLog(logs.map((l: any) => ({
          id: l.id,
          user: l.user_name || 'System',
          action: l.action || 'Configuration update',
          time: new Date(l.created_at).toLocaleString(),
          ip: l.ip_address || '—'
        })));
      }
      setSyncFailed(false);
      setIsOnline(true);
    } catch (err: any) {
  console.error('Security fetch error:', err);
  // Only mark as sync failed if it's a network error, not a missing table
  if (err.message?.includes('network') || err.message?.includes('Failed to fetch')) {
    setSyncFailed(true);
  } else {
    // Log the error but don't show offline banner for schema issues
    console.warn('Non-network error (likely missing table or RLS):', err);
  }
} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurity();
  }, [fetchSecurity]);

  const handleSave = async () => {
    if (!isOnline) {
      setSaveBlocked(true);
      setTimeout(() => setSaveBlocked(false), 2500);
      return;
    }
    setSaved(true);
    try {
      const { error } = await supabase.from('security_config').upsert({
        id: 1,
        sheet_password: config.sheetPass,
        session_timeout: config.sessionTimeout,
        require_2fa: config.require2FA,
        password_expiry: config.passwordExpiry,
        audit_retention: config.auditRetention,
        allow_remote: config.allowRemote,
        ip_whitelist: config.ipWhitelist,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) throw error;
      setSyncFailed(false);
    } catch (err) {
      console.error('Security save error:', err);
      setSyncFailed(true);
    } finally {
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSecurity();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", background: T.bgSurface,
    border: `1px solid ${T.borderSoft}`, borderRadius: 8,
    color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: FONT
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: T.textTert, marginBottom: 6,
    textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, fontFamily: FONT
  };

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    position: "relative", display: "inline-block", width: 40, height: 22,
    cursor: isOnline ? "pointer" : "not-allowed", borderRadius: 20,
    background: active ? T.emerald : T.bgElevated,
    border: `1px solid ${active ? T.emeraldBord : T.borderSoft}`,
    boxShadow: active ? `0 0 12px ${T.emeraldDim}` : "none",
    opacity: isOnline ? 1 : 0.5,
  });

  const thumbStyle = (active: boolean): React.CSSProperties => ({
    position: "absolute", content: '""', height: 18, width: 18,
    left: active ? 19 : 2, bottom: 1, backgroundColor: "#fff",
    borderRadius: "50%",
  });

  const tabs = [
    { id: "roles", label: "Roles & Permissions", icon: Users },
    { id: "access", label: "Access Control", icon: Lock },
    { id: "audit", label: "Audit Logs", icon: FileText },
    { id: "session", label: "Session Settings", icon: Clock },
  ];

  const statusColor = isOnline ? T.emerald : T.ember;
  const statusGlow = isOnline ? T.emeraldGlow : T.emberGlow;

  // Wait for both data AND permissions to load
  if (loading || permLoading) return (
    <div className="sec-root" style={{ background: T.bgBase, minHeight: "100vh", fontFamily: FONT }}>
      <StyleSheet />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 14 }}>
        <div style={{ position: "relative", width: 44, height: 44 }}>
          <Shield size={44} color={T.accent} className="sec-spin" style={{ opacity: 0.85 }} />
        </div>
        <div style={{ color: T.textTert, fontSize: 13, letterSpacing: "0.04em", fontFamily: FONT }}>
          {isOnline ? "Loading security configuration…" : "Waiting for connection…"}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="sec-root"
      style={{
        background: `radial-gradient(1200px 600px at 15% -10%, rgba(108,114,243,0.07), transparent 60%),
                     radial-gradient(900px 500px at 100% 0%, rgba(219,169,106,0.05), transparent 55%),
                     ${T.bgBase}`,
        minHeight: "100vh", fontFamily: FONT, color: T.textPrimary
      }}
    >
      <StyleSheet />

      {/* OFFLINE BANNER */}
      {(!isOnline || syncFailed) && (
        <div
          className="sec-banner"
          style={{
            position: "sticky", top: 0, zIndex: 50, background: `linear-gradient(90deg, ${T.emberDim}, rgba(248,113,113,0.04))`,
            borderBottom: `1px solid ${T.emberBord}`, padding: "10px 32px", display: "flex", alignItems: "center", gap: 10,
            backdropFilter: "blur(6px)"
          }}
        >
          <WifiOff size={15} color={T.ember} />
          <span style={{ fontSize: 13, color: T.textPrimary, fontFamily: FONT, fontWeight: 600 }}>
            {!isOnline ? "You're offline." : "Couldn't reach the security service."}
          </span>
          <span style={{ fontSize: 13, color: T.textSec, fontFamily: FONT }}>
            Showing the last data loaded this session. Changes won't save until the connection is back.
          </span>
        </div>
      )}

      {/* HEADER */}
      <div className="sec-header" style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderFaint}`, padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="sec-ping-ring" style={{ background: statusGlow, opacity: 0.35 }} />
            <div style={{
              position: "relative", width: 34, height: 34, borderRadius: "50%",
              background: T.bgElevated, border: `1px solid ${statusColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 14px ${statusGlow}`
            }}>
              <Shield size={17} color={statusColor} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, letterSpacing: "-0.03em", fontFamily: FONT }}>Security</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span className="sec-status-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
              <span style={{ fontSize: 11.5, color: T.textTert, fontFamily: FONT, letterSpacing: "0.03em" }}>
                {isOnline ? (syncFailed ? "Connected — last sync failed" : "System online") : "System offline"}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!isOnline}
          className="sec-btn-primary"
          style={{
            padding: "10px 20px",
            background: saved ? T.emerald : (isOnline ? T.accent : T.bgElevated),
            border: isOnline ? "none" : `1px solid ${T.borderSoft}`,
            borderRadius: 9,
            color: saved ? "#03261a" : (isOnline ? "#fff" : T.textTert),
            fontSize: 14, fontWeight: 600, cursor: isOnline ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", gap: 7, fontFamily: FONT
          }}
        >
          {saved ? <Check size={16} className="sec-check-pop" /> : <Save size={16} />}
          {saved ? "Saved" : (isOnline ? "Save Changes" : "Offline")}
        </button>
      </div>

      {saveBlocked && (
        <div className="sec-banner" style={{ background: T.emberDim, borderBottom: `1px solid ${T.emberBord}`, padding: "8px 32px", fontSize: 12.5, color: T.ember, display: "flex", alignItems: "center", gap: 8, fontFamily: FONT }}>
          <AlertTriangle size={14} /> Changes can't be saved while offline. They'll stay in the form — reconnect and try again.
        </div>
      )}

      {/* TABS */}
      <div className="sec-tabs" style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderFaint}`, padding: "0 32px", display: "flex", gap: 4 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="sec-tab"
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", fontSize: 13.5, fontWeight: 500,
              cursor: "pointer", fontFamily: FONT, border: "none", background: "transparent",
              color: activeTab === tab.id ? T.textPrimary : T.textTert, whiteSpace: "nowrap"
            }}
          >
            <tab.icon size={16} /> {tab.label}
            <span className={`sec-tab-bar ${activeTab === tab.id ? "active" : ""}`} />
          </button>
        ))}
      </div>

      {/* CONTENT - Wrapped with PermissionGuard */}
      <PermissionGuard>
        <div className="sec-content" style={{ padding: "32px", maxWidth: 1000 }}>

          {/* ROLES & PERMISSIONS - Now fetches real data */}
          {activeTab === "roles" && (
            <div key="roles" className="sec-card sec-table-wrap" style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.25)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 640 }}>
                <thead>
                  <tr style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderSoft}` }}>
                    {["Role", "Users", "Permissions", "Last Active", "Actions"].map(h => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FONT }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 28, textAlign: "center", color: T.textTert, fontFamily: FONT }}>
                        {syncFailed ? "Couldn't load roles — reconnect to retry." : "No roles configured yet."}
                      </td>
                    </tr>
                  ) : (
                    roles.map((role, i) => (
                      <tr key={role.id} className="sec-row" style={{ borderBottom: `1px solid ${T.borderFaint}`, animationDelay: `${i * 45}ms` }}>
                        <td style={{ padding: "16px 20px", fontWeight: 600 }}>{role.name}</td>
                        <td style={{ padding: "16px 20px", fontFamily: MONO }}>{role.users}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {role.permissions.map(p => (
                              <span key={p} style={{ padding: "3px 8px", background: T.bgElevated, borderRadius: 4, fontSize: 11, color: T.textSec, border: `1px solid ${T.borderFaint}` }}>{p}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: 13, color: T.textSec }}>{role.lastActive}</td>
                        <td style={{ padding: "16px 20px" }}>
  <button 
  className="sec-edit-btn" 
  onClick={(e) => {
    e.stopPropagation();
    
    // 1. Safely extract DB permissions
    const rawPerms = Array.isArray(role.permissions) ? role.permissions : [];
    
    // 2. Map DB keys → UI labels for the modal state
    const uiLabels = rawPerms.map(key => {
      const match = PAGE_CONFIG.find(p => p.key === key);
      return match ? match.label : key;
    });
    
    // 3. Open modal with correct state
    setEditingRole(role);
    setRolePermissions(uiLabels);
  }}
  style={{ padding: "6px 12px", background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 6, color: T.textSec, fontSize: 12, cursor: "pointer", fontFamily: FONT }}
>
  Edit
</button>
</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ACCESS CONTROL */}
          {activeTab === "access" && (
            <div key="access" className="sec-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="sec-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={labelStyle}>Sheet Protection Password</div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="sec-input"
                      type={showPass ? "text" : "password"}
                      value={config.sheetPass}
                      onChange={e => setConfig(p => ({...p, sheetPass: e.target.value}))}
                      style={{...inputStyle, paddingRight: 40}}
                    />
                    <button
                      onClick={() => setShowPass(!showPass)}
                      className="sec-eye-btn"
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: T.textSec, cursor: "pointer" }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Allowed IP Range</div>
                  <input className="sec-input" value={config.ipWhitelist} onChange={e => setConfig(p => ({...p, ipWhitelist: e.target.value}))} style={inputStyle} placeholder="192.168.1.0/24" />
                </div>
              </div>
              <div style={{ padding: 16, background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, fontFamily: FONT }}>Remote Access</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.borderFaint}` }}>
                  <div style={{ fontSize: 14, fontWeight: 500, fontFamily: FONT }}>Allow Remote Login</div>
                  <div className="sec-toggle" style={toggleStyle(config.allowRemote)} onClick={() => isOnline && setConfig(p => ({...p, allowRemote: !p.allowRemote}))}>
                    <div className="sec-toggle-thumb" style={thumbStyle(config.allowRemote)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT LOGS - Fully functional */}
          {activeTab === "audit" && (
            <div key="audit" className="sec-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="sec-table-wrap" style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.25)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderSoft}` }}>
                      {["User", "Action", "Timestamp", "IP Address"].map(h => (
                        <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FONT }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: 28, textAlign: "center", color: T.textTert, fontFamily: FONT }}>
                          {!isOnline || syncFailed
                            ? "Audit history can't be reached right now — reconnect to load it."
                            : "No records yet."}
                        </td>
                      </tr>
                    ) : (
                      auditLog.map((log, i) => (
                        <tr key={log.id} className="sec-row" style={{ borderBottom: `1px solid ${T.borderFaint}`, animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                          <td style={{ padding: "16px 20px", fontWeight: 500 }}>{log.user}</td>
                          <td style={{ padding: "16px 20px", color: T.textSec }}>{log.action}</td>
                          <td style={{ padding: "16px 20px", fontFamily: MONO, fontSize: 12 }}>{log.time}</td>
                          <td style={{ padding: "16px 20px", fontFamily: MONO, fontSize: 12, color: T.textTert }}>{log.ip}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleRefresh} disabled={!isOnline} className="sec-btn-ghost" style={{ padding: "8px 16px", background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: isOnline ? T.textSec : T.textHint, fontSize: 13, cursor: isOnline ? "pointer" : "not-allowed", fontFamily: FONT, display: "flex", alignItems: "center", gap: 6 }}>
                  <RefreshCw size={14} className={refreshing ? "sec-spin" : ""} /> {isOnline ? "Refresh" : "Offline"}
                </button>
              </div>
            </div>
          )}

          {/* SESSION SETTINGS */}
          {activeTab === "session" && (
            <div key="session" className="sec-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="sec-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={labelStyle}>Session Timeout (minutes)</div>
                  <input className="sec-input" type="number" value={config.sessionTimeout} onChange={e => setConfig(p => ({...p, sessionTimeout: Number(e.target.value)}))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Password Expiry (days)</div>
                  <input className="sec-input" type="number" value={config.passwordExpiry} onChange={e => setConfig(p => ({...p, passwordExpiry: Number(e.target.value)}))} style={inputStyle} />
                </div>
              </div>
              <div style={{ padding: 16, background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, fontFamily: FONT }}>Two-Factor Authentication</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, fontFamily: FONT }}>Require 2FA for Remote Access</div>
                  <div className="sec-toggle" style={toggleStyle(config.require2FA)} onClick={() => isOnline && setConfig(p => ({...p, require2FA: !p.require2FA}))}>
                    <div className="sec-toggle-thumb" style={thumbStyle(config.require2FA)} />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
        {/* Role Edit Modal */}
{/* Role Edit Modal */}
{editingRole && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(4,5,9,0.8)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
  }} onClick={() => setEditingRole(null)}>
    <div style={{
      background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 16,
      width: 420, maxWidth: '100%', padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
    }} onClick={e => e.stopPropagation()}>
      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, fontFamily: FONT }}>
        Edit Role: {editingRole.name}
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: 12.5, color: T.textTert, fontFamily: FONT }}>
        Select permissions for this role
      </p>
      
      {/* Checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {PAGE_CONFIG.map(({ label, key }) => {
          // Check if this label is currently in our state
          const isChecked = rolePermissions.includes(label);
          
          return (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textPrimary, fontFamily: FONT, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Add to list if not already there
                    setRolePermissions(prev => [...new Set([...prev, label])]);
                  } else {
                    // Remove from list
                    setRolePermissions(prev => prev.filter(p => p !== label));
                  }
                }}
                style={{ accentColor: T.accent, cursor: 'pointer' }}
              />
              {label}
            </label>
          );
        })}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button 
          onClick={() => setEditingRole(null)} 
          style={{ 
            flex: 1, padding: 10, background: T.bgElevated, border: `1px solid ${T.borderSoft}`, 
            borderRadius: 8, color: T.textSec, fontWeight: 600, cursor: 'pointer', fontFamily: FONT 
          }}
        >
          Cancel
        </button>
        <button 
          onClick={async () => {
            try {
              // Convert UI Labels back to DB Keys for saving
              const dbKeys = rolePermissions.map(l => 
                PAGE_CONFIG.find(p => p.label === l)?.key
              ).filter(Boolean); // filter(Boolean) removes any undefineds

              const { error } = await supabase.from('role_permissions').upsert({
                role: editingRole.id,
                permissions: dbKeys,
                updated_at: new Date().toISOString()
              }, { onConflict: 'role' });
              
              if (error) throw error;

window.dispatchEvent(new Event('permissions-updated'));
              
              setEditingRole(null);
              fetchSecurity(); // Refresh data to ensure sync
            } catch (err) {
              alert('Failed to save permissions.');
            }
          }}
          style={{ flex: 1.5, padding: 10, background: T.accent, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}

      </PermissionGuard>
    </div>
  );
};

export default Security;