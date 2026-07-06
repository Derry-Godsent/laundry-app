import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom"; // ✅ Added for permission hook
import {
  Search, Plus, X, Check, AlertCircle, Building2, Edit2, Package,
  Shirt, Star, Layers, Home, Sparkles, Wind, Grid, SprayCan, Car,
  Droplets, Trash2, WifiOff, RefreshCw, Loader2, Clock
} from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { usePermission } from "../hooks/usePermission"; // ✅ Added
import { PermissionGuard } from "../components/PermissionGuard"; // ✅ Added

/* ─── TOKENS (bolder / higher-contrast pass) ─────────────────── */
const T = {
  bgBase:      "#050609",
  bgSurface:   "#0a0c14",
  bgRaised:    "#0f1220",
  bgElevated:  "#151830",
  bgHover:     "#1c2140",
  borderFaint: "rgba(255,255,255,0.05)",
  borderSoft:  "rgba(255,255,255,0.09)",
  borderMid:   "rgba(255,255,255,0.15)",

  textPrimary: "#f4f6fc",
  textSec:     "#98a2ba",
  textTert:    "#5a6683",
  textHint:    "#323a54",

  accent:      "#7c82ff",
  accentSoft:  "#b4b8ff",
  accentDim:   "rgba(124,130,255,0.14)",
  accentBord:  "rgba(124,130,255,0.35)",
  accentGlow:  "rgba(124,130,255,0.45)",

  gold:        "#f0b04e",
  goldDim:     "rgba(240,176,78,0.12)",
  goldBord:    "rgba(240,176,78,0.32)",
  goldGlow:    "rgba(240,176,78,0.4)",

  emerald:     "#2fe0a0",
  emeraldDim:  "rgba(47,224,160,0.12)",
  emeraldBord: "rgba(47,224,160,0.32)",
  emeraldGlow: "rgba(47,224,160,0.4)",

  ember:       "#ff6060",
  emberDim:    "rgba(255,96,96,0.12)",
  emberBord:   "rgba(255,96,96,0.32)",
  emberGlow:   "rgba(255,96,96,0.4)",

  sky:         "#4fb3ff",
  skyDim:      "rgba(79,179,255,0.12)",
  skyBord:     "rgba(79,179,255,0.32)",

  violet:      "#c084ff",
  violetDim:   "rgba(192,132,255,0.12)",
  violetBord:  "rgba(192,132,255,0.32)",
};

const FONT = "'DM Sans','Inter',system-ui,sans-serif";
const MONO = "'DM Mono','Fira Mono',ui-monospace,monospace";

/* ─── GLOBAL CSS (animations + hover classes) ───────────────── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; }

@keyframes svcAuroraDrift {
  0%   { transform: translate(-4%, -2%) scale(1); }
  50%  { transform: translate(3%, 4%) scale(1.08); }
  100% { transform: translate(-4%, -2%) scale(1); }
}
@keyframes svcFadeIn { from { opacity:0 } to { opacity:1 } }
@keyframes svcFadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
@keyframes svcScaleIn { from { opacity:0; transform:scale(0.94) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
@keyframes svcSlideDown { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }
@keyframes svcShimmer { 0% { background-position:-300px 0 } 100% { background-position:300px 0 } }
@keyframes svcSpin { to { transform: rotate(360deg) } }

.svc-aurora {
  position:absolute; inset:-40%; z-index:0; pointer-events:none;
  background:
    radial-gradient(circle at 20% 30%, rgba(124,130,255,0.16), transparent 55%),
    radial-gradient(circle at 80% 20%, rgba(240,176,78,0.10), transparent 50%),
    radial-gradient(circle at 60% 80%, rgba(47,224,160,0.08), transparent 55%);
  animation: svcAuroraDrift 22s ease-in-out infinite;
}

.svc-card {
  transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.22s ease, background 0.22s ease;
  will-change: transform;
  position: relative;
  overflow: hidden;
  animation: svcFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) backwards;
}
.svc-card:hover {
  transform: translateY(-4px);
  background: #12152a !important;
}
.svc-card:hover .edit-reveal { opacity: 1 !important; transform: scale(1) !important; }
.edit-reveal { opacity: 0; transform: scale(0.85); transition: opacity 0.15s ease, transform 0.15s ease; }

.corp-card {
  transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), border-color 0.22s ease, box-shadow 0.25s ease, background 0.22s ease;
  animation: svcFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) backwards;
}
.corp-card:hover {
  transform: translateY(-3px);
  background: #12152a !important;
  box-shadow: 0 14px 36px rgba(0,0,0,0.4);
}

.super-tab {
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  position: relative;
}

.sub-tab { transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease; }

.stat-cell { transition: background 0.2s ease, transform 0.2s ease; position: relative; overflow: hidden; }
.stat-cell:hover { background: #10131f !important; }

.btn-accent { transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.2s ease; }
.btn-accent:hover { opacity: 0.9; transform: translateY(-1.5px); }
.btn-accent:active { transform: translateY(0); opacity: 1; }

.btn-ghost { transition: background 0.13s ease, color 0.13s ease, border-color 0.13s ease; }
.btn-ghost:hover { background: #1c2140 !important; color: #f4f6fc !important; border-color: rgba(255,255,255,0.15) !important; }

.icon-btn { transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1); }
.icon-btn:hover { transform: translateY(-1px) scale(1.06); }
.icon-btn:active { transform: scale(0.92); }

.status-pill { transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease; }

.modal-back { animation: svcFadeIn 0.2s ease both; backdrop-filter: blur(4px); }
.modal-box  { animation: svcScaleIn 0.26s cubic-bezier(0.16,1,0.3,1) both; }

.svc-toast { animation: svcFadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both; }
.svc-offline-bar { animation: svcSlideDown 0.28s cubic-bezier(0.16,1,0.3,1) both; }

.svc-skeleton {
  background: linear-gradient(90deg, #151830 25%, rgba(255,255,255,0.06) 37%, #151830 63%);
  background-size: 400px 100%;
  animation: svcShimmer 1.4s ease infinite;
}
.svc-spinner { animation: svcSpin 0.85s linear infinite; }

.price-input:focus { border-color: #7c82ff !important; box-shadow: 0 0 0 3px rgba(124,130,255,0.18) !important; }
.search-input:focus { border-color: rgba(124,130,255,0.5) !important; box-shadow: 0 0 0 3px rgba(124,130,255,0.12) !important; }

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }

@media (max-width: 900px) {
  .svc-header-row { flex-direction: column; align-items: flex-start !important; gap: 14px; }
  .svc-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
  .svc-catalog-grid { grid-template-columns: 1fr !important; }
  .svc-corp-grid { grid-template-columns: 1fr !important; }
  .svc-badge-pill { display: none !important; }
}

@media (prefers-reduced-motion: reduce) {
  .svc-aurora, .svc-card, .corp-card, .modal-back, .modal-box, .svc-toast,
  .svc-offline-bar, .svc-skeleton, .svc-spinner { animation: none !important; }
  .svc-card:hover, .corp-card:hover { transform: none !important; }
}

/* ✅ MOBILE TWEAKS (added only) */
@media (max-width: 720px) {
  .svc-header-row { padding: 16px !important; }
  .svc-stats-grid { grid-template-columns: 1fr !important; }
  .svc-catalog-grid { min-width: 280px !important; }
  .svc-corp-grid { min-width: 280px !important; }
}
`;

/* ─── CONSTANTS ─────────────────────────────────────────────── */
const EXPRESS = 10;

const LOYALTY = [
  { name:"Standard", visits:"< 5 visits",   discount:0,  color:"#5a6683" },
  { name:"Bronze",   visits:"5–14 visits",   discount:5,  color:"#d08a4a" },
  { name:"Silver",   visits:"15–29 visits",  discount:10, color:"#9aabc9" },
  { name:"Gold",     visits:"30+ visits",    discount:15, color:"#f0b04e" },
  { name:"VIP",      visits:"By management", discount:20, color:"#c084ff" },
];

/* Super-category config — each has a color accent for its tab indicator */
const SUPER_CATS = [
  { key:"all",        label:"All Services",  icon:Grid,     color:T.accent,   dim:T.accentDim,   bord:T.accentBord   },
  { key:"laundry",    label:"Laundry",       icon:Shirt,    color:T.sky,      dim:T.skyDim,      bord:T.skyBord      },
  { key:"cleaning",   label:"Cleaning",      icon:Droplets, color:T.emerald,  dim:T.emeraldDim,  bord:T.emeraldBord  },
  { key:"fumigation", label:"Fumigation",    icon:SprayCan, color:T.violet,   dim:T.violetDim,   bord:T.violetBord   },
  { key:"car",        label:"Car Detailing", icon:Car,      color:T.gold,     dim:T.goldDim,     bord:T.goldBord     },
];

const CAT_ICONS: Record<string,any> = {
  Tops:Shirt, Bottoms:Layers, Ladies:Star, Suits:Package,
  Traditional:Sparkles, Basics:Grid, Fabric:Wind,
  Linen:Home, Home:Home, Specialty:Star,
  Residential:Home, Commercial:Building2, Industrial:SprayCan,
  Exterior:Car, Interior:Star, "Full Detail":Sparkles,
  "Deep Clean":Droplets,
};

const CATS_BY_SUPER: Record<string,string[]> = {
  laundry:    ["Tops","Bottoms","Ladies","Suits","Traditional","Basics","Fabric","Linen","Home","Specialty"],
  cleaning:   ["Residential","Commercial","Deep Clean"],
  fumigation: ["Residential","Commercial","Industrial"],
  car:        ["Exterior","Interior","Full Detail"],
};

/* ─── TYPES ─────────────────────────────────────────────────── */
interface Prices { wash:number; iron:number; fold:number; hang:number }
interface Service { id:string; name:string; category:string; superCat:string; prices:Prices }
interface Client  { id:string; name:string; type:string; billing:string; discount:string; active:boolean; contractRef:string; notes:string }
interface Toast { msg:string; type:'success'|'error' }

/* ─── LOCAL FALLBACK DATA (used only until the server responds) ─ */
// ❌ REMOVED: const INIT_SERVICES: Service[] = [...] — no more generic data
// ❌ REMOVED: const INIT_CLIENTS: Client[] = [...] — no more generic data

/* ─── SMALL HOOK: animated count-up for stat numbers ─────────── */
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* PRICE CHIP */
const Chip = ({ label, value, accent }: { label:string; value:number; accent?:string }) => (
  <div style={{ flex:1, minWidth:0, background:T.bgElevated,
    border:`1px solid ${T.borderFaint}`, borderRadius:8,
    padding:"9px 10px", display:"flex", flexDirection:"column", gap:3,
    transition:"border-color 0.18s ease" }}>
    <span style={{ fontSize:9.5, color:T.textTert, textTransform:"uppercase",
      letterSpacing:"0.09em", fontWeight:700, fontFamily:FONT }}>{label}</span>
    <span style={{ fontSize:16, fontWeight:500,
      color: value ? (accent || T.textPrimary) : T.textHint,
      fontFamily:MONO, letterSpacing:"-0.02em", lineHeight:1 }}>
      {value ? `₵${value}` : <span style={{fontSize:13,color:T.textHint}}>—</span>}
    </span>
  </div>
);

/* ─── OFFLINE BANNER ─────────────────────────────────────────── */
const OfflineBanner = ({ onRetry, retrying, lastSynced }: { onRetry:()=>void; retrying:boolean; lastSynced: Date | null }) => (
  <div className="svc-offline-bar" style={{
    background: "linear-gradient(90deg, rgba(255,96,96,0.14), rgba(255,96,96,0.06))",
    borderBottom: `1px solid ${T.emberBord}`,
    padding: "10px 32px", display: "flex", alignItems: "center", gap: 12,
  }}>
    <WifiOff size={15} color={T.ember} style={{ flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.ember, fontFamily: FONT }}>
        Can't reach the server — you're offline.
      </span>
      <span style={{ fontSize: 12.5, color: "#ffb3b3", fontFamily: FONT, marginLeft: 8 }}>
        Showing local reference data{lastSynced ? `, last synced ${lastSynced.toLocaleTimeString()}` : ""}. Changes here won't be saved until you're back online.
      </span>
    </div>
    <button className="btn-ghost" onClick={onRetry} disabled={retrying}
      style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${T.emberBord}`,
        borderRadius: 7, color: T.ember, fontSize: 12.5, fontWeight: 600, cursor: retrying ? "default" : "pointer",
        display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, flexShrink: 0 }}>
      {retrying ? <Loader2 size={13} className="svc-spinner" /> : <RefreshCw size={13} />}
      {retrying ? "Retrying…" : "Retry"}
    </button>
  </div>
);

/* ─── SERVICE CARD ──────────────────────────────────────────── */
const ServiceCard = ({ item, onEdit, superConf, index }: {
  item: Service;
  onEdit: (s:Service)=>void;
  superConf: typeof SUPER_CATS[0];
  index: number;
}) => {
  const Icon = CAT_ICONS[item.category] || Package;
  const isLaundry = item.superCat === "laundry";

  return (
    <div className="svc-card"
      style={{ background:T.bgRaised, border:`1px solid ${T.borderSoft}`,
        borderRadius:13, padding:"16px 16px 16px 19px", display:"flex",
        flexDirection:"column", gap:11, cursor:"default", position:"relative",
        animationDelay:`${Math.min(index,16)*22}ms` }}>

      {/* left accent bar */}
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3,
        background: superConf.color, opacity:0.7 }} />

      {/* top row */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:11 }}>
        <div style={{ width:36, height:36, borderRadius:9, flexShrink:0,
          background: `linear-gradient(135deg, ${superConf.dim}, transparent)`,
          border:`1px solid ${superConf.bord}`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={15} color={superConf.color} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:T.textPrimary,
            letterSpacing:"-0.015em", lineHeight:1.3, fontFamily:FONT }}>
            {item.name}
          </div>
          <div style={{ fontSize:10.5, color:T.textTert, marginTop:2.5,
            textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:FONT }}>
            {item.category}
          </div>
        </div>
        <button className="edit-reveal icon-btn"
          onClick={() => onEdit(item)}
          style={{ width:30, height:30, borderRadius:7, flexShrink:0,
            border:`1px solid ${T.borderSoft}`, background:T.bgElevated,
            color:T.textSec, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Edit2 size={12} />
        </button>
      </div>

      {/* price chips */}
      {isLaundry ? (
        <div style={{ display:"flex", gap:5 }}>
          <Chip label="Wash" value={item.prices.wash} />
          {item.prices.iron > 0 && <Chip label="Iron" value={item.prices.iron} />}
          <Chip label="Fold" value={item.prices.fold} />
          {item.prices.hang > 0 && <Chip label="Hang" value={item.prices.hang} />}
        </div>
      ) : (
        <div style={{ display:"flex", gap:5 }}>
          <Chip label="Rate (GH₵)" value={item.prices.fold} accent={superConf.color} />
        </div>
      )}

      {/* footer */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", paddingTop:8, borderTop:`1px solid ${T.borderFaint}` }}>
        {isLaundry ? (
          <>
            <span style={{ fontSize:10.5, color:T.textTert, fontFamily:FONT }}>
              Express{" "}
              <span style={{ color:T.gold, fontFamily:MONO, fontWeight:500 }}>
                +₵{EXPRESS}
              </span>
            </span>
            <span style={{ fontSize:10.5, color:T.textHint, fontFamily:MONO }}>
              min ₵{item.prices.wash + EXPRESS}
            </span>
          </>
        ) : (
          <span style={{ fontSize:10.5, color:T.textTert, fontFamily:FONT }}>
            Quoted per job &nbsp;·&nbsp; contact for custom pricing
          </span>
        )}
      </div>
    </div>
  );
};

/* ─── EDIT MODAL ────────────────────────────────────────────── */
const EditModal = ({ item, onSave, onClose, saving }: {
  item: Service; onSave:(p:Prices)=>void; onClose:()=>void; saving:boolean;
}) => {
  const [p, setP] = useState({...item.prices});
  const isLaundry = item.superCat === "laundry";
  const fields: {key:keyof Prices; label:string}[] = isLaundry
    ? [{key:"wash",label:"Washing"},{key:"iron",label:"Ironing"},{key:"fold",label:"Folding"},{key:"hang",label:"Hanging"}]
    : [{key:"fold",label:"Rate (GH₵)"}];

  return (
    <div className="modal-back"
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:9999,
        background:"rgba(3,5,10,0.82)",
        display:"flex", alignItems:"center",
        justifyContent:"center", padding:"20px" }}>

      <div className="modal-box"
        style={{ background:T.bgRaised, border:`1px solid ${T.borderMid}`,
          borderRadius:16, width:460, maxWidth:"94vw",
          maxHeight:"86vh", overflowY:"auto",
          display:"flex", flexDirection:"column",
          boxShadow:"0 28px 70px rgba(0,0,0,0.55)" }}>

        <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${T.borderFaint}`,
          display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          position:"sticky", top:0, background:T.bgRaised, zIndex:2 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary,
              letterSpacing:"-0.02em", fontFamily:FONT }}>{item.name}</div>
            <div style={{ fontSize:11, color:T.textTert, marginTop:3,
              textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:FONT }}>
              {item.category} · Edit Pricing
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:8,
              border:`1px solid ${T.borderSoft}`, background:"transparent",
              color:T.textSec, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <div style={{ fontSize:10, color:T.textTert, textTransform:"uppercase",
              letterSpacing:"0.1em", fontWeight:700, marginBottom:10, fontFamily:FONT }}>
              {isLaundry ? "Standard Pricing (GH₵)" : "Service Rate (GH₵)"}
            </div>
            <div style={{ display:"grid",
              gridTemplateColumns: isLaundry ? "1fr 1fr" : "1fr", gap:9 }}>
              {fields.map(({key,label}) => (
                <div key={key}
                  style={{ background:T.bgElevated,
                    border:`1px solid ${T.borderSoft}`,
                    borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:10, color:T.textTert, textTransform:"uppercase",
                    letterSpacing:"0.08em", fontWeight:700,
                    marginBottom:8, fontFamily:FONT }}>{label}</div>
                  <input type="number" min={0} value={p[key]}
                    onChange={e => setP(prev => ({...prev,[key]:Number(e.target.value)}))}
                    className="price-input"
                    style={{ width:"100%", background:T.bgSurface,
                      border:`1px solid ${T.borderMid}`, borderRadius:7,
                      color:T.textPrimary, fontFamily:MONO,
                      fontSize:24, fontWeight:500, textAlign:"center",
                      padding:"8px 0", outline:"none",
                      letterSpacing:"-0.02em", transition:"border-color 0.15s, box-shadow 0.15s" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {isLaundry && (
            <div style={{ background:T.goldDim, border:`1px solid ${T.goldBord}`,
              borderRadius:10, padding:"13px 16px" }}>
              <div style={{ fontSize:10, color:T.gold, textTransform:"uppercase",
                letterSpacing:"0.1em", fontWeight:700, marginBottom:10, fontFamily:FONT }}>
                Express Prices (+GH₵{EXPRESS})
              </div>
              <div style={{ display:"flex", gap:10 }}>
                {fields.map(({key,label}) => (
                  <div key={key} style={{ flex:1, textAlign:"center" }}>
                    <div style={{ fontSize:10, color:T.textTert, marginBottom:4, fontFamily:FONT }}>
                      {label.slice(0,4)}
                    </div>
                    <div style={{ fontSize:15, fontWeight:500, color:T.gold, fontFamily:MONO }}>
                      ₵{p[key]+EXPRESS}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLaundry && (
            <div style={{ background:T.bgElevated,
              border:`1px solid ${T.borderFaint}`, borderRadius:10, overflow:"hidden" }}>
              <div style={{ fontSize:10, color:T.textTert, textTransform:"uppercase",
                letterSpacing:"0.1em", fontWeight:700, padding:"9px 14px",
                borderBottom:`1px solid ${T.borderFaint}`, fontFamily:FONT }}>
                Loyalty Discount Tiers
              </div>
              {LOYALTY.map((tier,i) => (
                <div key={tier.name}
                  style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"8px 14px",
                    borderBottom: i<LOYALTY.length-1?`1px solid ${T.borderFaint}`:"none" }}>
                  <span style={{ fontSize:12.5, fontWeight:600,
                    color:tier.color, fontFamily:FONT }}>{tier.name}</span>
                  <span style={{ fontSize:11, color:T.textTert, fontFamily:MONO }}>
                    {tier.visits}
                  </span>
                  <span style={{ fontSize:12.5, fontWeight:500,
                    color:T.emerald, fontFamily:MONO }}>{tier.discount}% off</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding:"14px 24px", borderTop:`1px solid ${T.borderFaint}`,
          display:"flex", justifyContent:"flex-end", gap:10,
          position:"sticky", bottom:0, background:T.bgRaised }}>
          <button className="btn-ghost" onClick={onClose}
            style={{ padding:"9px 20px", background:"transparent",
              border:`1px solid ${T.borderSoft}`, borderRadius:8,
              color:T.textSec, fontSize:13.5, fontWeight:500,
              cursor:"pointer", fontFamily:FONT }}>
            Cancel
          </button>
          <button className="btn-accent" disabled={saving}
            onClick={()=>onSave(p)}
            style={{ padding:"9px 22px", background:T.emerald, border:"none",
              borderRadius:8, color:"#03261a", fontSize:13.5, fontWeight:700,
              cursor: saving ? "default" : "pointer", display:"flex", alignItems:"center",
              gap:7, fontFamily:FONT, opacity: saving ? 0.7 : 1,
              boxShadow:`0 8px 22px ${T.emeraldGlow}` }}>
            {saving ? <Loader2 size={14} className="svc-spinner" /> : <Check size={14}/>}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── ADD ITEM MODAL ────────────────────────────────────────── */
const AddModal = ({ onClose, onAdd, defaultSuper="laundry", adding }: {
  onClose:()=>void; onAdd:(s:Service)=>void; defaultSuper?:string; adding:boolean;
}) => {
  const [name,   setName]   = useState("");
  const [superCat, setSuperCat] = useState(defaultSuper);
  const [cat,    setCat]    = useState(CATS_BY_SUPER[defaultSuper]?.[0] || "");
  const [prices, setPrices] = useState<Prices>({wash:0,iron:0,fold:0,hang:0});
  const isLaundry = superCat === "laundry";

  const handleSuperChange = (v:string) => {
    setSuperCat(v);
    setCat(CATS_BY_SUPER[v]?.[0] || "");
  };

  return (
    <div className="modal-back"
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{ position:"fixed", inset:0, zIndex:9999,
        background:"rgba(3,5,10,0.82)",
        display:"flex", alignItems:"center",
        justifyContent:"center", padding:"20px" }}>
      <div className="modal-box"
        style={{ background:T.bgRaised, border:`1px solid ${T.borderMid}`,
          borderRadius:16, width:500, maxWidth:"94vw",
          display:"flex", flexDirection:"column",
          boxShadow:"0 28px 70px rgba(0,0,0,0.55)" }}>

        <div style={{ padding:"20px 24px 16px",
          borderBottom:`1px solid ${T.borderFaint}`,
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700,
              color:T.textPrimary, fontFamily:FONT }}>Add Service Item</div>
            <div style={{ fontSize:11, color:T.textTert, marginTop:3, fontFamily:FONT }}>
              New item with pricing
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:8,
              border:`1px solid ${T.borderSoft}`, background:"transparent",
              color:T.textSec, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:11, color:T.textTert, marginBottom:6, fontFamily:FONT }}>
              Item Name
            </div>
            <input value={name} onChange={e=>setName(e.target.value)}
              placeholder="e.g. Duvet Cover"
              className="price-input"
              style={{ width:"100%", padding:"10px 13px",
                background:T.bgSurface, border:`1px solid ${T.borderMid}`,
                borderRadius:8, color:T.textPrimary, fontSize:14,
                outline:"none", fontFamily:FONT }}
            />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:T.textTert, marginBottom:6, fontFamily:FONT }}>
                Service Type
              </div>
              <select value={superCat} onChange={e=>handleSuperChange(e.target.value)}
                style={{ width:"100%", padding:"9px 12px",
                  background:T.bgSurface, border:`1px solid ${T.borderMid}`,
                  borderRadius:8, color:T.textPrimary, fontSize:13,
                  outline:"none", fontFamily:FONT }}>
                {SUPER_CATS.filter((c: typeof SUPER_CATS[0])=>c.key!=="all").map(c=>(
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:T.textTert, marginBottom:6, fontFamily:FONT }}>
                Category
              </div>
              <select value={cat} onChange={e=>setCat(e.target.value)}
                style={{ width:"100%", padding:"9px 12px",
                  background:T.bgSurface, border:`1px solid ${T.borderMid}`,
                  borderRadius:8, color:T.textPrimary, fontSize:13,
                  outline:"none", fontFamily:FONT }}>
                {(CATS_BY_SUPER[superCat]||[]).map(c=>(
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, color:T.textTert, marginBottom:8, fontFamily:FONT }}>
              {isLaundry ? "Standard Pricing (GH₵)" : "Service Rate (GH₵)"}
            </div>
            <div style={{ display:"grid",
              gridTemplateColumns: isLaundry ? "repeat(4,1fr)" : "1fr", gap:8 }}>
              {(isLaundry
                ? [{k:"wash",l:"Wash"},{k:"iron",l:"Iron"},{k:"fold",l:"Fold"},{k:"hang",l:"Hang"}]
                : [{k:"fold",l:"Rate"}]
              ).map(({k,l})=>(
                <div key={k} style={{ background:T.bgElevated,
                  border:`1px solid ${T.borderSoft}`, borderRadius:8, padding:"10px" }}>
                  <div style={{ fontSize:10, color:T.textTert,
                    marginBottom:6, fontFamily:FONT }}>{l}</div>
                  <input type="number" min={0}
                    value={prices[k as keyof Prices]}
                    onChange={e=>setPrices(pr=>({...pr,[k]:Number(e.target.value)}))}
                    className="price-input"
                    style={{ width:"100%", background:T.bgSurface,
                      border:`1px solid ${T.borderMid}`, borderRadius:6,
                      color:T.textPrimary, fontFamily:MONO, fontSize:18,
                      fontWeight:500, textAlign:"center",
                      padding:"6px 0", outline:"none" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding:"14px 24px",
          borderTop:`1px solid ${T.borderFaint}`,
          display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button className="btn-ghost" onClick={onClose}
            style={{ padding:"9px 20px", background:"transparent",
              border:`1px solid ${T.borderSoft}`, borderRadius:8,
              color:T.textSec, fontSize:13.5, fontWeight:500,
              cursor:"pointer", fontFamily:FONT }}>
            Cancel
          </button>
          <button className="btn-accent" disabled={adding}
            onClick={()=>{
              if(!name.trim()) return;
              onAdd({id:`new-${Date.now()}`,name:name.trim(),category:cat,superCat,prices});
            }}
            style={{ padding:"9px 22px", background:T.accent, border:"none",
              borderRadius:8, color:"#fff", fontSize:13.5, fontWeight:700,
              cursor: adding ? "default" : "pointer", display:"flex", alignItems:"center",
              gap:7, fontFamily:FONT, opacity: adding ? 0.7 : 1,
              boxShadow:`0 8px 22px ${T.accentGlow}` }}>
            {adding ? <Loader2 size={14} className="svc-spinner" /> : <Check size={14}/>}
            {adding ? "Adding…" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN ──────────────────────────────────────────────────── */
export const Services = () => {
  const location = useLocation(); // ✅ Added for permission hook
  const [services, setServices] = useState<Service[]>([]); // ✅ Start empty, no mock
  const [clients,  setClients]  = useState<Client[]>([]); // ✅ Start empty, no mock
  const [search,   setSearch]   = useState("");
  const [superCat, setSuperCat] = useState("all");
  const [subCat,   setSubCat]   = useState("All");
  const [editing,  setEditing]  = useState<Service|null>(null);
  const [showAdd,  setShowAdd]  = useState(false);

  const [isOffline, setIsOffline] = useState(false);
  const [retrying,  setRetrying]  = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // ✅ Permission hook for guard
  const { permission, loading: permLoading, canEdit } = usePermission(location.pathname);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* inject global CSS once */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "svc-premium-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  /* ─── SUPABASE: fetch, with honest offline reporting ─────────
     If the request fails, we keep whatever data is already on
     screen (initially the local reference catalog) but flip
     isOffline=true so the UI clearly says so — we never pretend
     a failed fetch means "no data" or silently swap in mock data
     without telling the person. */
  const fetchFromSupabase = useCallback(async () => {
    try {
      const { data: svcData, error: svcError } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (svcError) throw svcError;

      if (svcData && svcData.length > 0) {
        const mapped = svcData.map((s: any): Service => ({
          id: s.id,
          name: s.name,
          category: s.category,
          superCat: s.super_cat || 'laundry',
          prices: {
            wash: Number(s.price_wash) || 0,
            iron: Number(s.price_iron) || 0,
            fold: Number(s.price_fold) || 0,
            hang: Number(s.price_hang) || 0,
          }
        }));
        setServices(mapped);
      } else {
        // ✅ Supabase returned empty — show true empty state
        setServices([]);
      }

      const { data: cliData, error: cliError } = await supabase
        .from('clients')
        .select('*')
        .eq('type', 'Corporate')
        .order('name');

      if (cliError) throw cliError;

      if (cliData && cliData.length > 0) {
        const mapped = cliData.map((c: any): Client => ({
          id: c.id,
          name: c.name,
          type: c.type,
          billing: 'Monthly',
          discount: c.tier === 'Corporate' ? '10%' : '-',
          active: true,
          contractRef: c.contract_ref || `CPL-${c.name.split(' ')[0].slice(0,3).toUpperCase()}-${Math.floor(Math.random()*900)+100}`,
          notes: c.notes || ''
        }));
        setClients(mapped);
      } else {
        // ✅ Supabase returned empty — show true empty state
        setClients([]);
      }

      setIsOffline(false);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Services fetch error:', err);
      setIsOffline(true);
    } finally {
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  const handleRetry = () => {
    setRetrying(true);
    fetchFromSupabase();
  };

  const activeSuperConf = SUPER_CATS.find(s=>s.key===superCat) || SUPER_CATS[0];

  const filtered = useMemo(() => {
    let r = services;
    if (superCat !== "all")  r = r.filter(s => s.superCat === superCat);
    if (subCat  !== "All")   r = r.filter(s => s.category === subCat);
    if (search)              r = r.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [services, superCat, subCat, search]);

  const subCats = useMemo(() => {
    const base = superCat === "all"
      ? services
      : services.filter(s => s.superCat === superCat);
    return ["All", ...Array.from(new Set(base.map(s=>s.category)))];
  }, [services, superCat]);

  const grouped = useMemo(() => {
    const g: Record<string,Service[]> = {};
    filtered.forEach(s => { if(!g[s.category]) g[s.category]=[]; g[s.category].push(s); });
    return g;
  }, [filtered]);

  /* ─── SUPABASE: Save Edit — only reflects locally once the
       server confirms it, and reports failure honestly ─────── */
  const saveEdit = async (id:string, prices:Prices) => {
    setSavingEdit(true);
    try {
      const { error } = await supabase.from('services').update({
        price_wash: prices.wash,
        price_iron: prices.iron,
        price_fold: prices.fold,
        price_hang: prices.hang
      }).eq('id', id);
      if (error) throw error;
      setServices(p => p.map(s => s.id===id ? {...s,prices} : s));
      showToast('Pricing updated', 'success');
      setEditing(null);
    } catch (err) {
      console.error('Save edit error:', err);
      setIsOffline(true);
      showToast("Couldn't reach the server — pricing wasn't saved", 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  /* ─── SUPABASE: Add Item ─────────────────────────────────── */
  const addItem = async (item:Service) => {
    setAddingItem(true);
    try {
      const { data, error } = await supabase.from('services').insert([{
        name: item.name,
        category: item.category,
        price_wash: item.prices.wash,
        price_iron: item.prices.iron,
        price_fold: item.prices.fold,
        price_hang: item.prices.hang
      }]).select();
      if (error) throw error;
      setServices(p=>[...p, {...item, id: data?.[0]?.id || item.id}]);
      showToast('Service item added', 'success');
      setShowAdd(false);
    } catch (err) {
      console.error('Add item error:', err);
      setIsOffline(true);
      showToast("Couldn't reach the server — item wasn't added", 'error');
    } finally {
      setAddingItem(false);
    }
  };

  /* ─── SUPABASE: Update Corporate Client ─────────────────── */
  const updateClient = async (id:string, updates:Partial<Client>) => {
    const previous = clients;
    setClients(p => p.map(c => c.id===id ? {...c, ...updates} : c));
    try {
      const { error } = await supabase.from('clients').update(updates).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Update client error:', err);
      setIsOffline(true);
      setClients(previous);
      showToast("Couldn't reach the server — change wasn't saved", 'error');
    }
  };

  const stats = {
    total:      services.length,
    cats:       Array.from(new Set(services.map(s=>s.category))).length,
    avgWash:    (() => {
      const laundryServices = services.filter(s => s.superCat === "laundry");
      if (laundryServices.length === 0) return 0;
      const total = laundryServices.reduce((a, s) => a + (s.prices.wash || 0), 0);
      return Math.round(total / laundryServices.length);
    })(),
    activeCorp: clients.filter(c => c.active).length,
  };

  const totalCount   = useCountUp(stats.total);
  const catCount     = useCountUp(stats.cats);
  const avgWashCount = useCountUp(stats.avgWash);
  const corpCount    = useCountUp(stats.activeCorp);

  const lbl = (sz=10.5, color=T.textTert): React.CSSProperties =>
    ({fontSize:sz,color,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700,fontFamily:FONT});

  // ✅ Wait for permissions to load
  if (permLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: T.textTert, fontFamily: FONT }}>
      Loading...
    </div>
  );

  return (
    <>
      {showAdd  && <AddModal onClose={()=>setShowAdd(false)} onAdd={addItem} defaultSuper={superCat==="all"?"laundry":superCat} adding={addingItem}/>}
      {editing  && <EditModal item={editing} onSave={(p)=>saveEdit(editing.id,p)} onClose={()=>setEditing(null)} saving={savingEdit}/>}

      {toast && (
        <div className="svc-toast" style={{ position:"fixed", bottom:24, right:24,
          background: toast.type==='error' ? T.emberDim : T.emeraldDim,
          border:`1px solid ${toast.type==='error' ? T.emberBord : T.emeraldBord}`,
          borderRadius:10, padding:"12px 20px", display:"flex", alignItems:"center", gap:12,
          boxShadow:"0 14px 36px rgba(0,0,0,0.45)", zIndex:10000 }}>
          {toast.type==='error' ? <AlertCircle size={15} color={T.ember}/> : <Check size={15} color={T.emerald}/>}
          <span style={{ fontSize:14, color: toast.type==='error' ? T.ember : T.emerald, fontWeight:500, fontFamily:FONT }}>{toast.msg}</span>
          <button onClick={()=>setToast(null)} style={{ padding:4, background:"transparent", border:"none", color:T.textSec, cursor:"pointer" }}><X size={14}/></button>
        </div>
      )}

      <div style={{ background:T.bgBase, minHeight:"100vh",
        fontFamily:FONT, color:T.textPrimary, animation:"svcFadeIn 0.3s ease" }}>

        {isOffline && <OfflineBanner onRetry={handleRetry} retrying={retrying} lastSynced={lastSynced} />}

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div className="svc-header-row" style={{ background:T.bgSurface,
          borderBottom:`1px solid ${T.borderFaint}`,
          padding:"22px 32px", position:"relative", overflow:"hidden",
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div className="svc-aurora" />
          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ fontSize:21, fontWeight:700, color:T.textPrimary,
              letterSpacing:"-0.03em", fontFamily:FONT }}>
              Services &amp; Pricing
            </div>
            <div style={{ fontSize:12.5, color:T.textTert, marginTop:4, fontFamily:FONT, display:"flex", alignItems:"center", gap:8 }}>
              <span>Chapman Prestige Limited &nbsp;·&nbsp; {services.length} items across {stats.cats} categories</span>
              {!isOffline && lastSynced && (
                <span style={{ display:"flex", alignItems:"center", gap:4, color:T.emerald }}>
                  <Clock size={11} /> Synced {lastSynced.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", position:"relative", zIndex:1 }}>
            <div className="svc-badge-pill" style={{ display:"flex", alignItems:"center", gap:7,
              padding:"7px 14px", background:T.goldDim,
              border:`1px solid ${T.goldBord}`, borderRadius:100,
              color:T.gold, fontSize:12.5, fontWeight:600, fontFamily:FONT,
              boxShadow:`0 0 22px -8px ${T.goldGlow}` }}>
              <AlertCircle size={13}/> Express +GH₵{EXPRESS} / laundry item
            </div>
            <button 
              className="btn-accent"
              onClick={() => canEdit && setShowAdd(true)}
              disabled={!canEdit}
              style={{ 
                padding:"10px 20px", 
                background: canEdit ? T.accent : T.textHint, 
                border:"none",
                borderRadius:9, 
                color: canEdit ? "#fff" : T.textTert, 
                fontSize:14, 
                fontWeight:600,
                cursor: canEdit ? "pointer" : "not-allowed", 
                display:"flex", 
                alignItems:"center",
                gap:7, 
                fontFamily:FONT, 
                boxShadow: canEdit ? `0 8px 24px -6px ${T.accentGlow}` : "none",
                opacity: canEdit ? 1 : 0.7
              }}>
              <Plus size={15}/> {canEdit ? "Add Item" : "View Only"}
            </button>
          </div>
        </div>

        {/* ══ STATS BAR ═══════════════════════════════════════ */}
        <div className="svc-stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          background:T.bgSurface, borderBottom:`1px solid ${T.borderFaint}` }}>
          {[
            {label:"Total Items",        val:totalCount,   color:T.accent},
            {label:"Categories",         val:catCount,     color:T.sky},
            {label:"Avg. Laundry Wash",  val:avgWashCount, color:T.gold,   prefix:"GH₵"},
            {label:"Corporate Accounts", val:corpCount,    color:T.emerald, suffix:` / ${clients.length}`},
          ].map((st,i) => (
            <div key={st.label} className="stat-cell"
              style={{ padding:"16px 28px",
                borderRight: i<3 ? `1px solid ${T.borderFaint}` : "none" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
                background: st.color, opacity:0.5 }} />
              <div style={lbl(10.5,T.textTert)}>{st.label}</div>
              <div style={{ fontSize:26, fontWeight:600, color:T.textPrimary,
                letterSpacing:"-0.04em", lineHeight:1, marginTop:7, fontFamily:FONT }}>
                {st.prefix || ""}{st.val}{st.suffix || ""}
              </div>
            </div>
          ))}
        </div>

        {/* ══ SUPER-CATEGORY TABS ═════════════════════════════ */}
        <div style={{ background:T.bgSurface,
          borderBottom:`1px solid ${T.borderFaint}`,
          padding:"0 32px",
          display:"flex", gap:2, overflowX:"auto" }}>
          {SUPER_CATS.map(tab => {
            const Icon = tab.icon;
            const active = superCat === tab.key;
            return (
              <button key={tab.key}
                className={`super-tab${active?" active":""}`}
                onClick={()=>{ setSuperCat(tab.key); setSubCat("All"); }}
                style={{ display:"flex", alignItems:"center", gap:8,
                  padding:"14px 18px", background:"transparent",
                  border:"none", borderBottom: active
                    ? `2px solid ${tab.color}`
                    : "2px solid transparent",
                  color: active ? tab.color : T.textTert,
                  fontSize:13.5, fontWeight: active ? 600 : 500,
                  cursor:"pointer", fontFamily:FONT,
                  whiteSpace:"nowrap", marginBottom:"-1px",
                  boxShadow: active ? `0 10px 20px -12px ${tab.color}` : "none" }}>
                <Icon size={15}/>
                {tab.label}
                {active && (
                  <span style={{ background:tab.dim, border:`1px solid ${tab.bord}`,
                    color:tab.color, fontSize:10, fontWeight:700,
                    padding:"2px 7px", borderRadius:100, fontFamily:MONO }}>
                    {services.filter(s=>tab.key==="all"||s.superCat===tab.key).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══ SUB-CATEGORY STRIP + SEARCH ═════════════════════ */}
        <div style={{ background:T.bgSurface,
          borderBottom:`1px solid ${T.borderFaint}`,
          padding:"10px 32px",
          display:"flex", alignItems:"center",
          gap:6, flexWrap:"wrap" }}>

          {subCats.map(cat => {
            const active = subCat === cat;
            return (
              <button key={cat} className="sub-tab"
                onClick={()=>setSubCat(cat)}
                style={{ padding:"5px 14px", borderRadius:7,
                  fontSize:12.5, fontWeight:500, cursor:"pointer",
                  fontFamily:FONT, border:`1px solid ${active ? T.accentBord : "transparent"}`,
                  background: active ? T.accentDim : "transparent",
                  color: active ? T.accentSoft : T.textTert }}>
                {cat}
              </button>
            );
          })}

          <div style={{ flex:1 }}/>

          <div style={{ position:"relative", width:230, flexShrink:0 }}>
            <Search size={13} style={{ position:"absolute", left:11, top:"50%",
              transform:"translateY(-50%)", color:T.textHint, pointerEvents:"none" }}/>
            <input className="search-input"
              placeholder="Search items…"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{ width:"100%", padding:"8px 12px 8px 32px",
                background:T.bgRaised, border:`1px solid ${T.borderSoft}`,
                borderRadius:8, color:T.textPrimary, fontSize:13,
                outline:"none", fontFamily:FONT,
                transition:"border-color 0.15s" }}
            />
          </div>
        </div>

        {/* CONTENT - Wrapped with PermissionGuard */}
        <PermissionGuard>
          <div style={{ padding:"26px 32px" }}>
            {filtered.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                padding:"72px 0", gap:14 }}>
                <div style={{ width:56, height:56, borderRadius:14,
                  background:T.bgRaised, border:`1px solid ${T.borderSoft}`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Package size={26} color={T.textHint}/>
                </div>
                <div style={{ fontSize:14, color:T.textTert, fontFamily:FONT }}>
                  {isOffline 
                    ? "Connection issue — retry to load services" 
                    : services.length === 0 
                      ? "No services added yet" 
                      : "No items match your filters"}
                </div>
                {canEdit && (
                  <button className="btn-accent"
                    onClick={()=>setShowAdd(true)}
                    style={{ padding:"9px 20px", background:T.accent,
                      border:"none", borderRadius:8, color:"#fff",
                      fontSize:13.5, fontWeight:600, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:7, fontFamily:FONT }}>
                    <Plus size={14}/> Add First Item
                  </button>
                )}
              </div>
            ) : (
              Object.entries(grouped).map(([cat, items]) => {
                const CatIcon = CAT_ICONS[cat] || Package;
                const conf = SUPER_CATS.find(s=>s.key===items[0]?.superCat) || SUPER_CATS[0];
                return (
                  <div key={cat} style={{ marginBottom:32 }}>
                    <div style={{ display:"flex", alignItems:"center",
                      gap:10, marginBottom:13 }}>
                      <div style={{ width:24, height:24, borderRadius:6,
                        background:conf.dim, border:`1px solid ${conf.bord}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        flexShrink:0 }}>
                        <CatIcon size={12} color={conf.color}/>
                      </div>
                      <span style={lbl(11.5, T.textTert)}>{cat}</span>
                      <span style={{ fontSize:11, color:T.textHint, fontFamily:MONO }}>
                        {items.length} {items.length===1?"item":"items"}
                      </span>
                      <div style={{ flex:1, height:1, background:T.borderFaint }}/>
                    </div>

                    <div className="svc-catalog-grid" style={{ display:"grid",
                      gridTemplateColumns:"repeat(auto-fill,minmax(242px,1fr))",
                      gap:11 }}>
                      {items.map((item, i) => (
                        <ServiceCard key={item.id} item={item}
                          onEdit={canEdit ? (s: Service) => setEditing(s) : () => {}} 
                          superConf={conf} 
                          index={i}/>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ══ CORPORATE ACCOUNTS ══════════════════════════════ */}
          <div style={{ background:T.bgSurface,
            borderTop:`1px solid ${T.borderFaint}`,
            padding:"24px 32px" }}>

            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:18 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700,
                  color:T.textPrimary, letterSpacing:"-0.025em", fontFamily:FONT }}>
                  Corporate Accounts
                </div>
                <div style={{ fontSize:12.5, color:T.textTert, marginTop:3, fontFamily:FONT }}>
                  Contract-based pricing — managed by GM
                </div>
              </div>
              {canEdit && (
                <button className="btn-accent"
                  style={{ padding:"9px 18px", background:T.accent, border:"none",
                    borderRadius:9, color:"#fff", fontSize:13.5, fontWeight:600,
                    cursor:"pointer", display:"flex", alignItems:"center",
                    gap:7, fontFamily:FONT, boxShadow:`0 8px 22px -6px ${T.accentGlow}` }}>
                  <Plus size={14}/> Add Client
                </button>
              )}
            </div>

            <div className="svc-corp-grid" style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(288px,1fr))", gap:12 }}>
              {clients.map((client, i) => (
                <div key={client.id} className="corp-card"
                  style={{ background:T.bgRaised, border:`1px solid ${T.borderSoft}`,
                    borderRadius:13, padding:"18px 20px",
                    display:"flex", flexDirection:"column", gap:12,
                    animationDelay:`${Math.min(i,10)*30}ms` }}>

                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center" }}>
                    <div style={{ width:38, height:38, borderRadius:10,
                      background:`linear-gradient(135deg, ${T.accentDim}, transparent)`,
                      border:`1px solid ${T.accentBord}`,
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Building2 size={17} color={T.accent}/>
                    </div>
                    {canEdit ? (
                      <button className="status-pill"
                        onClick={()=>updateClient(client.id, {active: !client.active})}
                        style={{ padding:"4px 13px", borderRadius:100,
                          fontSize:11.5, fontWeight:600, border:"none",
                          cursor:"pointer", fontFamily:FONT,
                          background: client.active ? T.emeraldDim : "rgba(90,102,131,0.15)",
                          color: client.active ? T.emerald : T.textTert,
                          boxShadow: client.active ? `0 0 14px -4px ${T.emeraldGlow}` : "none" }}>
                        {client.active ? "● Active" : "○ Inactive"}
                      </button>
                    ) : (
                      <span style={{ padding:"4px 13px", borderRadius:100,
                        fontSize:11.5, fontWeight:600, 
                        background: client.active ? T.emeraldDim : "rgba(90,102,131,0.15)",
                        color: client.active ? T.emerald : T.textTert,
                        fontFamily:FONT }}>
                        {client.active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:T.textPrimary,
                      letterSpacing:"-0.02em", fontFamily:FONT }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize:12.5, color:T.textTert, marginTop:3, fontFamily:FONT }}>
                      {client.type} · {client.billing} billing
                    </div>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", gap:10,
                    paddingTop:11, borderTop:`1px solid ${T.borderFaint}` }}>
                    <span style={{ fontSize:12, color:T.textTert, flex:1, fontFamily:FONT }}>
                      Contract discount
                    </span>
                    {canEdit ? (
                      <select value={client.discount}
                        onChange={e=>updateClient(client.id, {discount: e.target.value})}
                        style={{ background:T.bgSurface, border:`1px solid ${T.borderSoft}`,
                          borderRadius:7, color:T.gold, fontSize:13.5, fontWeight:600,
                          fontFamily:MONO, padding:"5px 9px",
                          outline:"none", cursor:"pointer" }}>
                        <option value="-">—</option>
                        <option value="5%">5%</option>
                        <option value="10%">10%</option>
                        <option value="15%">15%</option>
                        <option value="20%">20%</option>
                        <option value="Negotiated">Negotiated</option>
                      </select>
                    ) : (
                      <span style={{ background:T.bgSurface, border:`1px solid ${T.borderSoft}`,
                        borderRadius:7, color:T.gold, fontSize:13.5, fontWeight:600,
                        fontFamily:MONO, padding:"5px 9px" }}>
                        {client.discount}
                      </span>
                    )}
                  </div>

                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", paddingTop:9,
                    borderTop:`1px dashed ${T.borderFaint}` }}>
                    <span style={lbl(10.5, T.textHint)}>Ref</span>
                    <span style={{ fontSize:12.5, color:T.accent,
                      fontFamily:MONO }}>{client.contractRef}</span>
                  </div>

                  {client.notes && (
                    <div style={{ fontSize:12, color:T.textHint, fontStyle:"italic",
                      paddingTop:8, borderTop:`1px dashed ${T.borderFaint}`, fontFamily:FONT }}>
                      {client.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </PermissionGuard>

      </div>
    </>
  );
};

export default Services;