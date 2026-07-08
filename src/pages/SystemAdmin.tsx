import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, User, Trash2, RefreshCw, WifiOff, Check, X } from "lucide-react";
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
  last_sign_in: string | null;
}

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "strategist", label: "Strategist" },
  { value: "worker", label: "Worker" },
  { value: "courier", label: "Courier" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "#34d399",
  onduty: "#dba96a",
  offline: "#3a4460",
};

export const SystemAdmin = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<SystemStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetModal, setResetModal] = useState<{id: string; name: string; email: string} | null>(null);
const [newEmail, setNewEmail] = useState("");
const [newPassword, setNewPassword] = useState("");
const [showNewPass, setShowNewPass] = useState(false);
const [resetting, setResetting] = useState(false);

  const { permission, loading: permLoading, canEdit } = usePermission("/system");

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name, phone, role, status, is_banned, joined_date")
        .order("joined_date", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((s: any) => ({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        phone: s.phone,
        role: s.role as StaffRole,
        status: s.status as "active" | "onduty" | "offline",
        is_banned: s.is_banned || false,
        joined_date: new Date(s.joined_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        last_sign_in: null, // Would require auth logs; optional enhancement
      }));
      setStaff(mapped);
      setIsOffline(false);
    } catch (err) {
      console.error("System admin fetch error:", err);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleUpdateRole = async (id: string, newRole: StaffRole) => {
    setUpdating(id);
    try {
      const { error } = await supabase.from("staff").update({ role: newRole }).eq("id", id);
      if (error) throw error;
      setStaff(prev => prev.map(s => s.id === id ? { ...s, role: newRole } : s));
    } catch (err) {
      console.error("Role update error:", err);
      setIsOffline(true);
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleBan = async (id: string, currentBanned: boolean) => {
    setUpdating(id);
    try {
      const { error } = await supabase.from("staff").update({ is_banned: !currentBanned }).eq("id", id);
      if (error) throw error;
      setStaff(prev => prev.map(s => s.id === id ? { ...s, is_banned: !currentBanned } : s));
    } catch (err) {
      console.error("Ban toggle error:", err);
      setIsOffline(true);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this staff member? This will remove their access permanently.")) return;
    setUpdating(id);
    try {
      // Delete from staff table (auth user remains; optional: add auth.admin.deleteUser later via Edge Function)
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
      setStaff(prev => prev.filter(s => s.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      console.error("Delete error:", err);
      setIsOffline(true);
    } finally {
      setUpdating(null);
    }
  };

  const handleResetCredentials = async () => {
  if (!resetModal) return;
  if (!newPassword.trim() || newPassword.length < 8) {
    alert("Password must be at least 8 characters.");
    return;
  }
  
  setResetting(true);
  try {
    const response = await fetch('/api/reset-credentials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_ADMIN_API_TOKEN}`,
  },
  body: JSON.stringify({
    userId: resetModal.id,
    newEmail: newEmail.trim() || undefined,
    newPassword: newPassword.trim() || undefined,
  }),
});

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update credentials');

    // Update local state to reflect changes
    setStaff(prev => prev.map(s => 
      s.id === resetModal.id 
        ? { ...s, phone: newEmail || s.phone } // Adjust if email stored separately
        : s
    ));
    
    alert(`Credentials updated for ${resetModal.name}.\n\nNew Email: ${newEmail || '(unchanged)'}\nNew Password: ${newPassword}\n\nPlease share the new password securely.`);
    
    setResetModal(null);
    setNewEmail("");
    setNewPassword("");
    setShowNewPass(false);
  } catch (err: any) {
    console.error("Reset error:", err);
    alert(`Failed to reset credentials: ${err.message}`);
  } finally {
    setResetting(false);
  }
};
  const filtered = staff.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.role.toLowerCase().includes(q)
    );
  });

  if (loading || permLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#9aa3b5" }}>
        Loading system admin...
      </div>
    );
  }

  return (
    <PermissionGuard path="/system">
      <div style={{ padding: "28px 32px", background: "#07090e", minHeight: "100vh", color: "#edf0f8", fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "22px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>System Administration</h1>
            <p style={{ fontSize: "12.5px", color: "#556070", margin: "6px 0 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={14} /> Manage staff access, roles, and permissions
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => fetchStaff()}
              style={{
                display: "flex", alignItems: "center", gap: "7px", padding: "9px 14px", borderRadius: "9px",
                border: "1px solid rgba(255,255,255,0.09)", background: "#111520", color: "#9aa3b5",
                fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                transition: "transform 0.16s ease, border-color 0.16s ease"
              }}
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
            </button>
            <button
              onClick={() => navigate("/staff")}
              style={{
                display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", borderRadius: "9px",
                background: "linear-gradient(155deg, #6c72f3, #5459d6)", border: "none", color: "#fff",
                fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
              }}
            >
              <User size={14} /> Back to Staff
            </button>
          </div>
        </div>

        {/* Offline Banner */}
        {isOffline && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
            background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "10px",
            padding: "10px 16px", marginBottom: "18px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#fca5a5" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f87171" }} />
              <WifiOff size={15} color="#f87171" />
              <span>System is offline — showing cached data. Changes may not save.</span>
            </div>
            <button onClick={() => fetchStaff()} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "7px",
              background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)",
              color: "#f87171", fontSize: "12.5px", fontWeight: 600, cursor: "pointer"
            }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", background: "#111520", border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "9px", padding: "0 12px", marginBottom: "16px", maxWidth: "420px"
        }}>
          <Search size={13} color="#556070" style={{ marginRight: "8px" }} />
          <input
            placeholder="Search staff by name, phone, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none", color: "#edf0f8",
              fontSize: "13.5px", padding: "10px 0", fontFamily: "inherit"
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background: "#161c2c", border: "none", borderRadius: "5px", color: "#556070",
              padding: "4px", cursor: "pointer", display: "flex"
            }}>
              <X size={11} />
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ background: "#111520", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "#556070", padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>Staff</th>
                  <th style={{ textAlign: "left", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "#556070", padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>Role</th>
                  <th style={{ textAlign: "left", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "#556070", padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>Status</th>
                  <th style={{ textAlign: "left", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "#556070", padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>Joined</th>
                  <th style={{ textAlign: "right", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "#556070", padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "48px 20px", color: "#556070", fontSize: "13.5px" }}>
                      No staff match your search
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
                        background: selectedId === s.id ? "rgba(255,255,255,0.02)" : "transparent",
                        transition: "background 0.15s ease"
                      }}
                    >
                      <td style={{ padding: "12px 18px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: `linear-gradient(155deg, hsl(${(s.first_name.charCodeAt(0) * 37) % 360},40%,24%), hsl(${(s.first_name.charCodeAt(0) * 37) % 360},35%,14%))`,
                            color: `hsl(${(s.first_name.charCodeAt(0) * 37) % 360},65%,74%)`,
                            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12
                          }}>
                            {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#edf0f8" }}>{s.first_name} {s.last_name}</div>
                            <div style={{ fontSize: "11.5px", color: "#556070", fontFamily: "'DM Mono', monospace" }}>{s.phone.replace('+233', '+233 ').replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3")}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 18px", verticalAlign: "middle" }}>
                        {canEdit ? (
                          <select
                            value={s.role}
                            onChange={(e) => handleUpdateRole(s.id, e.target.value as StaffRole)}
                            disabled={updating === s.id}
                            style={{
                              background: "#161c2c", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "7px",
                              color: "#edf0f8", fontSize: "12.5px", padding: "6px 10px", fontFamily: "inherit",
                              cursor: updating === s.id ? "not-allowed" : "pointer", opacity: updating === s.id ? 0.6 : 1
                            }}
                          >
                            {ROLE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{
                            fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px",
                            background: "rgba(108,114,243,0.12)", color: "#6c72f3", border: "1px solid rgba(108,114,243,0.35)"
                          }}>
                            {s.role.charAt(0).toUpperCase() + s.role.slice(1)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 18px", verticalAlign: "middle" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 700,
                          padding: "5px 11px", borderRadius: "20px", border: `1px solid ${STATUS_COLORS[s.status]}40`,
                          background: `${STATUS_COLORS[s.status]}12`, color: STATUS_COLORS[s.status]
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[s.status] }} />
                          {s.status === "active" ? "Active" : s.status === "onduty" ? "On Duty" : "Offline"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 18px", verticalAlign: "middle", fontSize: "12.5px", color: "#556070" }}>
                        {s.joined_date}
                      </td>
                      <td style={{ padding: "12px 18px", verticalAlign: "middle", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          {canEdit && (
  <>
    {/* Reset Credentials Button */}
    <button
      onClick={(e) => { 
        e.stopPropagation(); 
        setResetModal({ id: s.id, name: `${s.first_name} ${s.last_name}`, email: "" }); 
        setNewEmail(""); 
        setNewPassword(""); 
      }}
      style={{
        padding: "6px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: 600,
        border: "1px solid rgba(108,114,243,0.25)", background: "rgba(108,114,243,0.1)",
        color: "#6c72f3", cursor: "pointer", transition: "transform 0.15s ease"
      }}
      title="Reset email and password"
    >
      Reset
    </button>

    {/* Ban/Unban Button */}
    <button
      onClick={(e) => { e.stopPropagation(); handleToggleBan(s.id, s.is_banned); }}
      disabled={updating === s.id}
      style={{
        padding: "6px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: 600,
        border: `1px solid ${s.is_banned ? "rgba(248,113,113,0.25)" : "rgba(52,211,153,0.25)"}`,
        background: s.is_banned ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)",
        color: s.is_banned ? "#f87171" : "#34d399", cursor: updating === s.id ? "not-allowed" : "pointer",
        opacity: updating === s.id ? 0.6 : 1, transition: "transform 0.15s ease"
      }}
      title={s.is_banned ? "Unban user" : "Ban user"}
    >
      {s.is_banned ? "Unban" : "Ban"}
    </button>

    {/* Delete Button */}
    <button
      onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
      disabled={updating === s.id}
      style={{
        padding: "6px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: 600,
        border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.1)",
        color: "#f87171", cursor: updating === s.id ? "not-allowed" : "pointer",
        opacity: updating === s.id ? 0.6 : 1, transition: "transform 0.15s ease"
      }}
      title="Delete staff"
    >
      <Trash2 size={11} />
    </button>
  </>
)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <p style={{ fontSize: "11px", color: "#556070", marginTop: "16px", textAlign: "center" }}>
          Admin Page Only. Do not make any changes to this page unless otherwise instructed by an Admin.
        </p>
      </div>
      {resetModal && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(4,5,9,0.8)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
  }} onClick={() => setResetModal(null)}>
    <div style={{
      background: '#0c0f18', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16,
      width: 420, maxWidth: '100%', padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
    }} onClick={e => e.stopPropagation()}>
      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Reset Credentials</h3>
      <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#556070' }}>
        Update login details for <strong>{resetModal.name}</strong>
      </p>
      
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10.5, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, display: 'block', marginBottom: 6 }}>Email Address</label>
        <input 
          value={newEmail} 
          onChange={e => setNewEmail(e.target.value)} 
          placeholder={resetModal.email}
          style={{ width: '100%', padding: '10px 12px', background: '#111520', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#edf0f8', fontSize: 13.5, outline: 'none' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 10.5, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, display: 'block', marginBottom: 6 }}>New Password</label>
        <div style={{ position: 'relative' }}>
          <input 
            type={showNewPass ? "text" : "password"}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
            style={{ width: '100%', padding: '10px 40px 10px 12px', background: '#111520', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#edf0f8', fontSize: 13.5, outline: 'none' }}
          />
          <button 
            onClick={() => setShowNewPass(!showNewPass)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9aa3b5', cursor: 'pointer', fontSize: 11 }}
          >
            {showNewPass ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setResetModal(null)} style={{ flex: 1, padding: 10, background: '#161c2c', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#9aa3b5', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button 
          onClick={handleResetCredentials} 
          disabled={resetting}
          style={{ flex: 1.5, padding: 10, background: '#6c72f3', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: resetting ? 'not-allowed' : 'pointer', opacity: resetting ? 0.6 : 1 }}
        >
          {resetting ? "Processing..." : "Apply Credentials"}
        </button>
      </div>
    </div>
  </div>
)}
    </PermissionGuard>
  );
};

export default SystemAdmin;