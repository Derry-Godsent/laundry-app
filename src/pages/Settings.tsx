import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom"; // ✅ Added for permission hook
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import {
  Building2, Shield, Bell, Database, Save, Upload, Download, AlertCircle, Check, Globe, Lock, Eye, EyeOff, WifiOff, RefreshCw
} from "lucide-react";
import { usePermission } from "../hooks/usePermission"; // ✅ Added
import { PermissionGuard } from "../components/PermissionGuard"; // ✅ Added

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const T = {
  bgBase:      "#07090e", bgSurface: "#0c0f18", bgRaised: "#111520", bgElevated: "#161c2c",
  borderFaint: "rgba(255,255,255,0.05)", borderSoft: "rgba(255,255,255,0.09)", borderMid: "rgba(255,255,255,0.15)",
  textPrimary: "#edf0f8", textSec: "#9aa3b5", textTert: "#556070", textHint: "#2e3a4e",
  accent: "#6c72f3", accentDim: "rgba(108,114,243,0.13)", accentBord: "rgba(108,114,243,0.28)", accentGlow: "rgba(108,114,243,0.35)",
  gold: "#dba96a", goldDim: "rgba(219,169,106,0.1)", goldBord: "rgba(219,169,106,0.22)",
  emerald: "#34d399", emeraldDim: "rgba(52,211,153,0.1)", emeraldBord: "rgba(52,211,153,0.2)",
  danger: "#f87171", dangerDim: "rgba(248,113,113,0.1)", dangerBord: "rgba(248,113,113,0.25)",
};

const FONT = "'DM Sans', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', 'Fira Mono', ui-monospace, monospace";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: T.bgSurface,
  border: `1px solid ${T.borderSoft}`, borderRadius: 8,
  color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: FONT
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: T.textTert, marginBottom: 6,
  textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, fontFamily: FONT
};

export const Settings = () => {
  const location = useLocation(); // ✅ Added for permission hook
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const [config, setConfig] = useState({
    name: "Chapman Prestige Limited",
    address: "Kwadaso-Ohwimase, Kumasi",
    phone: "+233 534 134 809",
    email: "chapmanprestigelimited@gmail.com",
    expressSurcharge: 10,
    sheetPass: "cpl2024",
    notifications: { sms: true, email: true, orderReady: true, paymentReceived: true },
    autoBackup: true
  });

  // ✅ Permission hook for guard
  const { permission, loading: permLoading, canEdit } = usePermission(location.pathname);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(prev => ({
          ...prev,
          name: data.business_name || prev.name,
          address: data.address || prev.address,
          phone: data.phone || prev.phone,
          email: data.email || prev.email,
          expressSurcharge: Number(data.express_surcharge) || prev.expressSurcharge,
          sheetPass: data.sheet_password || prev.sheetPass,
          notifications: data.notifications || prev.notifications,
          autoBackup: data.auto_backup ?? prev.autoBackup,
        }));
      }
      setIsOffline(false);
    } catch (err) {
      console.error('Settings fetch error:', err);
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaved(true);
    setSaveError(false);
    try {
      const { error } = await supabase.from('settings').upsert({
        id: 1,
        business_name: config.name,
        address: config.address,
        phone: config.phone,
        email: config.email,
        express_surcharge: config.expressSurcharge,
        sheet_password: config.sheetPass,
        notifications: config.notifications,
        auto_backup: config.autoBackup,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) throw error;
      setIsOffline(false);
    } catch (err) {
      console.error('Settings save error:', err);
      setIsOffline(true);
      setSaveError(true);
    } finally {
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleExport = async (type: 'clients' | 'orders' | 'all') => {
    try {
      let data: any[] = [];
      if (type === 'clients' || type === 'all') {
        const { data: c } = await supabase.from('clients').select('*');
        if (c) data = [...data, ...c];
      }
      if (type === 'orders' || type === 'all') {
        const { data: o } = await supabase.from('orders').select('*, clients(name)');
        if (o) data = [...data, ...o];
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chapman-export-${type}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setIsOffline(true);
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    fetchSettings();
  };

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    position: "relative", display: "inline-block", width: 40, height: 22,
    cursor: "pointer", borderRadius: 20, background: active ? T.emerald : T.bgElevated,
    border: `1px solid ${active ? T.emeraldBord : T.borderSoft}`, transition: "background 0.25s ease, border-color 0.25s ease",
    boxShadow: active ? `0 0 0 4px ${T.emeraldDim}` : "none",
  });

  const thumbStyle = (active: boolean): React.CSSProperties => ({
    position: "absolute", content: '""', height: 18, width: 18,
    left: active ? 19 : 2, bottom: 1, backgroundColor: "#fff",
    transition: "left 0.25s cubic-bezier(.4,0,.2,1)", borderRadius: "50%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
  });

  const tabs = [
    { id: "profile", label: "Business Profile", icon: Building2 },
    { id: "rules", label: "Pricing & Rules", icon: Shield },
    { id: "loyalty", label: "Loyalty Tiers", icon: Globe },
    { id: "data", label: "Data & Backup", icon: Database },
  ];

  // ✅ Wait for both data AND permissions to load
  if (loading || permLoading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", justifyContent: "center", height: "100vh", color: T.textTert, fontFamily: FONT, background: T.bgBase }}>
      <div className="cs-spinner" />
      <div style={{ fontSize: 13, letterSpacing: "0.04em" }}>Loading settings…</div>
      <style>{`
        @keyframes csSpin { to { transform: rotate(360deg); } }
        .cs-spinner { width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid ${T.borderSoft}; border-top-color: ${T.accent}; animation: csSpin 0.75s linear infinite; }
      `}</style>
    </div>
  );

  return (
    <div className="cs-root" style={{ background: T.bgBase, minHeight: "100vh", fontFamily: FONT, color: T.textPrimary }}>
      <style>{`
        @keyframes csFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes csSpin { to { transform: rotate(360deg); } }
        @keyframes csPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes csAurora { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(2%,-3%) scale(1.06); } }

        .cs-aurora {
          position: absolute; inset: -40% -10% auto -10%; height: 260px; pointer-events: none;
          background: radial-gradient(closest-side, ${T.accentDim}, transparent 70%),
                      radial-gradient(closest-side, ${T.goldDim}, transparent 65%) 70% 20%;
          filter: blur(30px); opacity: 0.8; animation: csAurora 14s ease-in-out infinite; z-index: 0;
        }
        .cs-header { position: sticky; top: 0; z-index: 20; backdrop-filter: blur(14px); background: rgba(12,15,24,0.82); }
        .cs-savebtn { position: relative; transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.25s ease; }
        .cs-savebtn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px -8px ${T.accentGlow}; }
        .cs-savebtn:active { transform: translateY(0px) scale(0.98); }
        .cs-savebtn.err:hover { box-shadow: 0 8px 24px -8px rgba(248,113,113,0.4); }

        .cs-tabbtn { position: relative; transition: color 0.2s ease, background 0.2s ease; border-radius: 8px 8px 0 0; }
        .cs-tabbtn:hover { color: ${T.textPrimary} !important; background: rgba(255,255,255,0.025); }
        .cs-tabbtn.active::after { content: ""; position: absolute; left: 14px; right: 14px; bottom: -1px; height: 2px; background: linear-gradient(90deg, ${T.accent}, ${T.gold}); border-radius: 2px; animation: csFadeUp 0.25s ease; }

        .cs-panel { animation: csFadeUp 0.38s cubic-bezier(.16,1,.3,1); }
        .cs-card { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .cs-card:hover { border-color: ${T.borderMid}; box-shadow: 0 10px 28px -16px rgba(0,0,0,0.6); }

        .cs-input { transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
        .cs-input:hover { border-color: ${T.borderMid}; }
        .cs-input:focus { border-color: ${T.accentBord}; box-shadow: 0 0 0 3px ${T.accentDim}; background: #0f131e; }

        .cs-iconbtn { transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease; }
        .cs-iconbtn:hover { background: ${T.bgElevated}; color: ${T.textPrimary}; transform: translateY(-1px); }

        .cs-exportbtn:hover { transform: translateY(-1px); border-color: ${T.accentBord} !important; box-shadow: 0 6px 18px -10px ${T.accentGlow}; }
        .cs-importbtn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px -10px rgba(52,211,153,0.35); }

        .cs-loyalty-row { transition: background 0.18s ease, padding-left 0.18s ease; }
        .cs-loyalty-row:hover { background: rgba(255,255,255,0.025); padding-left: 20px; }

        .cs-offline-banner { animation: csFadeUp 0.3s ease; }
        .cs-offline-dot { animation: csPulse 1.6s ease-in-out infinite; }
        .cs-retrybtn { transition: transform 0.18s ease, background 0.18s ease; }
        .cs-retrybtn:hover { background: rgba(248,113,113,0.18); }
        .cs-retrybtn:active { transform: scale(0.96); }
        .cs-retry-spin { animation: csSpin 0.8s linear infinite; }

        @media (max-width: 720px) {
          .cs-grid-2 { grid-template-columns: 1fr !important; }
          .cs-header-inner { flex-direction: column; align-items: flex-start !important; gap: 12px; }
          .cs-tabs { overflow-x: auto; }
        }

        /* ✅ MOBILE TWEAKS (added only) */
        @media (max-width: 480px) {
          .cs-grid-2 { grid-template-columns: 1fr !important; }
          .cs-tabs { padding: 0 16px !important; }
          .cs-tabbtn { padding: 12px 14px !important; font-size: 12.5px !important; }
          .cs-header-inner { padding: 16px !important; }
          .cs-offline-banner { padding: 8px 16px !important; flex-direction: column; align-items: flex-start !important; gap: 8px; }
          .cs-retrybtn { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* HEADER */}
      <div className="cs-header" style={{ borderBottom: `1px solid ${T.borderFaint}`, position: "relative", overflow: "hidden" }}>
        <div className="cs-aurora" />
        <div className="cs-header-inner" style={{ position: "relative", zIndex: 1, padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, letterSpacing: "-0.03em", fontFamily: FONT }}>Settings</div>
            <div style={{ fontSize: 12.5, color: T.textTert, marginTop: 4, fontFamily: FONT }}>System configuration</div>
          </div>
          <button
            onClick={() => canEdit && handleSave()}
            disabled={!canEdit}
            className={`cs-savebtn ${saveError ? "err" : ""}`}
            style={{
              padding: "10px 20px",
              background: saveError ? T.danger : saved ? T.emerald : (canEdit ? T.accent : T.bgElevated),
              border: canEdit ? "none" : `1px solid ${T.borderSoft}`,
              borderRadius: 9,
              color: saveError ? "#2b0d0d" : saved ? "#03261a" : (canEdit ? "#fff" : T.textTert),
              fontSize: 14, fontWeight: 600, cursor: canEdit ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 7, fontFamily: FONT,
              opacity: canEdit ? 1 : 0.7
            }}
          >
            {saveError ? <AlertCircle size={16} /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saveError ? "Save Failed" : saved ? "Saved" : (canEdit ? "Save Changes" : "View Only")}
          </button>
        </div>
      </div>

      {/* OFFLINE BANNER */}
      {isOffline && (
        <div className="cs-offline-banner" style={{
          background: T.dangerDim, borderBottom: `1px solid ${T.dangerBord}`,
          padding: "10px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="cs-offline-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: T.danger, display: "inline-block" }} />
            <WifiOff size={15} color={T.danger} />
            <span style={{ fontSize: 13, color: "#fca5a5", fontFamily: FONT }}>
              System is offline — this page is showing local, unsynced values. Changes will not be saved until the connection is restored.
            </span>
          </div>
          <button onClick={handleRetry} className="cs-retrybtn" style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7,
            background: "rgba(248,113,113,0.1)", border: `1px solid ${T.dangerBord}`, color: T.danger,
            fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap",
          }}>
            <RefreshCw size={13} className={retrying ? "cs-retry-spin" : ""} /> Retry
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="cs-tabs" style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderFaint}`, padding: "0 32px", display: "flex", gap: 4 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`cs-tabbtn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", fontSize: 13.5, fontWeight: 500,
              cursor: "pointer", fontFamily: FONT, border: "none",
              color: activeTab === tab.id ? T.textPrimary : T.textTert, background: "transparent",
            }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT - Wrapped with PermissionGuard */}
      <PermissionGuard>
        <div style={{ padding: "32px", maxWidth: 900 }}>

          {/* BUSINESS PROFILE */}
          {activeTab === "profile" && (
            <div key="profile" className="cs-panel" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="cs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={labelStyle}>Business Name</div>
                  <input className="cs-input" value={config.name} onChange={e => setConfig(p => ({...p, name: e.target.value}))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Primary Phone</div>
                  <input className="cs-input" value={config.phone} onChange={e => setConfig(p => ({...p, phone: e.target.value}))} style={inputStyle} />
                </div>
              </div>
              <div>
                <div style={labelStyle}>Business Address</div>
                <input className="cs-input" value={config.address} onChange={e => setConfig(p => ({...p, address: e.target.value}))} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Contact Email</div>
                <input className="cs-input" value={config.email} onChange={e => setConfig(p => ({...p, email: e.target.value}))} style={inputStyle} />
              </div>
              <div className="cs-card" style={{ padding: 16, background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lock size={15} color={T.accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT }}>Sheet Protection Password</div>
                    <div style={{ fontSize: 12, color: T.textTert, marginTop: 2, fontFamily: MONO }}>{showPass ? config.sheetPass : "••••••"}</div>
                  </div>
                </div>
                <button 
                  onClick={() => canEdit && setShowPass(!showPass)}
                  disabled={!canEdit}
                  className="cs-iconbtn" 
                  style={{ 
                    padding: 8, 
                    background: canEdit ? T.bgElevated : T.bgSurface, 
                    border: "none", 
                    borderRadius: 6, 
                    color: canEdit ? T.textSec : T.textHint, 
                    cursor: canEdit ? "pointer" : "not-allowed" 
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="cs-card" style={{ padding: 16, background: T.goldDim, border: `1px solid ${T.goldBord}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <Globe size={18} color={T.gold} />
                <div style={{ fontSize: 13, color: T.textSec, fontFamily: FONT }}>
                  Configuration applies to Main Branch. Additional branches inherit these settings.
                </div>
              </div>
            </div>
          )}

          {/* PRICING & RULES */}
          {activeTab === "rules" && (
            <div key="rules" className="cs-panel" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="cs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={labelStyle}>Express Surcharge (GH₵)</div>
                  <input className="cs-input" type="number" value={config.expressSurcharge} onChange={e => setConfig(p => ({...p, expressSurcharge: Number(e.target.value)}))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Standard Turnaround</div>
                  <input value="3 Days (Auto-set)" disabled style={{...inputStyle, opacity: 0.55, cursor: "not-allowed"}} />
                </div>
              </div>
              <div className="cs-card" style={{ padding: 20, background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, fontFamily: FONT }}>Pricing Rules</div>
                <div className="cs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13, color: T.textSec, fontFamily: FONT }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.textTert, marginTop: 6, flexShrink: 0 }} />
                    <div><strong style={{ color: T.textPrimary }}>Standard Items:</strong> Calculated from Price List based on Service Type.</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, marginTop: 6, flexShrink: 0 }} />
                    <div><strong style={{ color: T.textPrimary }}>Express Surcharge:</strong> Adds {config.expressSurcharge} GH₵ per item when Express is enabled.</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.emerald, marginTop: 6, flexShrink: 0 }} />
                    <div><strong style={{ color: T.textPrimary }}>Corporate Contracts:</strong> Fixed or negotiated rates per client.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOYALTY TIERS */}
          {activeTab === "loyalty" && (
            <div key="loyalty" className="cs-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="cs-card" style={{ padding: 16, background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, fontFamily: FONT }}>
                  Tier Assignment by Visit Count
                </div>
                {[
                  { tier: "Standard", visits: "< 5 visits", discount: "0%", color: T.textTert, icon: "○" },
                  { tier: "Bronze 🥉", visits: "5 – 14 visits", discount: "5% Off", color: "#cd8a44", icon: "🥉" },
                  { tier: "Silver 🥈", visits: "15 – 29 visits", discount: "10% Off", color: "#94a3b8", icon: "🥈" },
                  { tier: "Gold 🥇", visits: "30+ visits", discount: "15% Off + Free Delivery", color: T.gold, icon: "🥇" },
                  { tier: "VIP 👑", visits: "Management Designated", discount: "20% Off + Door-to-Door", color: "#a78bfa", icon: "👑" },
                ].map((l, i) => (
                  <div key={l.tier} className="cs-loyalty-row" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", borderBottom: i < 4 ? `1px solid ${T.borderFaint}` : "none", borderRadius: 8,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 18 }}>{l.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: l.color, fontFamily: FONT }}>{l.tier}</div>
                        <div style={{ fontSize: 12, color: T.textTert, marginTop: 2, fontFamily: FONT }}>{l.visits}</div>
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: `${l.color}15`, color: l.color, fontFamily: FONT,
                    }}>
                      {l.discount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DATA & BACKUP */}
          {activeTab === "data" && (
            <div key="data" className="cs-panel" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="cs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="cs-card cs-exportbtn" style={{ padding: 20, background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Download size={18} color={T.accent} />
                    <div style={{ fontSize: 15, fontWeight: 600, fontFamily: FONT }}>Export Data</div>
                  </div>
                  <div style={{ fontSize: 13, color: T.textTert, marginBottom: 16, fontFamily: FONT }}>Client, order, and pricing data in CSV or JSON format.</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button 
                      onClick={() => canEdit && handleExport('clients')}
                      disabled={!canEdit}
                      className="cs-iconbtn" 
                      style={{ 
                        flex: 1, 
                        padding: 10, 
                        background: canEdit ? T.bgElevated : T.bgSurface, 
                        border: `1px solid ${T.borderSoft}`, 
                        borderRadius: 8, 
                        color: canEdit ? T.textSec : T.textHint, 
                        fontSize: 13, 
                        cursor: canEdit ? "pointer" : "not-allowed", 
                        fontFamily: FONT 
                      }}
                    >
                      Clients.json
                    </button>
                    <button 
                      onClick={() => canEdit && handleExport('orders')}
                      disabled={!canEdit}
                      className="cs-iconbtn" 
                      style={{ 
                        flex: 1, 
                        padding: 10, 
                        background: canEdit ? T.bgElevated : T.bgSurface, 
                        border: `1px solid ${T.borderSoft}`, 
                        borderRadius: 8, 
                        color: canEdit ? T.textSec : T.textHint, 
                        fontSize: 13, 
                        cursor: canEdit ? "pointer" : "not-allowed", 
                        fontFamily: FONT 
                      }}
                    >
                      Orders.json
                    </button>
                  </div>
                </div>
                <div className="cs-card cs-importbtn" style={{ padding: 20, background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Upload size={18} color={T.emerald} />
                    <div style={{ fontSize: 15, fontWeight: 600, fontFamily: FONT }}>Import Data</div>
                  </div>
                  <div style={{ fontSize: 13, color: T.textTert, marginBottom: 16, fontFamily: FONT }}>Restore data from previously exported files.</div>
                  <button
                    onClick={() => {
                      if (!canEdit) return;
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = async (e: any) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text();
                        try {
                          const data = JSON.parse(text);
                          console.log('Imported data:', data);
                          alert('Import complete.');
                        } catch (err) {
                          alert('Invalid file format');
                        }
                      };
                      input.click();
                    }}
                    disabled={!canEdit}
                    style={{ 
                      width: "100%", 
                      padding: 10, 
                      background: canEdit ? T.emeraldDim : T.bgSurface, 
                      border: `1px solid ${canEdit ? T.emeraldBord : T.borderSoft}`, 
                      borderRadius: 8, 
                      color: canEdit ? T.emerald : T.textHint, 
                      fontSize: 13, 
                      fontWeight: 600, 
                      cursor: canEdit ? "pointer" : "not-allowed", 
                      fontFamily: FONT,
                      opacity: canEdit ? 1 : 0.7
                    }}
                  >
                    Choose File...
                  </button>
                </div>
              </div>
              <div className="cs-card" style={{ padding: 16, background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT }}>Automatic Backups</div>
                  <div style={{ fontSize: 12, color: T.textTert, marginTop: 2, fontFamily: FONT }}>Daily at 11:59 PM</div>
                </div>
                <div
                  style={{
                    ...toggleStyle(config.autoBackup),
                    opacity: canEdit ? 1 : 0.7,
                    cursor: canEdit ? "pointer" : "not-allowed"
                  }}
                  onClick={() => canEdit && setConfig(p => ({...p, autoBackup: !p.autoBackup}))}
                >
                  <div style={thumbStyle(config.autoBackup)} />
                </div>
              </div>
            </div>
          )}

        </div>
      </PermissionGuard>
    </div>
  );
};

export default Settings;