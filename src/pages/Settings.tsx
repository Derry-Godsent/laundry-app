import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import {
  Building2, Shield, Database, Save, Upload, Download,
  AlertCircle, Check, Globe, Lock, Eye, EyeOff, X, Copy, RefreshCw,
  Circle, Crown, Medal, Trophy,
} from "lucide-react";
import { usePermission } from "../hooks/usePermission";
import { useConnection, isNetworkError } from "../hooks/useConnection";
import { PermissionGuard } from "../components/PermissionGuard";

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const T = {
  bgBase:      "var(--ink-base)", bgSurface: "var(--ink-shell)", bgRaised: "var(--ink-card)", bgElevated: "var(--ink-raised)",
  borderFaint: "var(--line-faint)", borderSoft: "var(--line-soft)", borderMid: "var(--line)",
  textPrimary: "var(--text-1)", textSec: "var(--text-2)", textTert: "var(--text-3)", textHint: "var(--text-4)",
  accent: "var(--brand-500)", accentStrong: "var(--brand-700)", accentDim: "var(--brand-soft)", accentBord: "var(--brand-border)", accentGlow: "var(--brand-glow)",
  gold: "var(--warn-500)", goldDim: "var(--warn-soft)", goldBord: "var(--warn-border)",
  emerald: "var(--ok-500)", emeraldDim: "var(--ok-soft)", emeraldBord: "var(--ok-border)",
  danger: "var(--bad-500)", dangerDim: "var(--bad-soft)", dangerBord: "var(--bad-border)",
};

const FONT = "var(--font-ui)";
const MONO = "var(--font-mono)";

/* ─── SUB-COMPONENTS ────────────────────────────────────────── */
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="cs-toast" style={{ 
      position: "fixed", bottom: 24, right: 24, zIndex: 10000, 
      background: type === "success" ? T.emeraldDim : T.dangerDim, 
      border: `1px solid ${type === "success" ? T.emeraldBord : T.dangerBord}`, 
      borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, 
      boxShadow: "var(--shadow-modal)", animation: "csFadeUp 0.3s cubic-bezier(.4,0,.2,1)", whiteSpace: "nowrap" 
    }}>
      {type === "success" ? <Check size={15} color={T.emerald} /> : <AlertCircle size={15} color={T.danger} />}
      <span style={{ fontSize: 13.5, fontWeight: 500, color: type === "success" ? T.emerald : T.danger, fontFamily: FONT }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, display: "flex", alignItems: "center", transition: "opacity 0.15s" }}>
        <X size={13} />
      </button>
    </div>
  );
}
/* Where this page keeps its values: one row of `business_settings`, holding
   the profile as JSON. The console's other settings table, `system_settings`,
   is a column of booleans, one row per switch, so a profile cannot live there.
   This page used to address a flat `settings` table with one column per field,
   which no migration creates, so it showed built-in values and refused every
   save.

   The SQL in the notice below is the same as supabase/migrations/
   20261007_010_business_settings.sql. It is repeated here so the page can hand
   it to whoever can run it, and it is written to be safe to run twice. */
const STORE_SQL = `create table if not exists public.business_settings (
  id smallint primary key default 1 check (id = 1),
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.business_settings enable row level security;

-- Table privileges. Row level security decides which rows a role may read or
-- write, but the role needs the table privilege first, or the database refuses
-- the request before any policy is consulted.
grant select, insert, update, delete on public.business_settings to authenticated;
grant all on public.business_settings to service_role;
revoke all on public.business_settings from anon;

drop policy if exists "staff reads business settings" on public.business_settings;
drop policy if exists "admin manages business settings" on public.business_settings;
drop policy if exists "staff with edit rights manage business settings" on public.business_settings;

create policy "staff reads business settings"
  on public.business_settings for select to authenticated
  using (public.is_chapman_staff());

-- Admins, and any role the console's own permissions let edit Settings. The
-- database now enforces the same rule the page shows.
create policy "staff with edit rights manage business settings"
  on public.business_settings for all to authenticated
  using (
    public.is_chapman_admin()
    or exists (
      select 1
      from public.role_permissions p
      join public.staff s on s.id = auth.uid()
      where p.role = lower(coalesce(s.role, ''))
        and p.page = 'settings'
        and coalesce(p.can_edit, false)
    )
  )
  with check (
    public.is_chapman_admin()
    or exists (
      select 1
      from public.role_permissions p
      join public.staff s on s.id = auth.uid()
      where p.role = lower(coalesce(s.role, ''))
        and p.page = 'settings'
        and coalesce(p.can_edit, false)
    )
  );

insert into public.business_settings (id, profile)
values (1, '{}'::jsonb)
on conflict (id) do nothing;`;

/* PostgREST answers with the reason a request was refused, and the reason
   matters: a table that does not exist is a job for whoever owns the database,
   a missing privilege is a grant, an RLS refusal is a policy, and a rejected
   value is a schema problem. They are four different repairs, so the page
   names the one that applies and keeps the server's own words beside it.

   42501 covers both a missing privilege ("permission denied for table") and a
   policy refusal ("new row violates row-level security policy"), so the
   message decides which one it was, never the code alone. */
type DbCause = "missing" | "privilege" | "policy" | "function" | "type" | "other";

function dbErrorCause(err: any): DbCause {
  const code = String(err?.code || err?.status || "");
  const message = String(err?.message || err?.error_description || "");
  if (code === "42P01" || code === "PGRST205" || code === "42703" || code === "PGRST204"
      || /does not exist|not find the table|schema cache/i.test(message)) return "missing";
  if (/permission denied for (table|relation)/i.test(message)) return "privilege";
  if (/row-level security policy/i.test(message)) return "policy";
  if (/permission denied for function/i.test(message)) return "function";
  if (code === "42501") return "privilege";
  if (code === "22P02" || code === "42804") return "type";
  return "other";
}

/* The exact sentence the server used, for whoever fixes the database. */
function rawDbError(err: any): string {
  const code = err?.code || err?.status || "";
  const message = String(err?.message || err?.error_description || err || "").replace(/\s+/g, " ").trim();
  const text = `${message}${code ? ` (${code})` : ""}`;
  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}

function explainDbError(err: any, direction: "read" | "write"): string {
  const job = direction === "read" ? "the database would not return the saved settings" : "the database refused the save";
  switch (dbErrorCause(err)) {
    case "missing":    return "the business_settings table is not in the database yet";
    case "privilege":  return "this role has no privilege on business_settings";
    case "policy":     return "the row policies on business_settings do not allow this role to write";
    case "function":   return "this role may not call the permission function the table policies use";
    case "type":       return "the business_settings column rejected the value";
    default:           return job;
  }
}

/* The stored profile is read defensively: the column may hand back an object
   or the JSON text, and an older or hand-edited row must not break the page. */
function parseProfile(value: unknown): Partial<{
  name: string; address: string; phone: string; email: string;
  expressSurcharge: number; sheetPass: string;
  notifications: { sms: boolean; email: boolean; orderReady: boolean; paymentReceived: boolean };
  autoBackup: boolean;
}> | null {
  if (!value) return null;
  let raw: any = value;
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return null; }
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const out: any = {};
  if (typeof raw.name === "string") out.name = raw.name;
  if (typeof raw.address === "string") out.address = raw.address;
  if (typeof raw.phone === "string") out.phone = raw.phone;
  if (typeof raw.email === "string") out.email = raw.email;
  if (Number.isFinite(Number(raw.expressSurcharge))) out.expressSurcharge = Number(raw.expressSurcharge);
  if (typeof raw.sheetPass === "string") out.sheetPass = raw.sheetPass;
  if (raw.notifications && typeof raw.notifications === "object") out.notifications = raw.notifications;
  if (typeof raw.autoBackup === "boolean") out.autoBackup = raw.autoBackup;
  return out;
}

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export const Settings = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);
  /* The connection itself is owned by the shell: this page only asks whether
     the last save was refused, so a permission error is never reported as an
     outage. That mistake is why this page used to announce an offline system
     to somebody who was online and simply not allowed to write. */
  const { status: connectionStatus, retry: retryConnection } = useConnection();
  const isOffline = connectionStatus === "offline";
  const [saveFailed, setSaveFailed] = useState(false);
  /* Set when the database refused the read, so the page can say that what it
     is showing are its own defaults rather than stored values. */
  const [loadError, setLoadError] = useState<string | null>(null);
  /* null until the read answers, then whether a saved row came back. The
     defaults and a stored profile look identical on screen otherwise. */
  const [hasStored, setHasStored] = useState<boolean | null>(null);
  /* True when the database has no business_settings table: the page then shows
     the SQL that creates it, because it cannot create it itself. */
  const [storeMissing, setStoreMissing] = useState(false);
  /* True when the table is there but this role is not allowed to use it, which
     needs a grant rather than a table. */
  const [storeBlocked, setStoreBlocked] = useState(false);
  const [rawError, setRawError] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

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

  const { permission, loading: permLoading, canEdit, error: permError } = usePermission(location.pathname);

    const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('profile')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        /* A refused read is not an outage: a missing row, a policy or a
           permission all come back as errors over a working connection. Only a
           genuine network failure asks the shared store to re-check. */
        if (isNetworkError(error)) {
          void retryConnection();
        } else {
          /* A refused read is not an outage: a missing table, a missing
             privilege or a policy all come back as errors over a working
             connection. The page says which, and what the server said, rather
             than showing its own defaults as if they were stored settings. */
          const cause = dbErrorCause(error);
          setLoadError(explainDbError(error, "read"));
          setRawError(rawDbError(error));
          setStoreMissing(cause === "missing");
          setStoreBlocked(cause === "privilege" || cause === "policy" || cause === "function");
          console.warn('Settings read refused (table, privilege or policy):', error);
        }
        return;
      }

      const stored = parseProfile(data?.profile);
      if (stored) setConfig(prev => ({ ...prev, ...stored }));
      setHasStored(Boolean(stored));
      /* A read that worked clears whatever the last failure left on screen,
         or a fixed database would keep showing the old complaint. */
      setLoadError(null);
      setRawError(null);
      setStoreMissing(false);
      setStoreBlocked(false);
    } catch (err: any) {
      console.error('Settings fetch error:', err);
      if (isNetworkError(err)) void retryConnection();
    } finally {
      setLoading(false);
    }
  }, [retryConnection]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  /* The SQL is the app's, so the page can put it on the clipboard rather than
     asking the reader to retype it. The clipboard API is unavailable on an
     insecure origin, so a failure says so instead of throwing. */
  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(STORE_SQL);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    } catch {
      setToast({ msg: "Copying is blocked here. Select the SQL and copy it.", type: "error" });
    }
  };

  const handleSave = async () => {
    if (isOffline) {
      setToast({ msg: "Not saved: the system is offline.", type: "error" });
      return;
    }
    setSaved(true);
    setSaveFailed(false);
    try {
      /* One row, written in one statement, and the response is asked for so a
         write that matched nothing can never be reported as a save. */
      const { data: written, error } = await supabase
        .from('business_settings')
        .upsert({
          id: 1,
          profile: { ...config, updatedAt: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select('id');

      if (error) throw error;
      if (!written || written.length === 0) {
        throw new Error("The database accepted the write but returned no row.");
      }

      setLoadError(null);
      setStoreMissing(false);
      setHasStored(true);
      setToast({ msg: "Settings saved", type: "success" });
    } catch (err) {
      console.error('Settings save error:', err);
      if (isNetworkError(err)) {
        void retryConnection();
        setToast({ msg: "Not saved: the connection dropped.", type: "error" });
      } else {
        const cause = dbErrorCause(err);
        const reason = explainDbError(err, "write");
        setRawError(rawDbError(err));
        setStoreMissing(cause === "missing");
        setStoreBlocked(cause === "privilege" || cause === "policy" || cause === "function");
        setSaveFailed(true);
        setToast({
          msg: `Not saved: ${cause === "other" ? reason : `${reason}.`}`,
          type: "error",
        });
      }
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
      setToast({ msg: "Data exported successfully", type: "success" });
    } catch (err) {
      console.error('Export error:', err);
      if (isNetworkError(err)) void retryConnection();
      setToast({ msg: "Failed to export data", type: "error" });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      console.log('Imported data:', data);
      setToast({ msg: "Data imported successfully", type: "success" });
    } catch (err) {
      console.error('Import error:', err);
      setToast({ msg: "Invalid file format", type: "error" });
    }
  };


  const toggleStyle = (active: boolean): React.CSSProperties => ({
    position: "relative", display: "inline-block", width: 40, height: 22,
    cursor: canEdit ? "pointer" : "not-allowed", borderRadius: 20, 
    background: active ? T.emerald : T.bgElevated,
    border: `1px solid ${active ? T.emeraldBord : T.borderSoft}`, 
    transition: "background 0.25s ease, border-color 0.25s ease",
    boxShadow: active ? `0 0 0 4px ${T.emeraldDim}` : "none",
    opacity: canEdit ? 1 : 0.7
  });

  const thumbStyle = (active: boolean): React.CSSProperties => ({
    position: "absolute", content: '""', height: 18, width: 18,
    left: active ? 19 : 2, bottom: 1, backgroundColor: "#fff",
    transition: "left 0.25s cubic-bezier(.4,0,.2,1)", borderRadius: "50%",
    boxShadow: "var(--shadow-sm)",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", background: T.bgSurface,
    border: `1px solid ${T.borderSoft}`, borderRadius: 8,
    color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: FONT,
    transition: "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
    opacity: canEdit ? 1 : 0.6,
    cursor: canEdit ? "text" : "not-allowed"
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: T.textTert, marginBottom: 6,
    textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, fontFamily: FONT
  };

  const tabs = [
    { id: "profile", label: "Business Profile", icon: Building2 },
    { id: "rules", label: "Pricing & Rules", icon: Shield },
    { id: "loyalty", label: "Loyalty Tiers", icon: Globe },
    { id: "data", label: "Data & Backup", icon: Database },
  ];

  if (loading || permLoading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", justifyContent: "center", minHeight: "60%", padding: "var(--page-pad-y) var(--page-pad-x)", color: T.textTert, fontFamily: FONT, background: T.bgBase }}>
      <div className="cs-spinner" />
      <div style={{ fontSize: 13, letterSpacing: "0.04em" }}>Loading settings…</div>
      <style>{`
        @keyframes csSpin { to { transform: rotate(360deg); } }
        .cs-spinner { width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid ${T.borderSoft}; border-top-color: ${T.accent}; animation: csSpin 0.75s linear infinite; }
      `}</style>
    </div>
  );

  return (
    <div className="cs-root" style={{ background: T.bgBase, minHeight: "100%", fontFamily: FONT, color: T.textPrimary, position: "relative" }}>
      <style>{`
        @keyframes csFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
         }
                        /* The drifting aurora behind the header is gone: two blurred colour
           blobs moving on a 14 second loop, on a settings page. */
        .cs-header { position: sticky; top: 0; z-index: 20; backdrop-filter: blur(14px); background: rgba(12,15,24,0.82); }
        .cs-savebtn { position: relative; transition: background-color 0.2s ease; }
        .cs-savebtn:hover { filter: brightness(1.06); }
        .cs-savebtn:active { filter: brightness(1.12); }

        .cs-tabbtn { position: relative; transition: color 0.2s ease, background 0.2s ease; border-radius: 8px 8px 0 0; }
        .cs-tabbtn:hover { color: ${T.textPrimary} !important; background: rgba(255,255,255,0.025); }
        .cs-tabbtn.active::after { content: ""; position: absolute; left: 14px; right: 14px; bottom: -1px; height: 2px; background: var(--brand-500); border-radius: 2px; animation: csFadeUp 0.25s ease; }

        .cs-panel { animation: csFadeUp 0.38s cubic-bezier(.16,1,.3,1); }
        .cs-card { transition: border-color 0.2s ease; }
        .cs-card:hover { border-color: ${T.borderMid}; }

        .cs-input { transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
        .cs-input:hover { border-color: ${T.borderMid}; }
        .cs-input:focus { border-color: ${T.accentBord}; box-shadow: var(--focus-ring); background: ${T.bgElevated}; }

        .cs-iconbtn { transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease; }
        .cs-iconbtn:hover { background: ${T.bgElevated}; color: ${T.textPrimary}; transform: translateY(-1px); }

        .cs-exportbtn:hover { border-color: var(--brand-500) !important; }
        .cs-importbtn:hover { border-color: var(--ok-500) !important; }

        .cs-loyalty-row { transition: background 0.18s ease, padding-left 0.18s ease; }
        .cs-loyalty-row:hover { background: rgba(255,255,255,0.025); padding-left: 20px; }


        @media (max-width: 900px) {
          .cs-grid-2 { grid-template-columns: minmax(0, 1fr) !important; }
          .cs-header-inner { padding: 18px var(--page-pad-x) !important; flex-wrap: wrap; gap: 12px; }
          .cs-tabs { padding: 0 var(--page-pad-x) !important; overflow-x: auto; scrollbar-width: none; }
          .cs-tabs::-webkit-scrollbar { display: none; }
          .cs-tabbtn { padding: 12px 14px !important; min-height: var(--tap-min); }
          .cs-body { padding: 18px var(--page-pad-x) 40px !important; }

          /* 16px keeps iOS from zooming the page in on focus and leaving it
             zoomed, which moves everything the staff member was reading.
             The page renders most of its controls inline styled, so this
             covers the classed fields and any field inside a settings card. */
          .cs-input, .cs-panel input, .cs-panel select, .cs-panel textarea { font-size: 16px !important; }
          .cs-input { min-height: var(--tap-min); }
          .cs-iconbtn { min-height: var(--tap-min); }
          .cs-card button { min-height: var(--tap-min); }

          /* The loyalty rows were label and control side by side: on a phone a
             long label squashed its input. They wrap, and the control keeps a
             usable width. */
          .cs-loyalty-row { flex-wrap: wrap; gap: 10px !important; }
          .cs-loyalty-row input { flex: 1 1 120px; min-width: 0; }

          .cs-toast {
            bottom: calc(var(--vv-bottom, 0px) + 16px) !important;
            left: var(--page-pad-x) !important;
            right: var(--page-pad-x) !important;
            max-width: none !important;
          }
        }

        @media (max-width: 480px) {
        }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

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
            className={`cs-savebtn ${saveFailed ? "err" : ""}`}
            style={{
              padding: "10px 20px",
              background: saveFailed ? T.danger : saved ? "var(--ok-700)" : (canEdit ? T.accentStrong : T.bgElevated),
              border: `1px solid ${saveFailed ? "var(--bad-border)" : saved ? "var(--ok-border)" : canEdit ? "var(--brand-600)" : T.borderSoft}`,
              borderRadius: 9,
              color: saveFailed ? "var(--on-bad)" : saved ? "var(--on-brand)" : (canEdit ? "var(--on-brand)" : "var(--text-disabled)"),
              fontSize: 14, fontWeight: 600, cursor: canEdit ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 7, fontFamily: FONT,
              opacity: canEdit ? 1 : 0.7
            }}
          >
            {saveFailed ? <AlertCircle size={16} /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saveFailed ? "Save Failed" : saved ? "Saved" : (canEdit ? "Save Changes" : "View Only")}
          </button>
        </div>
      </div>

      {hasStored === false && !loadError && (
        <div style={{ padding: "9px 32px", borderBottom: `1px solid ${T.borderFaint}`, fontSize: 12, color: "var(--text-4)", fontFamily: FONT }}>
          Nothing has been saved from this page yet, so these are the built-in values.
        </div>
      )}

      {(storeMissing || storeBlocked) && (
        <div style={{ background: "var(--tint-warn)", borderBottom: "1px solid var(--warn-border)", padding: "16px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Database size={15} style={{ color: "var(--warn-500)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", fontFamily: FONT }}>
              {storeMissing ? "Settings need one table in the database" : "Settings need access to that table"}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "var(--text-2)", fontFamily: FONT, maxWidth: "78ch" }}>
            {storeMissing
              ? "The profile is stored as one row of a table called business_settings, and that table is not in your database yet, so this page is showing its built-in values and cannot save."
              : "The table is there, but this role has not been granted access to it, so the database refuses both reading and saving."}
            {" "}Run the SQL below once in the Supabase SQL editor (it creates the table if it is missing, grants
            the privileges, and sets the policies that let admins and anyone with edit rights on Settings write it),
            then press Try again. It is safe to run twice.
          </p>
          {loadError && (
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-3)", fontFamily: FONT }}>
              The database said: {loadError}.{rawError ? ` Its words: ${rawError}` : ""}
            </p>
          )}
          <pre style={{
            margin: 0, padding: "12px 14px", background: T.bgBase, border: `1px solid ${T.borderSoft}`, borderRadius: 9,
            fontSize: 11.5, lineHeight: 1.5, color: "var(--text-2)", fontFamily: MONO,
            overflowX: "auto", whiteSpace: "pre", maxHeight: 230, WebkitOverflowScrolling: "touch",
          }}>
            {STORE_SQL}
          </pre>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={handleCopySql}
              style={{ padding: "7px 14px", background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textSec, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: FONT }}
            >
              {sqlCopied ? <Check size={14} /> : <Copy size={14} />} {sqlCopied ? "Copied" : "Copy SQL"}
            </button>
            <button
              onClick={() => fetchSettings()}
              style={{ padding: "7px 14px", background: "var(--warn-700)", border: "none", borderRadius: 8, color: "var(--on-brand)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: FONT }}
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        </div>
      )}

      {loadError && !storeMissing && !storeBlocked && (
        <div className="cs-readonly cs-readonly--bad" style={{ background: "var(--tint-bad)", borderBottom: "1px solid var(--bad-border)", padding: "10px 32px", display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <AlertCircle size={14} style={{ color: "var(--bad-500)", flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "var(--text-2)", fontFamily: FONT }}>
            Showing built-in values: the database would not return your saved settings ({loadError}).
          </span>
          <button
            onClick={() => fetchSettings()}
            style={{ padding: "5px 12px", background: "var(--bad-700)", border: "none", borderRadius: 7, color: "var(--on-brand)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
          >
            Try again
          </button>
        </div>
      )}

      {!canEdit && !permLoading && (
        <div className="cs-readonly" style={{ background: "var(--tint-warn)", borderBottom: "1px solid var(--warn-border)", padding: "10px 32px", display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <Lock size={14} style={{ color: "var(--warn-500)", flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "var(--text-2)", fontFamily: FONT }}>
            {permError
              ? "Your permissions could not be checked, so changes are held back."
              : "Your role does not allow changes to settings."}
          </span>
          {!permError && <span style={{ fontSize: 12.5, color: T.textTert, fontFamily: FONT }}>Ask an administrator to grant edit access on the System Admin page.</span>}
          {permError && (
            <button
              onClick={() => window.dispatchEvent(new Event("permissions-updated"))}
              style={{ padding: "5px 12px", background: "var(--warn-700)", border: "none", borderRadius: 7, color: "var(--on-brand)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
            >
              Check again
            </button>
          )}
        </div>
      )}

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

      <PermissionGuard>
        <div className="cs-body" style={{ padding: "32px", maxWidth: 900, margin: "0 auto" }}>

          {activeTab === "profile" && (
            <div key="profile" className="cs-panel" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="cs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={labelStyle}>Business Name</div>
                  <input className="cs-input" value={config.name} onChange={e => setConfig(p => ({...p, name: e.target.value}))} style={inputStyle} disabled={!canEdit} />
                </div>
                <div>
                  <div style={labelStyle}>Primary Phone</div>
                  <input className="cs-input" value={config.phone} onChange={e => setConfig(p => ({...p, phone: e.target.value}))} style={inputStyle} disabled={!canEdit} />
                </div>
              </div>
              <div>
                <div style={labelStyle}>Business Address</div>
                <input className="cs-input" value={config.address} onChange={e => setConfig(p => ({...p, address: e.target.value}))} style={inputStyle} disabled={!canEdit} />
              </div>
              <div>
                <div style={labelStyle}>Contact Email</div>
                <input className="cs-input" value={config.email} onChange={e => setConfig(p => ({...p, email: e.target.value}))} style={inputStyle} disabled={!canEdit} />
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
            </div>
          )}

          {activeTab === "rules" && (
            <div key="rules" className="cs-panel" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="cs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={labelStyle}>Express Surcharge (GH₵)</div>
                  <input className="cs-input" type="number" value={config.expressSurcharge} onChange={e => setConfig(p => ({...p, expressSurcharge: Number(e.target.value)}))} style={inputStyle} disabled={!canEdit} />
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

          {activeTab === "loyalty" && (
            <div key="loyalty" className="cs-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="cs-card" style={{ padding: 16, background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, fontFamily: FONT }}>
                  Tier Assignment by Visit Count
                </div>
                {[
                  { tier: "Standard", visits: "Under 5 visits", discount: "0%", color: T.textTert, icon: Circle },
                  { tier: "Bronze", visits: "5 to 14 visits", discount: "5% Off", color: "var(--warn-500)", icon: Medal },
                  { tier: "Silver", visits: "15 to 29 visits", discount: "10% Off", color: "var(--text-2)", icon: Medal },
                  { tier: "Gold", visits: "30 or more visits", discount: "15% Off + Free Delivery", color: T.gold, icon: Trophy },
                  { tier: "VIP", visits: "Management Designated", discount: "20% Off + Door-to-Door", color: "var(--brand-400)", icon: Crown },
                ].map((l, i) => (
                  <div key={l.tier} className="cs-loyalty-row" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", borderBottom: i < 4 ? `1px solid ${T.borderFaint}` : "none", borderRadius: 8,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <l.icon size={18} color={l.color} strokeWidth={1.9} aria-hidden />
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

          {activeTab === "data" && (
            <div key="data" className="cs-panel" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="cs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="cs-card cs-exportbtn" style={{ padding: 20, background: "var(--tint-accent)", border: "1px solid var(--brand-border)", borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Download size={18} color={T.accent} />
                    <div style={{ fontSize: 15, fontWeight: 600, fontFamily: FONT }}>Export Data</div>
                  </div>
                  <div style={{ fontSize: 13, color: T.textTert, marginBottom: 16, fontFamily: FONT }}>Client, order, and pricing data in JSON format.</div>
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
                <div className="cs-card cs-importbtn" style={{ padding: 20, background: "var(--tint-ok)", border: "1px solid var(--ok-border)", borderRadius: 12 }}>
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
                        if (file) await handleImport(file);
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
                  style={toggleStyle(config.autoBackup)}
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