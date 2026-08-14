import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Shield, User, Trash2, RefreshCw, WifiOff, Check, X, 
  Settings, Activity, Lock, Unlock, AlertTriangle, Loader2, Plus, Eye, EyeOff, LayoutGrid
} from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { usePermission } from "../hooks/usePermission";
import { PermissionGuard } from "../components/PermissionGuard";

type StaffRole = "admin" | "worker" | "courier" | "manager" | "strategist";

interface SystemStaff {
  id: string; 
  first_name: string; 
  last_name: string; 
  phone: string;
  role: StaffRole; 
  status: "active" | "onduty" | "offline"; 
  is_banned: boolean; 
  joined_date: string;
}

interface ActivityLog { 
  id: string; 
  action: string; 
  target: string; 
  timestamp: string; 
  admin: string; 
}

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "admin", label: "Admin" }, 
  { value: "manager", label: "Manager" },
  { value: "strategist", label: "Strategist" }, 
  { value: "worker", label: "Worker" },
  { value: "courier", label: "Courier" },
];

const PAGES_MATRIX = [
  { key: "dashboard", label: "Dashboard" },
  { key: "orders", label: "Orders" },
  { key: "new-order", label: "New Order" },
  { key: "staff", label: "Staff" },
  { key: "clients", label: "Clients" },
  { key: "services", label: "Services" },
  { key: "payments", label: "Payments" },
  { key: "receipt", label: "Receipt" },
  { key: "settings", label: "Settings" },
  { key: "security", label: "Security" },
  { key: "reports", label: "Reports" },
  { key: "system", label: "System Admin" }
];

const STATUS_COLORS: Record<string, string> = { 
  active: "#34d399", 
  onduty: "#dba96a", 
  offline: "#3a4460" 
};

const T = {
  bgBase: "#07090e", bgSurface: "#0c0f18", bgRaised: "#111520", bgElevated: "#161c2c",
  borderFaint: "rgba(255,255,255,0.05)", borderSoft: "rgba(255,255,255,0.09)", borderMid: "rgba(255,255,255,0.15)",
  textPrimary: "#edf0f8", textSec: "#9aa3b5", textTert: "#556070", textHint: "#2e3a4e",
  accent: "#6c72f3", accentDim: "rgba(108,114,243,0.13)", accentBord: "rgba(108,114,243,0.28)",
  emerald: "#34d399", emeraldDim: "rgba(52,211,153,0.1)", emeraldBord: "rgba(52,211,153,0.2)",
  ember: "#f87171", emberDim: "rgba(248,113,113,0.1)", emberBord: "rgba(248,113,113,0.32)",
};

const FONT = "'DM Sans', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', 'Fira Mono', ui-monospace, monospace";

const Toast = ({ msg, type, onClose }: any) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="no-print" style={{ position:"fixed", bottom:24, right:24, zIndex:10000,
      background: type==='error' ? T.emberDim : T.emeraldDim, border:`1px solid ${type==='error' ? T.emberBord : T.emeraldBord}`,
      borderRadius:10, padding:"12px 20px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 14px 36px rgba(0,0,0,0.45)", animation: "fadeInUp 0.3s ease both" }}>
      {type==='error' ? <AlertTriangle size={15} color={T.ember}/> : <Check size={15} color={T.emerald}/>}
      <span style={{ fontSize:14, color: type==='error' ? T.ember : T.emerald, fontWeight:500, fontFamily:FONT }}>{msg}</span>
      <button onClick={onClose} style={{ padding:4, background:"transparent", border:"none", color:T.textSec, cursor:"pointer" }}><X size={14}/></button>
    </div>
  );
};

export const SystemAdmin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"staff" | "settings" | "logs" | "permissions">("staff");
  const [staff, setStaff] = useState<SystemStaff[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [permissions, setPermissions] = useState<Record<string, { can_view: boolean; can_edit: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "worker" as StaffRole, password: "" });
  const [showPass, setShowPass] = useState(false);

  const { permission, loading: permLoading, canEdit } = usePermission("/system");

  const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type });

  const logAction = async (action: string, target: string) => {
    try { await supabase.from("audit_logs").insert([{ action, target, admin_name: "Admin" }]); } 
    catch (err) { console.error("Log error:", err); }
  };

  const broadcastPermissionUpdate = () => {
    window.dispatchEvent(new Event("permissions-updated"));
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, logsRes, settingsRes, permsRes] = await Promise.all([
        supabase.from("staff").select("id, first_name, last_name, phone, role, status, is_banned, joined_date").order("joined_date", { ascending: false }),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("system_settings").select("key, value"),
        supabase.from("role_permissions").select("*")
      ]);

      if (staffRes.error) throw staffRes.error;
      if (logsRes.error) throw logsRes.error;
      if (settingsRes.error) throw settingsRes.error;
      if (permsRes.error) throw permsRes.error;

      setStaff((staffRes.data || []).map((s: any) => ({ 
        ...s, role: s.role as StaffRole, status: s.status as any, 
        is_banned: s.is_banned || false, 
        joined_date: new Date(s.joined_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
      })));
      
      setLogs((logsRes.data || []).map((l: any) => ({ 
        id: l.id, action: l.action, target: l.target, admin: l.admin_name, 
        timestamp: new Date(l.created_at).toLocaleString() 
      })));

      const settingsMap: Record<string, boolean> = {};
      (settingsRes.data || []).forEach((s: any) => { settingsMap[s.key] = s.value; });
      setSettings(settingsMap);

      const permsMap: Record<string, { can_view: boolean; can_edit: boolean }> = {};
      (permsRes.data || []).forEach((p: any) => { permsMap[`${p.role}_${p.page}`] = { can_view: p.can_view, can_edit: p.can_edit }; });
      setPermissions(permsMap);
      
      setIsOffline(false);
    } catch (err) { 
      console.error("System admin fetch error:", err); 
      setIsOffline(true); 
      showToast("Failed to load system data", 'error'); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleAddStaff = async () => {
    if (!newStaff.firstName || !newStaff.email || newStaff.password.length < 6) { 
      showToast("Please fill all required fields (Password min 6 chars).", 'error'); 
      return; 
    }
    setAddingStaff(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: newStaff.email, 
        password: newStaff.password, 
        options: { data: { full_name: `${newStaff.firstName} ${newStaff.lastName}`, role: newStaff.role } } 
      });
      if (authError) throw authError;
      
      if (currentSession) { 
        await supabase.auth.setSession({ access_token: currentSession.access_token, refresh_token: currentSession.refresh_token }); 
      }
      
      const { error: insertError } = await supabase.from("staff").insert([{ 
        id: authData.user?.id, first_name: newStaff.firstName, last_name: newStaff.lastName, 
        phone: newStaff.phone, role: newStaff.role, status: "active", is_banned: false, 
        joined_date: new Date().toISOString() 
      }]);
      if (insertError) throw insertError;
      
      await logAction("Staff Account Created", `${newStaff.firstName} ${newStaff.lastName}`);
      showToast("Staff member added successfully", 'success');
      setShowAddModal(false);
      setNewStaff({ firstName: "", lastName: "", email: "", phone: "", role: "worker", password: "" });
      fetchAllData();
      broadcastPermissionUpdate();
    } catch (err: any) { 
      showToast(`Failed to add staff: ${err.message}`, 'error'); 
    } finally { 
      setAddingStaff(false); 
    }
  };

  const handleUpdateRole = async (id: string, newRole: StaffRole) => {
    setUpdating(id); 
    const targetStaff = staff.find(s => s.id === id);
    try { 
      const { error } = await supabase.from("staff").update({ role: newRole }).eq("id", id); 
      if (error) throw error; 
      setStaff(prev => prev.map(s => s.id === id ? { ...s, role: newRole } : s)); 
      await logAction(`Role changed to ${newRole}`, `${targetStaff?.first_name} ${targetStaff?.last_name}`); 
      showToast("Role updated successfully", 'success');
      broadcastPermissionUpdate();
    } catch (err) { 
      setIsOffline(true); 
      showToast("Failed to update role", 'error'); 
    } finally { 
      setUpdating(null); 
    }
  };

  const handleToggleBan = async (id: string, currentBanned: boolean) => {
    setUpdating(id); 
    const targetStaff = staff.find(s => s.id === id);
    try { 
      const { error } = await supabase.from("staff").update({ is_banned: !currentBanned }).eq("id", id); 
      if (error) throw error; 
      setStaff(prev => prev.map(s => s.id === id ? { ...s, is_banned: !currentBanned } : s)); 
      await logAction(currentBanned ? "User Unbanned" : "User Banned", `${targetStaff?.first_name} ${targetStaff?.last_name}`); 
      showToast(currentBanned ? "User unbanned" : "User banned", 'success');
      broadcastPermissionUpdate();
    } catch (err) { 
      setIsOffline(true); 
      showToast("Failed to update ban status", 'error'); 
    } finally { 
      setUpdating(null); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this staff member?")) return;
    setUpdating(id); 
    const targetStaff = staff.find(s => s.id === id);
    try { 
      const { error } = await supabase.from("staff").delete().eq("id", id); 
      if (error) throw error; 
      setStaff(prev => prev.filter(s => s.id !== id)); 
      await logAction("Staff Deleted", `${targetStaff?.first_name} ${targetStaff?.last_name}`); 
      showToast("Staff member deleted", 'success');
      broadcastPermissionUpdate();
    } catch (err) { 
      setIsOffline(true); 
      showToast("Failed to delete staff member", 'error'); 
    } finally { 
      setUpdating(null); 
    }
  };

  const handleToggleSetting = async (key: string, currentValue: boolean) => {
    const newValue = !currentValue; 
    setSettings(prev => ({ ...prev, [key]: newValue }));
    try { 
      const { error } = await supabase.from("system_settings").update({ value: newValue }).eq("key", key); 
      if (error) throw error; 
      await logAction(`Setting Toggled: ${key}`, `Set to ${newValue ? 'ON' : 'OFF'}`); 
      showToast(`${key.replace(/_/g, ' ')} updated`, 'success'); 
    } catch (err) { 
      setSettings(prev => ({ ...prev, [key]: currentValue })); 
      showToast("Failed to update setting", 'error'); 
    }
  };

  const handleTogglePermission = async (role: string, page: string, type: 'can_view' | 'can_edit', currentValue: boolean) => {
    const newValue = !currentValue;
    const key = `${role}_${page}`;
    setPermissions(prev => ({ ...prev, [key]: { ...prev[key], [type]: newValue } }));
    
    try {
      const { error } = await supabase.from("role_permissions").upsert({ role, page, [type]: newValue });
      if (error) throw error;
      await logAction(`Permission Updated`, `${role} ${type.replace('can_', '')} on ${page} set to ${newValue ? 'ON' : 'OFF'}`);
      showToast(`${role} ${type.replace('can_', '')} for ${page} updated`, 'success');
      broadcastPermissionUpdate();
    } catch (err) {
      setPermissions(prev => ({ ...prev, [key]: { ...prev[key], [type]: currentValue } }));
      showToast("Failed to update permission", 'error');
    }
  };

  const filteredStaff = staff.filter(s => { 
    if (!search) return true; 
    const q = search.toLowerCase(); 
    return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || s.phone.includes(q) || s.role.includes(q); 
  });

  if (loading || permLoading) { 
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: T.textTert, fontFamily: FONT }}>
        <Loader2 size={20} className="spin" style={{ marginRight: 12 }} /> Loading system admin...
      </div>
    ); 
  }

  return (
    <PermissionGuard path="/system">
      <div className="sys-admin-root" style={{ background: T.bgBase, minHeight: "100vh", color: T.textPrimary, fontFamily: FONT }}>
        <style>{`
          @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          .spin { animation: spin 0.8s linear infinite; }
          .sys-admin-root * { box-sizing: border-box; }
          .sys-tabs { display: flex; gap: 4px; background: ${T.bgRaised}; padding: 4px; border-radius: 10px; border: 1px solid ${T.borderSoft}; flex-wrap: wrap; }
          .sys-tab { padding: 8px 16px; border-radius: 7px; font-size: 13px; font-weight: 600; color: ${T.textSec}; cursor: pointer; transition: all 0.18s ease; display: flex; align-items: center; gap: 8px; border: none; background: transparent; font-family: ${FONT}; }
          .sys-tab:hover { color: ${T.textPrimary}; background: rgba(255,255,255,0.05); }
          .sys-tab.active { background: ${T.accent}; color: #fff; }
          .sys-table { width: 100%; border-collapse: collapse; min-width: 760px; }
          .sys-table th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: ${T.textTert}; padding: 13px 18px; border-bottom: 1px solid ${T.borderFaint}; background: rgba(255,255,255,0.015); }
          .sys-table td { padding: 12px 18px; vertical-align: middle; border-bottom: 1px solid ${T.borderFaint}; font-size: 13.5px; }
          .sys-row { cursor: pointer; transition: background 0.15s ease; }
          .sys-row:hover { background: rgba(255,255,255,0.02); }
          .action-btn { padding: 8px 12px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; transition: transform 0.15s ease; display: inline-flex; align-items: center; gap: 6px; border: 1px solid transparent; font-family: ${FONT}; }
          .action-btn:hover { transform: translateY(-1px); }
          .action-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
          .modal-input { width: 100%; padding: 10px 12px; background: ${T.bgElevated}; border: 1px solid ${T.borderSoft}; border-radius: 8px; color: ${T.textPrimary}; font-size: 13.5px; outline: none; font-family: ${FONT}; transition: border-color 0.15s; }
          .modal-input:focus { border-color: ${T.accentBord}; }
          .perm-check { width: 18px; height: 18px; cursor: pointer; accent-color: ${T.emerald}; }
          @media (max-width: 768px) {
            .sys-table thead { display: none; }
            .sys-row { display: block; padding: 16px; border-bottom: 1px solid ${T.borderSoft}; }
            .sys-row td { display: block; padding: 6px 0 6px 40%; border: none; text-align: left; position: relative; font-size: 13px; }
            .sys-row td::before { content: attr(data-label); position: absolute; left: 0; top: 6px; font-size: 10px; color: ${T.textTert}; text-transform: uppercase; font-weight: 700; }
            .action-btn { min-height: 44px; min-width: 44px; justify-content: center; margin-top: 8px; width: 100%; }
          }
        `}</style>

        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: 10 }}>
                <Shield size={20} color={T.accent} /> System Administration
              </h1>
              <p style={{ fontSize: "12.5px", color: T.textTert, margin: "6px 0 0" }}>Full control over staff access, system settings, and audit logs.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => fetchAllData()} className="action-btn" style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, color: T.textSec }}>
                <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
              </button>
              <button onClick={() => navigate("/staff")} className="action-btn" style={{ background: T.accent, color: "#fff" }}>
                <User size={14} /> Back to Staff
              </button>
            </div>
          </div>

          {isOffline && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", background: T.emberDim, border: `1px solid ${T.emberBord}`, borderRadius: "10px", padding: "10px 16px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#fca5a5" }}>
                <WifiOff size={15} color={T.ember} /><span>System is offline — showing cached data. Changes may not save.</span>
              </div>
              <button onClick={() => fetchAllData()} className="action-btn" style={{ background: "rgba(248,113,113,0.1)", border: `1px solid ${T.emberBord}`, color: T.ember }}>
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          <div className="sys-tabs" style={{ marginBottom: "20px" }}>
            <button className={`sys-tab ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}><User size={14} /> Staff Access</button>
            <button className={`sys-tab ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}><LayoutGrid size={14} /> Permissions Matrix</button>
            <button className={`sys-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={14} /> System Settings</button>
            <button className={`sys-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}><Activity size={14} /> Activity Logs</button>
          </div>

          {activeTab === 'staff' && (
            <div style={{ animation: "fadeInUp 0.3s ease both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: "9px", padding: "0 12px", maxWidth: "420px", width: "100%" }}>
                  <Search size={13} color={T.textTert} style={{ marginRight: "8px" }} />
                  <input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.textPrimary, fontSize: "13.5px", padding: "10px 0", fontFamily: FONT }} />
                  {search && <button onClick={() => setSearch("")} style={{ background: T.bgElevated, border: "none", borderRadius: "5px", color: T.textTert, padding: "4px", cursor: "pointer", display: "flex" }}><X size={11} /></button>}
                </div>
                {canEdit && <button onClick={() => setShowAddModal(true)} className="action-btn" style={{ background: T.emerald, color: "#03261a", fontWeight: 700 }}><Plus size={14} /> Add Staff Member</button>}
              </div>
              <div style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="sys-table">
                    <thead><tr><th>Staff</th><th>Role</th><th>Status</th><th>Joined</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
                    <tbody>
                      {filteredStaff.length === 0 ? (<tr><td colSpan={5} style={{ textAlign: "center", padding: "48px 20px", color: T.textTert }}>No staff match your search</td></tr>) : (
                        filteredStaff.map((s) => (
                          <tr key={s.id} className="sys-row">
                            <td data-label="Staff"><div style={{ display: "flex", alignItems: "center", gap: "11px" }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(155deg, hsl(${(s.first_name.charCodeAt(0) * 37) % 360},40%,24%), hsl(${(s.first_name.charCodeAt(0) * 37) % 360},35%,14%))`, color: `hsl(${(s.first_name.charCodeAt(0) * 37) % 360},65%,74%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{s.first_name.charAt(0)}{s.last_name.charAt(0)}</div><div><div style={{ fontWeight: 600, color: T.textPrimary }}>{s.first_name} {s.last_name}</div><div style={{ fontSize: "11.5px", color: T.textTert, fontFamily: MONO }}>{s.phone}</div></div></div></td>
                            <td data-label="Role">{canEdit ? (<select value={s.role} onChange={(e) => handleUpdateRole(s.id, e.target.value as StaffRole)} disabled={updating === s.id} style={{ background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: "7px", color: T.textPrimary, fontSize: "12.5px", padding: "6px 10px", fontFamily: FONT, cursor: updating === s.id ? "not-allowed" : "pointer", opacity: updating === s.id ? 0.6 : 1 }}>{ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>) : <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: T.accentDim, color: T.accent, border: `1px solid ${T.accentBord}` }}>{s.role}</span>}</td>
                            <td data-label="Status"><span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 700, padding: "5px 11px", borderRadius: "20px", border: `1px solid ${STATUS_COLORS[s.status]}40`, background: `${STATUS_COLORS[s.status]}12`, color: STATUS_COLORS[s.status] }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[s.status] }} />{s.status}</span></td>
                            <td data-label="Joined" style={{ color: T.textTert, fontSize: "12.5px" }}>{s.joined_date}</td>
                            <td data-label="Actions" style={{ textAlign: "right" }}>{canEdit && (<div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", flexWrap: "wrap" }}><button onClick={() => handleToggleBan(s.id, s.is_banned)} disabled={updating === s.id} className="action-btn" style={{ border: `1px solid ${s.is_banned ? T.emberBord : T.emeraldBord}`, background: s.is_banned ? T.emberDim : T.emeraldDim, color: s.is_banned ? T.ember : T.emerald }}>{s.is_banned ? <Unlock size={12} /> : <Lock size={12} />} {s.is_banned ? "Unban" : "Ban"}</button><button onClick={() => handleDelete(s.id)} disabled={updating === s.id} className="action-btn" style={{ border: `1px solid ${T.emberBord}`, background: T.emberDim, color: T.ember }}><Trash2 size={12} /></button></div>)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div style={{ animation: "fadeInUp 0.3s ease both", background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderFaint}`, background: "rgba(255,255,255,0.015)" }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.textPrimary, display: "flex", alignItems: "center", gap: 8 }}><LayoutGrid size={16} color={T.accent} /> Role Permissions Matrix</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textTert }}>Toggle access for each role. Changes apply instantly across the entire system.</p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="sys-table" style={{ minWidth: "1100px" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "150px" }}>Role</th>
                      {PAGES_MATRIX.map(p => (
                        <th key={p.key} colSpan={2} style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>{p.label}</th>
                      ))}
                    </tr>
                    <tr>
                      <th></th>
                      {PAGES_MATRIX.map(p => (
                        <React.Fragment key={p.key}>
                          <th style={{ textAlign: "center", fontSize: 9, padding: "8px 4px", color: T.textHint }}>View</th>
                          <th style={{ textAlign: "center", fontSize: 9, padding: "8px 4px", color: T.textHint, borderRight: "1px solid rgba(255,255,255,0.05)" }}>Edit</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROLE_OPTIONS.map(role => (
                      <tr key={role.value}>
                        <td data-label="Role" style={{ fontWeight: 600, color: T.textPrimary, textTransform: "capitalize" }}>{role.label}</td>
                        {PAGES_MATRIX.map(page => {
                          const key = `${role.value}_${page.key}`;
                          const perms = permissions[key] || { can_view: false, can_edit: false };
                          return (
                            <React.Fragment key={page.key}>
                              <td data-label={`${page.label} View`} style={{ textAlign: "center", padding: "12px 4px" }}>
                                <input type="checkbox" className="perm-check" checked={perms.can_view} onChange={() => canEdit && handleTogglePermission(role.value, page.key, 'can_view', perms.can_view)} disabled={!canEdit} />
                              </td>
                              <td data-label={`${page.label} Edit`} style={{ textAlign: "center", padding: "12px 4px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                                <input type="checkbox" className="perm-check" checked={perms.can_edit} onChange={() => canEdit && handleTogglePermission(role.value, page.key, 'can_edit', perms.can_edit)} disabled={!canEdit} />
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ animation: "fadeInUp 0.3s ease both", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {[
                { key: "maintenance_mode", label: "Maintenance Mode", desc: "Blocks new orders from being placed" },
                { key: "require_2fa_admin", label: "Require 2FA for Admins", desc: "Forces 2FA for all admin accounts" },
                { key: "auto_archive_completed", label: "Auto-Archive Completed", desc: "Automatically archives orders after 30 days" },
                { key: "allow_new_staff_registration", label: "Allow New Staff Registration", desc: "Prevents new staff accounts from being created" }
              ].map((setting) => (
                <div key={setting.key} style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{setting.label}</div><div style={{ fontSize: 12, color: T.textTert }}>{setting.desc}</div></div>
                  <div className={`toggle-switch ${settings[setting.key] ? 'on' : 'off'}`} onClick={() => canEdit && handleToggleSetting(setting.key, settings[setting.key] || false)} style={{ width: 44, height: 24, borderRadius: 12, position: "relative", cursor: canEdit ? "pointer" : "not-allowed", transition: "background 0.2s", background: settings[setting.key] ? T.emerald : T.textHint }}>
                    <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, transition: "left 0.2s", left: settings[setting.key] ? 22 : 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div style={{ animation: "fadeInUp 0.3s ease both", background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 14, overflow: "hidden" }}>
              <table className="sys-table">
                <thead><tr><th>Action</th><th>Target</th><th>Admin</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {logs.length === 0 ? (<tr><td colSpan={4} style={{ textAlign: "center", padding: "48px 20px", color: T.textTert }}>No activity recorded yet</td></tr>) : logs.map((log) => (
                    <tr key={log.id} className="sys-row">
                      <td data-label="Action" style={{ color: T.textPrimary, fontWeight: 500 }}>{log.action}</td>
                      <td data-label="Target" style={{ color: T.textSec }}>{log.target}</td>
                      <td data-label="Admin" style={{ color: T.accent, fontWeight: 600 }}>{log.admin}</td>
                      <td data-label="Timestamp" style={{ color: T.textTert, fontSize: 12.5, fontFamily: MONO }}>{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p style={{ fontSize: "11px", color: T.textTert, marginTop: "24px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Shield size={12} /> Admin Page Only. Do not make changes unless instructed by a System Administrator.</p>
        </div>

        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,5,9,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }} onClick={() => setShowAddModal(false)}>
            <div style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 16, width: 460, maxWidth: '100%', padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><User size={16} color={T.emerald} /> Add New Staff Member</h3>
              <p style={{ margin: '0 0 16px', fontSize: 12.5, color: T.textTert }}>Create a new account and assign initial permissions.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ fontSize: 10.5, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, display: 'block', marginBottom: 6 }}>First Name</label><input className="modal-input" value={newStaff.firstName} onChange={e => setNewStaff({...newStaff, firstName: e.target.value})} placeholder="e.g. Kwame" /></div>
                <div><label style={{ fontSize: 10.5, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, display: 'block', marginBottom: 6 }}>Last Name</label><input className="modal-input" value={newStaff.lastName} onChange={e => setNewStaff({...newStaff, lastName: e.target.value})} placeholder="e.g. Asante" /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize: 10.5, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, display: 'block', marginBottom: 6 }}>Email Address</label><input className="modal-input" type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} placeholder="staff@chapmanprestige.com" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ fontSize: 10.5, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, display: 'block', marginBottom: 6 }}>Phone Number</label><input className="modal-input" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} placeholder="+233..." /></div>
                <div><label style={{ fontSize: 10.5, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, display: 'block', marginBottom: 6 }}>Role / Permission</label><select className="modal-input" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as StaffRole})} style={{ cursor: "pointer" }}>{ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
              </div>
              <div style={{ marginBottom: 20 }}><label style={{ fontSize: 10.5, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, display: 'block', marginBottom: 6 }}>Temporary Password</label><div style={{ position: 'relative' }}><input className="modal-input" type={showPass ? "text" : "password"} value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} placeholder="Min 6 characters" style={{ paddingRight: 40 }} /><button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.textSec, cursor: 'pointer' }}>{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button></div></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: 10, background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textSec, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
                <button onClick={handleAddStaff} disabled={addingStaff} style={{ flex: 1.5, padding: 10, background: T.emerald, border: 'none', borderRadius: 8, color: '#03261a', fontWeight: 700, cursor: addingStaff ? 'not-allowed' : 'pointer', opacity: addingStaff ? 0.6 : 1, fontFamily: FONT, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>{addingStaff ? <Loader2 size={14} className="spin" /> : <Check size={14} />} {addingStaff ? "Creating..." : "Create Account"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default SystemAdmin;