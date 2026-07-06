import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, Plus, Edit2, Trash2, Archive, Building2, User, Check, X,
  ArrowUp, ArrowDown, ArrowUpDown, AlertTriangle, RefreshCw, Download,
  ChevronLeft, ChevronRight, Users, Star, Briefcase, Crown,
} from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";

// ─── CSS injected once ────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

.cl-shell *{box-sizing:border-box;margin:0;padding:0}
.cl-shell{display:flex;flex-direction:column;height:100vh;background:#07090e;color:#edf0f8;font-family:'Outfit',system-ui,sans-serif;overflow:hidden}

/* top bar */
.cl-top{display:flex;align-items:center;justify-content:space-between;padding:20px 28px 0;flex-shrink:0;animation:clDown .4s cubic-bezier(.4,0,.2,1) both}
.cl-h2{font-size:22px;font-weight:700;color:#edf0f8;letter-spacing:-.4px;margin-bottom:4px}
.cl-sub{font-size:13px;color:#556070;display:flex;align-items:center;gap:6px}
.cl-dsep{color:#2e3a4e}
.cl-acts{display:flex;align-items:center;gap:8px}
.cl-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:'Outfit',sans-serif;transition:all .18s}
.cl-btn.ghost{background:rgba(255,255,255,.04);color:#9aa3b5;border:1px solid rgba(255,255,255,.07);padding:8px 10px}
.cl-btn.ghost:hover{background:rgba(255,255,255,.08);color:#edf0f8}
.cl-btn.primary{background:#34d399;color:#03261a;box-shadow:0 0 18px rgba(52,211,153,.25)}
.cl-btn.primary:hover{filter:brightness(1.08);transform:translateY(-1px)}
.cl-spin{animation:clSpin .7s linear infinite}

/* kpi row */
.cl-kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:18px 28px 0;flex-shrink:0;animation:clDown .4s .04s cubic-bezier(.4,0,.2,1) both}
.cl-kpi{position:relative;background:#0f1320;border:1px solid rgba(255,255,255,.05);border-radius:16px;padding:16px 18px;overflow:hidden;transition:transform .22s,box-shadow .22s,border-color .22s;cursor:default;animation:clUp .5s cubic-bezier(.4,0,.2,1) both}
.cl-kpi:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(0,0,0,.4);border-color:rgba(255,255,255,.09)}
.cl-kpi:hover .cl-kpi-glow{opacity:.13;transform:scale(1.1)}
.cl-kpi-glow{position:absolute;top:-40px;right:-40px;width:120px;height:120px;border-radius:50%;opacity:.06;filter:blur(28px);transition:opacity .3s,transform .3s}
.cl-kpi-ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
.cl-kpi-lbl{font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#3a4460;margin-bottom:5px}
.cl-kpi-val{font-size:26px;font-weight:800;color:#edf0f8;letter-spacing:-.04em;line-height:1;margin-bottom:4px}
.cl-kpi-sub{font-size:11px;color:#2e3a4e}
.cl-kpi-bar{position:absolute;bottom:0;left:0;right:0;height:2px;background:rgba(255,255,255,.03)}
.cl-kpi-fill{height:100%;width:0;opacity:.5;animation:clBarGrow 1.2s cubic-bezier(.4,0,.2,1) .3s forwards}

/* filter bar */
.cl-filters{display:flex;align-items:center;gap:10px;padding:14px 28px;border-bottom:1px solid rgba(255,255,255,.05);flex-shrink:0;flex-wrap:wrap;animation:clDown .4s .08s cubic-bezier(.4,0,.2,1) both}
.cl-srch{position:relative;display:flex;align-items:center;flex:1;min-width:180px;max-width:260px}
.cl-srch-ico{position:absolute;left:11px;color:#3a4460;pointer-events:none}
.cl-srch-inp{width:100%;padding:8px 36px 8px 34px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;color:#edf0f8;font-size:13px;font-family:'Outfit',sans-serif;outline:none;transition:border-color .18s,background .18s}
.cl-srch-inp::placeholder{color:#3a4460}
.cl-srch-inp:focus{border-color:rgba(52,211,153,.4);background:rgba(52,211,153,.04)}
.cl-srch-x{position:absolute;right:10px;background:none;border:none;cursor:pointer;color:#3a4460;display:flex;align-items:center;transition:color .15s}
.cl-srch-x:hover{color:#9aa3b5}
.cl-fp{padding:7px 11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;color:#9aa3b5;font-size:13px;font-family:'Outfit',sans-serif;outline:none;cursor:pointer;transition:all .18s;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23556070'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px}
.cl-fp:focus,.cl-fp:hover{border-color:rgba(52,211,153,.35);color:#edf0f8}
.cl-fp option{background:#0c0f18;color:#edf0f8}
.cl-pill{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.07);background:transparent;color:#556070;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .18s;white-space:nowrap}
.cl-pill:hover{border-color:rgba(255,255,255,.12);color:#9aa3b5}
.cl-pill.on{background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.3);color:#34d399}
.cl-pill.arch.on{background:rgba(108,114,243,.1);border-color:rgba(108,114,243,.3);color:#6c72f3}
.cl-clr{display:inline-flex;align-items:center;gap:5px;padding:7px 11px;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);border-radius:9px;color:#f87171;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .18s}
.cl-clr:hover{background:rgba(248,113,113,.18)}

/* tier pills in toolbar */
.tier-pills{display:flex;gap:5px;flex-wrap:wrap}
.tier-p{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;border:1px solid rgba(255,255,255,.07);background:transparent;color:#556070;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .18s;white-space:nowrap}
.tier-p:hover{color:#9aa3b5;border-color:rgba(255,255,255,.12)}
.tier-p.on{border-color:currentColor;opacity:1}

/* bulk bar */
.cl-bulk{display:flex;align-items:center;gap:10px;padding:10px 28px;background:rgba(52,211,153,.06);border-bottom:1px solid rgba(52,211,153,.15);font-size:13px;font-weight:500;color:#9aa3b5;animation:clSlideIn .2s ease;flex-shrink:0}
.cl-bulk-b{padding:6px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#edf0f8;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .18s;display:inline-flex;align-items:center;gap:6px}
.cl-bulk-b:hover{background:rgba(255,255,255,.1)}
.cl-bulk-b.red{color:#f87171;border-color:rgba(248,113,113,.25);background:rgba(248,113,113,.08)}
.cl-bulk-b.red:hover{background:rgba(248,113,113,.15)}
.cl-bulk-x{margin-left:auto;width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:#556070;border-radius:6px;transition:all .15s}
.cl-bulk-x:hover{background:rgba(255,255,255,.06);color:#9aa3b5}

/* body / table */
.cl-body{flex:1;display:flex;flex-direction:column;overflow:hidden}
.cl-tbl-wrap{flex:1;overflow:auto}
.cl-tbl-wrap::-webkit-scrollbar{width:5px;height:5px}
.cl-tbl-wrap::-webkit-scrollbar-track{background:transparent}
.cl-tbl-wrap::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:99px}
.cl-tbl{width:100%;min-width:780px;border-collapse:collapse}
.cl-tbl thead tr{position:sticky;top:0;z-index:10}
.cl-tbl th{padding:11px 16px;background:#0c0f18;text-align:left;font-size:11px;font-weight:700;color:#3a4460;text-transform:uppercase;letter-spacing:.7px;border-bottom:1px solid rgba(255,255,255,.05);white-space:nowrap;user-select:none}
.cl-th-sort{display:flex;align-items:center;gap:6px;cursor:pointer;transition:color .15s}
.cl-th-sort:hover{color:#9aa3b5}
.cl-tbl td{padding:13px 16px;font-size:13.5px;color:#c8d0e0;border-bottom:1px solid rgba(255,255,255,.035);vertical-align:middle}
.cl-row{cursor:pointer;animation:clRowIn .3s cubic-bezier(.4,0,.2,1) both;transition:background .15s}
.cl-row:hover td{background:rgba(255,255,255,.022)}
.cl-row.sel td{background:rgba(52,211,153,.05)}
.cl-row.archived{opacity:.5}
.cl-row:hover .cl-row-acts{opacity:1}

/* client cell */
.cl-cell{display:flex;align-items:center;gap:10px}
.cl-av{width:34px;height:34px;min-width:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cl-nm{font-size:13.5px;font-weight:600;color:#edf0f8}
.cl-arch-tag{font-size:10px;color:#3a4460;font-weight:500;background:rgba(255,255,255,.05);padding:1px 6px;border-radius:4px;margin-left:4px}

/* tier badge */
.cl-tier{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:600;white-space:nowrap}

/* type badge */
.cl-type{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:500;color:#9aa3b5}

/* row actions */
.cl-row-acts{display:flex;gap:6px;opacity:0;transition:opacity .18s}
.cl-ra{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#9aa3b5;cursor:pointer;transition:all .18s}
.cl-ra:hover{background:rgba(255,255,255,.1);color:#edf0f8}
.cl-ra.red{border-color:rgba(248,113,113,.2);background:rgba(248,113,113,.08);color:#f87171}
.cl-ra.red:hover{background:rgba(248,113,113,.18)}

/* checkbox */
.cl-chk{width:15px;height:15px;border-radius:4px;cursor:pointer;accent-color:#34d399}

/* empty */
.cl-empty{padding:64px!important;text-align:center;color:#2e3a4e;font-size:14px}

/* pagination */
.cl-pag{display:flex;align-items:center;justify-content:space-between;padding:11px 20px;border-top:1px solid rgba(255,255,255,.05);background:#0c0f18;flex-shrink:0}
.cl-pag-info{font-size:12.5px;color:#3a4460}
.cl-pag-r{display:flex;align-items:center;gap:6px}
.cl-pag-pp{padding:5px 9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;color:#9aa3b5;font-size:12px;font-family:'Outfit',sans-serif;outline:none;cursor:pointer}
.cl-pag-b{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;color:#9aa3b5;cursor:pointer;transition:all .18s}
.cl-pag-b:hover:not(:disabled){background:rgba(255,255,255,.08);color:#edf0f8}
.cl-pag-b:disabled{opacity:.3;cursor:not-allowed}
.cl-pag-n{min-width:28px;height:28px;padding:0 5px;display:flex;align-items:center;justify-content:center;background:transparent;border:1px solid transparent;border-radius:7px;color:#556070;font-size:12.5px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .18s}
.cl-pag-n:hover{color:#edf0f8;border-color:rgba(255,255,255,.08)}
.cl-pag-n.on{background:rgba(52,211,153,.15);color:#34d399;border-color:rgba(52,211,153,.3)}

/* ── MODAL OVERLAY ── */
.cl-mo{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .25s}
.cl-mo.on{opacity:1;pointer-events:auto}
.cl-mc{background:#0f1320;border:1px solid rgba(255,255,255,.1);border-radius:20px;width:480px;max-width:92vw;overflow:hidden;transform:scale(.94) translateY(12px);transition:transform .3s cubic-bezier(.4,0,.2,1);box-shadow:0 24px 80px rgba(0,0,0,.7)}
.cl-mo.on .cl-mc{transform:scale(1) translateY(0)}
.cl-m-head{display:flex;align-items:flex-start;justify-content:space-between;padding:22px 24px;border-bottom:1px solid rgba(255,255,255,.06)}
.cl-m-title{font-size:17px;font-weight:700;color:#edf0f8;margin-bottom:3px}
.cl-m-sub{font-size:12.5px;color:#3a4460}
.cl-m-cl{width:30px;height:30px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#556070;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;flex-shrink:0}
.cl-m-cl:hover{background:rgba(255,255,255,.06);color:#edf0f8}
.cl-m-body{padding:22px 24px;display:flex;flex-direction:column;gap:16px}
.cl-m-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.cl-m-fg{display:flex;flex-direction:column;gap:6px}
.cl-m-lbl{font-size:11px;font-weight:700;color:#3a4460;text-transform:uppercase;letter-spacing:.08em}
.cl-m-inp,.cl-m-sel{padding:10px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;color:#edf0f8;font-size:13.5px;font-family:'Outfit',sans-serif;outline:none;transition:border-color .18s,background .18s;width:100%}
.cl-m-inp::placeholder{color:#2e3a4e}
.cl-m-inp:focus,.cl-m-sel:focus{border-color:rgba(52,211,153,.45);background:rgba(52,211,153,.04)}
.cl-m-inp.err{border-color:rgba(248,113,113,.5)}
.cl-m-err{font-size:11.5px;color:#f87171}
.cl-m-sel option{background:#0c0f18;color:#edf0f8}
.cl-m-foot{display:flex;gap:10px;padding:16px 24px;border-top:1px solid rgba(255,255,255,.06)}
.cl-mf-s{flex:1;padding:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;color:#9aa3b5;font-size:13px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .18s}
.cl-mf-s:hover{background:rgba(255,255,255,.08);color:#edf0f8}
.cl-mf-p{flex:2;padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:8px;background:#34d399;border:none;border-radius:9px;color:#03261a;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;box-shadow:0 0 16px rgba(52,211,153,.25);transition:all .18s}
.cl-mf-p:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}
.cl-mf-p:disabled{opacity:.5;cursor:not-allowed;transform:none}

/* ── CONFIRM MODAL ── */
.cl-conf-ico{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.cl-conf-title{font-size:17px;font-weight:700;color:#edf0f8;text-align:center;margin-bottom:8px}
.cl-conf-desc{font-size:13px;color:#556070;text-align:center;line-height:1.6}
.cl-conf-warn{margin-top:10px;padding:8px 14px;background:rgba(248,113,113,.1);border-radius:8px;font-size:12px;color:#f87171;display:flex;align-items:center;gap:6px;justify-content:center}

/* ── TOAST ── */
.cl-toast{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;gap:12px;padding:12px 18px;border-radius:12px;font-size:13.5px;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.4);animation:clSlideIn .3s cubic-bezier(.4,0,.2,1);border:1px solid;white-space:nowrap}
.cl-toast.ok{background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.3);color:#34d399}
.cl-toast.err{background:rgba(248,113,113,.12);border-color:rgba(248,113,113,.3);color:#f87171}
.cl-toast-x{background:none;border:none;cursor:pointer;color:inherit;opacity:.6;display:flex;align-items:center;transition:opacity .15s}
.cl-toast-x:hover{opacity:1}

/* ── KEYFRAMES ── */
@keyframes clDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@keyframes clUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes clRowIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
@keyframes clSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes clSpin{to{transform:rotate(360deg)}}
@keyframes clBarGrow{from{width:0}to{width:75%}}
@keyframes clCount{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* ── RESPONSIVE ── */
@media(max-width:1000px){.cl-kpi-row{grid-template-columns:repeat(2,1fr)}}
@media(max-width:700px){.cl-top{padding:16px 18px 0}.cl-filters{padding:12px 18px}.cl-kpi-row{padding:14px 18px 0}.cl-h2{font-size:18px}.cl-m-row{grid-template-columns:1fr}}
button:focus-visible{outline:2px solid #34d399;outline-offset:2px}


/* ── RESPONSIVE ── */
@media(max-width:1000px){.cl-kpi-row{grid-template-columns:repeat(2,1fr)}}
@media(max-width:700px){
  .cl-top{padding:16px 18px 0}
  .cl-filters{padding:12px 18px}
  .cl-kpi-row{padding:14px 18px 0}
  .cl-h2{font-size:18px}
  .cl-m-row{grid-template-columns:1fr}
  
  /* ✅ MOBILE TABLE TWEAKS (added only) */
  .cl-tbl thead { display: none; }
  .cl-row { 
    display: block; 
    padding: 12px 16px !important; 
    border-bottom: 1px solid rgba(255,255,255,.035) !important;
  }
  .cl-row td { 
    display: block; 
    padding: 6px 0 !important; 
    border: none !important; 
    text-align: left !important;
  }
  .cl-cell { margin-bottom: 8px; }
  .cl-nm { font-size: 14px !important; }
  .cl-tier, .cl-type { margin: 4px 0; }
  .cl-row-acts { 
    opacity: 1 !important; 
    justify-content: flex-end; 
    margin-top: 8px;
  }
  .cl-pag { flex-direction: column; align-items: flex-start !important; gap: 12px; }
  .cl-pag-r { width: 100%; justify-content: space-between; }
}

@media(max-width:480px){
  .cl-top{padding:12px 16px 0}
  .cl-filters{padding:10px 16px; flex-direction: column; align-items: stretch !important; gap: 10px !important;}
  .cl-srch{max-width:100% !important; width:100% !important;}
  .tier-pills{justify-content: center; flex-wrap: wrap;}
  .cl-kpi-row{grid-template-columns:1fr !important;}
  
  /* Ensure inputs are touch-friendly */
  .cl-m-inp, .cl-m-sel { font-size: 16px !important; } /* Prevents iOS zoom */
  button, [role="button"] { min-height: 44px !important; }
}

button:focus-visible{outline:2px solid #34d399;outline-offset:2px}
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Client {
  id: string;
  name: string;
  type: "Individual" | "Corporate";
  tier: "Standard" | "Bronze" | "Silver" | "Gold" | "VIP" | "Corporate";
  phone: string;
  notes?: string;
  active?: boolean;
}

interface FormState {
  name: string; type: string; tier: string; phone: string; notes: string;
}

type SortKey = "name" | "type" | "tier" | "phone";
type SortDir = "asc" | "desc";

// ─── Constants ────────────────────────────────────────────────────────────────
const TIER_META: Record<string, { color: string; bg: string; border: string; icon: JSX.Element; label: string }> = {
  Standard:  { color: "#556070", bg: "rgba(85,96,112,.12)",   border: "rgba(85,96,112,.2)",   icon: <User size={10} />,   label: "Standard"   },
  Bronze:    { color: "#cd8a44", bg: "rgba(205,138,68,.12)",  border: "rgba(205,138,68,.25)", icon: <Star size={10} />,   label: "Bronze"     },
  Silver:    { color: "#94a3b8", bg: "rgba(148,163,184,.12)", border: "rgba(148,163,184,.25)",icon: <Star size={10} />,   label: "Silver"     },
  Gold:      { color: "#dba96a", bg: "rgba(219,169,106,.14)", border: "rgba(219,169,106,.3)", icon: <Crown size={10} />,  label: "Gold"       },
  VIP:       { color: "#a78bfa", bg: "rgba(167,139,250,.13)", border: "rgba(167,139,250,.3)", icon: <Crown size={10} />,  label: "VIP"        },
  Corporate: { color: "#6c72f3", bg: "rgba(108,114,243,.12)", border: "rgba(108,114,243,.28)",icon: <Briefcase size={10}/>,label: "Corporate" },
};

const TIERS = ["All", "Standard", "Bronze", "Silver", "Gold", "VIP", "Corporate"];

const TIER_PILL_COLORS: Record<string, { active: string }> = {
  All:       { active: "#34d399" },
  Standard:  { active: "#556070" },
  Bronze:    { active: "#cd8a44" },
  Silver:    { active: "#94a3b8" },
  Gold:      { active: "#dba96a" },
  VIP:       { active: "#a78bfa" },
  Corporate: { active: "#6c72f3" },
};

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target: number, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start: number | null = null;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 900, 1);
        setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step); else setVal(target);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, accent, sub, delay = 0 }: {
  label: string; value: number; icon: JSX.Element;
  accent: string; sub?: string; delay?: number;
}) {
  const counted = useCountUp(value, delay);
  return (
    <div className="cl-kpi" style={{ animationDelay: `${delay}ms` }}>
      <div className="cl-kpi-glow" style={{ background: accent }} />
      <div className="cl-kpi-ico" style={{ background: accent + "18", color: accent }}>{icon}</div>
      <div className="cl-kpi-lbl">{label}</div>
      <div className="cl-kpi-val">{counted}</div>
      {sub && <div className="cl-kpi-sub">{sub}</div>}
      <div className="cl-kpi-bar"><div className="cl-kpi-fill" style={{ background: accent }} /></div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, type }: { name: string; type: string }) {
  const isCorp = type === "Corporate";
  const hue = (name.charCodeAt(0) * 37 + (name.charCodeAt(1) || 0) * 11) % 360;
  return (
    <div className="cl-av" style={{
      background: isCorp ? "rgba(108,114,243,.15)" : `hsl(${hue},35%,18%)`,
      color: isCorp ? "#6c72f3" : `hsl(${hue},55%,65%)`,
    }}>
      {isCorp ? <Building2 size={15} /> : <span style={{ fontSize: 13, fontWeight: 700 }}>{name[0]?.toUpperCase()}</span>}
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ col, sortKey, dir }: { col: string; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={11} style={{ opacity: .35 }} />;
  return dir === "asc" ? <ArrowUp size={11} color="#34d399" /> : <ArrowDown size={11} color="#34d399" />;
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: string }) {
  const m = TIER_META[tier] ?? TIER_META.Standard;
  return (
    <span className="cl-tier" style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
      {m.icon}{m.label}
    </span>
  );
}

// ─── Client Form Modal ────────────────────────────────────────────────────────
function ClientModal({ client, onClose, onSave, saving }: {
  client: Partial<Client> | null; onClose: () => void;
  onSave: (f: FormState) => void; saving: boolean;
}) {
  const isEdit = !!(client as Client)?.id;
  const [form, setForm] = useState<FormState>({
    name:  client?.name  ?? "",
    type:  client?.type  ?? "Individual",
    tier:  client?.tier  ?? "Standard",
    phone: client?.phone ?? "",
    notes: client?.notes ?? "",
  });
  const [errs, setErrs] = useState<Partial<FormState>>({});
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => firstRef.current?.focus(), 120); }, []);

  const set = (k: keyof FormState, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errs[k]) setErrs(e => ({ ...e, [k]: undefined }));
  };

  const submit = () => {
    const e: Partial<FormState> = {};
    if (!form.name.trim())  e.name  = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (Object.keys(e).length) { setErrs(e); return; }
    onSave(form);
  };

  return (
    <div className="cl-mo on" onClick={onClose}>
      <div className="cl-mc" onClick={e => e.stopPropagation()}>
        <div className="cl-m-head">
          <div>
            <div className="cl-m-title">{isEdit ? "Edit Client" : "Add New Client"}</div>
            <div className="cl-m-sub">{isEdit ? "Update client details" : "They'll be added as active immediately"}</div>
          </div>
          <button className="cl-m-cl" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="cl-m-body">
          <div className="cl-m-fg">
            <label className="cl-m-lbl">Client Name</label>
            <input ref={firstRef} className={`cl-m-inp${errs.name ? " err" : ""}`}
              placeholder="e.g. St. Martins Hospital"
              value={form.name} onChange={e => set("name", e.target.value)} />
            {errs.name && <span className="cl-m-err">{errs.name}</span>}
          </div>
          <div className="cl-m-row">
            <div className="cl-m-fg">
              <label className="cl-m-lbl">Type</label>
              <select className="cl-m-sel" value={form.type} onChange={e => set("type", e.target.value)}>
                <option>Individual</option>
                <option>Corporate</option>
              </select>
            </div>
            <div className="cl-m-fg">
              <label className="cl-m-lbl">Tier</label>
              <select className="cl-m-sel" value={form.tier} onChange={e => set("tier", e.target.value)}>
                {["Standard","Bronze","Silver","Gold","VIP","Corporate"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="cl-m-fg">
            <label className="cl-m-lbl">Phone</label>
            <input className={`cl-m-inp${errs.phone ? " err" : ""}`}
              placeholder="+233 XX XXX XXXX"
              value={form.phone} onChange={e => set("phone", e.target.value)} />
            {errs.phone && <span className="cl-m-err">{errs.phone}</span>}
          </div>
          <div className="cl-m-fg">
            <label className="cl-m-lbl">Notes <span style={{ color: "#2e3a4e", fontWeight: 400 }}>(optional)</span></label>
            <input className="cl-m-inp"
              placeholder="Any important notes..."
              value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="cl-m-foot">
          <button className="cl-mf-s" onClick={onClose}>Cancel</button>
          <button className="cl-mf-p" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : <><Check size={14} />{isEdit ? "Save Changes" : "Add Client"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ count, type, onClose, onConfirm }: {
  count: number; type: "archive" | "delete";
  onClose: () => void; onConfirm: () => void;
}) {
  const isDel = type === "delete";
  return (
    <div className="cl-mo on" onClick={onClose}>
      <div className="cl-mc" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ padding: "28px 24px 0" }}>
          <div className="cl-conf-ico" style={{ background: isDel ? "rgba(248,113,113,.1)" : "rgba(108,114,243,.1)" }}>
            {isDel ? <Trash2 size={24} color="#f87171" /> : <Archive size={24} color="#6c72f3" />}
          </div>
          <div className="cl-conf-title">
            {isDel ? `Delete ${count} client${count > 1 ? "s" : ""}?` : `Archive ${count} client${count > 1 ? "s" : ""}?`}
          </div>
          <div className="cl-conf-desc">
            {isDel
              ? "This will permanently remove the client and all their order history. This cannot be undone."
              : "The client will be hidden from the active list but can be restored later. Order history is preserved."}
          </div>
          {isDel && (
            <div className="cl-conf-warn">
              <AlertTriangle size={13} /> Requires permission to delete
            </div>
          )}
        </div>
        <div className="cl-m-foot" style={{ marginTop: 22 }}>
          <button className="cl-mf-s" onClick={onClose}>Cancel</button>
          <button
            style={{ flex: 2, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: isDel ? "#f87171" : "#6c72f3", border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all .18s" }}
            onClick={onConfirm}>
            {isDel ? <><Trash2 size={14} /> Delete Permanently</> : <><Archive size={14} /> Archive</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`cl-toast ${type === "success" ? "ok" : "err"}`}>
      {type === "success" ? <Check size={15} /> : <AlertTriangle size={15} />}
      {msg}
      <button className="cl-toast-x" onClick={onClose}><X size={13} /></button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export const Clients = () => {
  const [clients, setClients]           = useState<Client[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [search, setSearch]             = useState("");
  const [tierFilter, setTierFilter]     = useState("All");
  const [typeFilter, setTypeFilter]     = useState("All");
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [editing, setEditing]           = useState<Partial<Client> | null>(null);
  const [saving, setSaving]             = useState(false);
  const [confirm, setConfirm]           = useState<{ ids: string[]; type: "archive" | "delete" } | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sort, setSort]                 = useState<{ key: SortKey; dir: SortDir }>({ key: "type", dir: "desc" });
  const [pg, setPg]                     = useState(1);
  const [pp, setPp]                     = useState(10);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setEditing(null); setConfirm(null); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setEditing({}); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchClients = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      let q = supabase.from("clients").select("*").order("name");
      if (!showArchived) q = q.neq("active", false);
      const { data, error } = await q;
      if (error) throw error;
      if (data) setClients(data);
    } catch {
      // keep whatever is already in state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showArchived]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (form: FormState) => {
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), type: form.type, tier: form.tier, phone: form.phone.trim(), notes: form.notes, active: true };
      if ((editing as Client)?.id) {
        await supabase.from("clients").update(payload).eq("id", (editing as Client).id);
        setToast({ msg: "Client updated", type: "success" });
      } else {
        await supabase.from("clients").insert([payload]);
        setToast({ msg: "Client added", type: "success" });
      }
      setEditing(null);
      fetchClients(true);
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Confirm action ────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!confirm) return;
    const { ids, type } = confirm;
    setConfirm(null);
    try {
      if (type === "archive") {
        await supabase.from("clients").update({ active: false }).in("id", ids);
        setToast({ msg: `${ids.length} client${ids.length > 1 ? "s" : ""} archived`, type: "success" });
      } else {
        await supabase.from("clients").delete().in("id", ids);
        setToast({ msg: `${ids.length} client${ids.length > 1 ? "s" : ""} deleted`, type: "success" });
      }
      setSelected(new Set());
      fetchClients(true);
    } catch {
      setToast({ msg: "Action failed", type: "error" });
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return [...clients].filter(c => {
      if (tierFilter !== "All" && c.tier !== tierFilter) return false;
      if (typeFilter !== "All" && c.type !== typeFilter) return false;
      if (search) { const lq = search.toLowerCase(); if (!c.name.toLowerCase().includes(lq) && !c.phone?.includes(lq)) return false; }
      return true;
    }).sort((a, b) => {
      const mul = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "type") {
        if (a.type === "Corporate" && b.type !== "Corporate") return -1 * mul;
        if (a.type !== "Corporate" && b.type === "Corporate") return 1 * mul;
        return a.name.localeCompare(b.name) * mul;
      }
      const av = a[sort.key] ?? ""; const bv = b[sort.key] ?? "";
      return av < bv ? -mul : av > bv ? mul : 0;
    });
  }, [clients, tierFilter, typeFilter, search, sort]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / pp));
  const paged    = filtered.slice((pg - 1) * pp, pg * pp);

  const stats = useMemo(() => ({
    total:     clients.length,
    corporate: clients.filter(c => c.type === "Corporate").length,
    gold:      clients.filter(c => c.tier === "Gold" || c.tier === "VIP").length,
    active:    clients.filter(c => c.active !== false).length,
  }), [clients]);

  const toggleSort = (key: SortKey) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const toggleSel = (id: string) => {
    const ns = new Set(selected);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelected(ns);
  };
  const toggleAll = () =>
    setSelected(selected.size === filtered.length && filtered.length > 0 ? new Set() : new Set(filtered.map(c => c.id)));

  const hasFilters = tierFilter !== "All" || typeFilter !== "All" || search;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="cl-shell">
      <style>{CSS}</style>

      {/* Modals */}
      {editing  !== null && <ClientModal client={editing}  onClose={() => setEditing(null)} onSave={handleSave} saving={saving} />}
      {confirm  !== null && <ConfirmModal count={confirm.ids.length} type={confirm.type} onClose={() => setConfirm(null)} onConfirm={handleConfirm} />}
      {toast    !== null && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top bar */}
      <div className="cl-top">
        <div>
          <h2 className="cl-h2">Clients</h2>
          <p className="cl-sub">
            <span>{stats.total} total</span>
            <span className="cl-dsep">·</span>
            <span style={{ color: "#6c72f3" }}>{stats.corporate} corporate</span>
            <span className="cl-dsep">·</span>
            <span style={{ color: "#dba96a" }}>{stats.gold} gold / VIP</span>
          </p>
        </div>
        <div className="cl-acts">
          <button className="cl-btn ghost" title="Refresh" onClick={() => fetchClients(true)}>
            <RefreshCw size={14} className={refreshing ? "cl-spin" : ""} />
          </button>
          <button className="cl-btn ghost" title="Export"><Download size={14} /></button>
          <button className="cl-btn primary" onClick={() => setEditing({})}>
            <Plus size={14} /> Add Client
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="cl-kpi-row">
        <KpiCard label="Total Clients"   value={stats.total}     icon={<Users size={18} />}     accent="#6c72f3" sub="All types"    delay={0}   />
        <KpiCard label="Corporate"       value={stats.corporate} icon={<Building2 size={18} />} accent="#22d3ee" sub="B2B clients"  delay={80}  />
        <KpiCard label="Gold / VIP"      value={stats.gold}      icon={<Crown size={18} />}     accent="#dba96a" sub="Top tier"     delay={160} />
        <KpiCard label="Active"          value={stats.active}    icon={<Check size={18} />}     accent="#34d399" sub="Not archived" delay={240} />
      </div>

      {/* Filter bar */}
      <div className="cl-filters">
        {/* Search */}
        <div className="cl-srch">
          <Search size={13} className="cl-srch-ico" />
          <input ref={searchRef} className="cl-srch-inp"
            placeholder="Search name or phone..." value={search}
            onChange={e => { setSearch(e.target.value); setPg(1); }} />
          {search && <button className="cl-srch-x" onClick={() => setSearch("")}><X size={11} /></button>}
        </div>

        {/* Tier pills */}
        <div className="tier-pills">
          {TIERS.map(t => {
            const on = tierFilter === t;
            const tc = TIER_PILL_COLORS[t]?.active ?? "#556070";
            return (
              <button key={t} className="tier-p"
                style={{ color: on ? tc : undefined, borderColor: on ? tc + "60" : undefined, background: on ? tc + "12" : undefined }}
                onClick={() => { setTierFilter(t); setPg(1); }}>
                {t}
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <select className="cl-fp" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPg(1); }}>
          <option value="All">All Types</option>
          <option value="Corporate">Corporate</option>
          <option value="Individual">Individual</option>
        </select>

        {/* Show archived */}
        <button className={`cl-pill arch ${showArchived ? "on" : ""}`} onClick={() => setShowArchived(v => !v)}>
          <Archive size={12} /> {showArchived ? "Hide Archived" : "Archived"}
        </button>

        {hasFilters && (
          <button className="cl-clr" onClick={() => { setTierFilter("All"); setTypeFilter("All"); setSearch(""); }}>
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="cl-bulk">
          <span>{selected.size} selected</span>
          <button className="cl-bulk-b" onClick={() => setConfirm({ ids: Array.from(selected), type: "archive" })}>
            <Archive size={13} /> Archive
          </button>
          <button className="cl-bulk-b red" onClick={() => setConfirm({ ids: Array.from(selected), type: "delete" })}>
            <Trash2 size={13} /> Delete
          </button>
          <button className="cl-bulk-x" onClick={() => setSelected(new Set())}><X size={13} /></button>
        </div>
      )}

      {/* Body */}
      <div className="cl-body">
        <div className="cl-tbl-wrap">
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#3a4460", fontSize: 14 }}>
              <RefreshCw size={18} className="cl-spin" style={{ marginRight: 10 }} /> Loading clients...
            </div>
          ) : (
            <table className="cl-tbl">
              <thead>
                <tr>
                  <th style={{ width: 44, paddingLeft: 20 }}>
                    <input type="checkbox" className="cl-chk"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll} />
                  </th>
                  <th><div className="cl-th-sort" onClick={() => toggleSort("name")}>Client <SortIcon col="name" sortKey={sort.key} dir={sort.dir} /></div></th>
                  <th><div className="cl-th-sort" onClick={() => toggleSort("type")}>Type <SortIcon col="type" sortKey={sort.key} dir={sort.dir} /></div></th>
                  <th><div className="cl-th-sort" onClick={() => toggleSort("tier")}>Tier <SortIcon col="tier" sortKey={sort.key} dir={sort.dir} /></div></th>
                  <th><div className="cl-th-sort" onClick={() => toggleSort("phone")}>Phone <SortIcon col="phone" sortKey={sort.key} dir={sort.dir} /></div></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={6} className="cl-empty">No clients match your filters</td></tr>
                ) : paged.map((c, i) => (
                  <tr key={c.id}
                    className={`cl-row${selected.has(c.id) ? " sel" : ""}${c.active === false ? " archived" : ""}`}
                    style={{ animationDelay: `${i * 22}ms` }}>
                    <td style={{ paddingLeft: 20, width: 44 }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="cl-chk" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} />
                    </td>
                    <td>
                      <div className="cl-cell">
                        <Avatar name={c.name} type={c.type} />
                        <div>
                          <div className="cl-nm">{c.name}</div>
                          {c.active === false && <span className="cl-arch-tag">Archived</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cl-type">
                        {c.type === "Corporate" ? <Building2 size={13} color="#6c72f3" /> : <User size={13} color="#556070" />}
                        {c.type}
                      </div>
                    </td>
                    <td><TierBadge tier={c.tier} /></td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "#9aa3b5" }}>{c.phone}</td>
                    <td>
                      <div className="cl-row-acts">
                        <button className="cl-ra" title="Edit"    onClick={() => setEditing(c)}><Edit2 size={13} /></button>
                        <button className="cl-ra" title="Archive" onClick={() => setConfirm({ ids: [c.id], type: "archive" })}><Archive size={13} /></button>
                        <button className="cl-ra red" title="Delete" onClick={() => setConfirm({ ids: [c.id], type: "delete" })}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="cl-pag">
          <span className="cl-pag-info">
            {filtered.length === 0 ? "No results"
              : `${(pg - 1) * pp + 1}–${Math.min(pg * pp, filtered.length)} of ${filtered.length} clients`}
          </span>
          <div className="cl-pag-r">
            <select className="cl-pag-pp" value={pp} onChange={e => { setPp(Number(e.target.value)); setPg(1); }}>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <button className="cl-pag-b" disabled={pg === 1} onClick={() => setPg(p => p - 1)}><ChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(totalPgs, 5) }, (_, i) => {
              const n = totalPgs <= 5 ? i + 1 : pg <= 3 ? i + 1 : pg >= totalPgs - 2 ? totalPgs - 4 + i : pg - 2 + i;
              return <button key={n} className={`cl-pag-n${pg === n ? " on" : ""}`} onClick={() => setPg(n)}>{n}</button>;
            })}
            <button className="cl-pag-b" disabled={pg === totalPgs} onClick={() => setPg(p => p + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};