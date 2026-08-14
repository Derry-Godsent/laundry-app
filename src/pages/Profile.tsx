import { useState, useEffect } from "react";
import { User, Mail, Shield, Phone, Save, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";

const T = {
  bgBase: "#07090e", bgSurface: "#0c0f18", bgRaised: "#111520", bgElevated: "#161c2c",
  borderFaint: "rgba(255,255,255,0.05)", borderSoft: "rgba(255,255,255,0.09)", borderMid: "rgba(255,255,255,0.15)",
  textPrimary: "#edf0f8", textSec: "#9aa3b5", textTert: "#556070", textHint: "#2e3a4e",
  accent: "#6c72f3", accentDim: "rgba(108,114,243,0.13)", accentBord: "rgba(108,114,243,0.28)",
  emerald: "#34d399", emeraldDim: "rgba(52,211,153,0.1)", emeraldBord: "rgba(52,211,153,0.2)",
  danger: "#f87171", dangerDim: "rgba(248,113,113,0.1)", dangerBord: "rgba(248,113,113,0.25)",
};

const FONT = "'DM Sans', 'Inter', system-ui, sans-serif";

export const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from("staff").select("*").eq("id", session.user.id).maybeSingle();
        setStaff(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 4000);
  };

  if (loading) return <div style={{ padding: 40, color: T.textTert, fontFamily: FONT }}>Loading profile...</div>;

  const roleColor = staff?.role === "admin" ? T.accent : staff?.role === "manager" ? "#22d3ee" : T.emerald;

  return (
    <div style={{ padding: "32px", maxWidth: 800, margin: "0 auto", fontFamily: FONT, color: T.textPrimary }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: "-0.03em" }}>My Profile</h2>

      {message && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 24, display: "flex", alignItems: "center", gap: 10,
          background: message.type === "success" ? T.emeraldDim : T.dangerDim,
          border: `1px solid ${message.type === "success" ? T.emeraldBord : T.dangerBord}`,
          color: message.type === "success" ? T.emerald : T.danger, fontSize: 13, fontWeight: 500
        }}>
          {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* User Info Card */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={16} color={T.accent} /> Account Information
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${roleColor}22`, color: roleColor, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{staff?.first_name} {staff?.last_name || "User"}</div>
                <div style={{ fontSize: 11, color: T.textTert, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>{staff?.role || "Staff"}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: T.textSec, fontSize: 13.5 }}>
              <Mail size={16} color={T.textTert} /> {user?.email}
            </div>
            {staff?.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: T.textSec, fontSize: 13.5 }}>
                <Phone size={16} color={T.textTert} /> {staff.phone}
              </div>
            )}
          </div>
        </div>

        {/* Change Password Card */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={16} color={T.accent} /> Security
          </h3>
          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, display: "block", marginBottom: 6 }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    width: "100%", padding: "10px 40px 10px 12px", background: T.bgSurface,
                    border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textPrimary,
                    fontSize: 13.5, outline: "none", fontFamily: FONT
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textSec, cursor: "pointer" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !newPassword}
              style={{
                padding: "10px 16px", background: T.accent, border: "none", borderRadius: 8,
                color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: saving || !newPassword ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: FONT,
                opacity: saving || !newPassword ? 0.6 : 1, transition: "opacity 0.15s"
              }}
            >
              {saving ? "Updating..." : <><Save size={14} /> Update Password</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;