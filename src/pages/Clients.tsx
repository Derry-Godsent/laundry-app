import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Search, Plus, Edit2, Trash2, Archive, Building2, User, Check, X,
  ArrowUp, ArrowDown, ArrowUpDown, AlertTriangle, RefreshCw, Download,
  ChevronLeft, ChevronRight, Users, Briefcase, Crown, Shield,
  Medal, Trophy,
} from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { usePermission } from "../hooks/usePermission";

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  const clean = digits.startsWith('233') ? digits.slice(3) : digits;
  const limited = clean.slice(0, 10);
  if (limited.length <= 2) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
  return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5)}`;
}

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const CSS = `
/* One typeface for the whole app, loaded once in index.html. */

.cl-shell *{box-sizing:border-box;margin:0;padding:0}
/* Fills the shell frame: .main-body owns the page scroll, .cl-tbl-wrap owns the
   list scroll. Never 100vh inside the shell; that is what cut the list off. */
.cl-shell{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--ink-base);color:var(--text-1);font-family:var(--font-ui);overflow:hidden}

.cl-top{display:flex;align-items:center;justify-content:space-between;padding:20px 28px 0;flex-shrink:0;animation:clDown .4s cubic-bezier(.4,0,.2,1) both}
.cl-h2{font-size:22px;font-weight:700;color:var(--text-1);letter-spacing:-.4px;margin-bottom:4px}
.cl-sub{font-size:13px;color:var(--text-4);display:flex;align-items:center;gap:6px}
.cl-dsep{color:var(--text-4)}
.cl-acts{display:flex;align-items:center;gap:8px}
.cl-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:var(--font-ui);transition:all .18s}
.cl-btn.ghost{background:rgba(255,255,255,.04);color:var(--text-2);border:1px solid rgba(255,255,255,.07);padding:8px 10px}
.cl-btn.ghost:hover{background:rgba(255,255,255,.08);color:var(--text-1)}
.cl-btn.primary{background:var(--ok-500);color:var(--on-ok)}
.cl-btn.primary:hover{filter:brightness(1.08);transform:translateY(-1px)}
.cl-spin{animation:clSpin .7s linear infinite}

.cl-view-banner{display:flex;align-items:center;gap:10px;padding:10px 28px;background:var(--brand-soft);border-bottom:1px solid var(--brand-soft);font-size:13px;font-weight:500;color:var(--text-2);flex-shrink:0}

.cl-kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:18px 28px 0;flex-shrink:0;animation:clDown .4s .04s cubic-bezier(.4,0,.2,1) both}
.cl-kpi{position:relative;background:color-mix(in srgb,var(--kpi-accent,var(--brand-500)) 6%,var(--ink-card));border:1px solid color-mix(in srgb,var(--kpi-accent,var(--brand-500)) 18%,var(--line-soft));border-radius:16px;padding:16px 18px;overflow:hidden;transition:border-color .22s;cursor:default;animation:clUp .5s cubic-bezier(.4,0,.2,1) both}
.cl-kpi::before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:var(--kpi-accent,var(--brand-500))}
.cl-kpi:hover{border-color:color-mix(in srgb,var(--kpi-accent,var(--brand-500)) 45%,var(--line))}

.cl-kpi-ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
.cl-kpi-lbl{font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-4);margin-bottom:5px}
.cl-kpi-val{font-size:26px;font-weight:800;color:var(--text-1);letter-spacing:-.04em;line-height:1;margin-bottom:4px}
.cl-kpi-sub{font-size:11px;color:var(--text-4)}
.cl-kpi-bar{position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--ink-active)}
.cl-kpi-fill{height:100%;opacity:.5;transition:width var(--dur-slow) var(--ease-out)}

.cl-filters{display:flex;align-items:center;gap:10px;padding:14px 28px;border-bottom:1px solid rgba(255,255,255,.05);flex-shrink:0;flex-wrap:wrap;animation:clDown .4s .08s cubic-bezier(.4,0,.2,1) both}
.cl-srch{position:relative;display:flex;align-items:center;flex:1;min-width:180px;max-width:260px}
.cl-srch-ico{position:absolute;left:11px;color:var(--text-4);pointer-events:none}
.cl-srch-inp{width:100%;padding:8px 36px 8px 34px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;color:var(--text-1);font-size:13px;font-family:var(--font-ui);outline:none;transition:border-color .18s,background .18s}
.cl-srch-inp::placeholder{color:var(--text-4)}
.cl-srch-inp:focus{border-color:var(--ok-border);background:var(--ok-soft)}
.cl-srch-x{position:absolute;right:10px;background:none;border:none;cursor:pointer;color:var(--text-4);display:flex;align-items:center;transition:color .15s}
.cl-srch-x:hover{color:var(--text-2)}
.cl-fp{padding:7px 11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;color:var(--text-2);font-size:13px;font-family:var(--font-ui);outline:none;cursor:pointer;transition:all .18s;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23556070'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px}
.cl-fp:focus,.cl-fp:hover{border-color:var(--ok-border);color:var(--text-1)}
.cl-fp option{background:var(--ink-shell);color:var(--text-1)}
.cl-pill{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.07);background:transparent;color:var(--text-4);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-ui);transition:all .18s;white-space:nowrap}
.cl-pill:hover{border-color:rgba(255,255,255,.12);color:var(--text-2)}
.cl-pill.on{background:var(--ok-soft);border-color:var(--ok-border);color:var(--ok-500)}
.cl-pill.arch.on{background:var(--brand-soft);border-color:var(--brand-border);color:var(--brand-500)}
.cl-clr{display:inline-flex;align-items:center;gap:5px;padding:7px 11px;background:var(--bad-soft);border:1px solid var(--bad-soft);border-radius:9px;color:var(--bad-500);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-ui);transition:all .18s}
.cl-clr:hover{background:var(--bad-soft)}

.tier-pills{display:flex;gap:5px;flex-wrap:wrap}
.tier-p{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;border:1px solid rgba(255,255,255,.07);background:transparent;color:var(--text-4);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-ui);transition:all .18s;white-space:nowrap}
.tier-p:hover{color:var(--text-2);border-color:rgba(255,255,255,.12)}
.tier-p.on{border-color:currentColor;opacity:1}

.cl-bulk{display:flex;align-items:center;gap:10px;padding:10px 28px;background:var(--ok-soft);border-bottom:1px solid var(--ok-soft);font-size:13px;font-weight:500;color:var(--text-2);animation:clSlideIn .2s ease;flex-shrink:0}
.cl-bulk-b{padding:6px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:var(--text-1);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-ui);transition:all .18s;display:inline-flex;align-items:center;gap:6px}
.cl-bulk-b:hover{background:rgba(255,255,255,.1)}
.cl-bulk-b.red{color:var(--bad-500);border-color:var(--bad-border);background:var(--bad-soft)}
.cl-bulk-b.red:hover{background:var(--bad-soft)}
.cl-bulk-x{margin-left:auto;width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:var(--text-4);border-radius:6px;transition:all .15s}
.cl-bulk-x:hover{background:rgba(255,255,255,.06);color:var(--text-2)}

.cl-body{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0}
.cl-tbl-wrap{flex:1;overflow:auto;min-height:0}
.cl-tbl-wrap::-webkit-scrollbar{width:5px;height:5px}
.cl-tbl-wrap::-webkit-scrollbar-track{background:transparent}
.cl-tbl-wrap::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:99px}
.cl-tbl{width:100%;min-width:780px;border-collapse:collapse}
.cl-tbl thead tr{position:sticky;top:0;z-index:10}
.cl-tbl th{padding:11px 16px;background:var(--ink-shell);text-align:left;font-size:11px;font-weight:700;color:var(--text-4);text-transform:uppercase;letter-spacing:.7px;border-bottom:1px solid rgba(255,255,255,.05);white-space:nowrap;user-select:none}
.cl-th-sort{display:flex;align-items:center;gap:6px;cursor:pointer;transition:color .15s}
.cl-th-sort:hover{color:var(--text-2)}
.cl-tbl td{padding:13px 16px;font-size:13.5px;color:var(--text-2);border-bottom:1px solid rgba(255,255,255,.035);vertical-align:middle}
.cl-row{cursor:pointer;animation:clRowIn .3s cubic-bezier(.4,0,.2,1) both;transition:background .15s}
.cl-row:hover td{background:rgba(255,255,255,.022)}
.cl-row.sel td{background:var(--ok-soft)}
.cl-row.archived{opacity:.5}
.cl-row:hover .cl-row-acts{opacity:1}

.cl-cell{display:flex;align-items:center;gap:10px}
.cl-av{width:34px;height:34px;min-width:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cl-nm{font-size:13.5px;font-weight:600;color:var(--text-1)}
.cl-arch-tag{font-size:10px;color:var(--text-4);font-weight:500;background:rgba(255,255,255,.05);padding:1px 6px;border-radius:4px;margin-left:4px}

.cl-tier{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:600;white-space:nowrap}
.cl-type{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:500;color:var(--text-2)}

.cl-row-acts{display:flex;gap:6px;opacity:0;transition:opacity .18s}
.cl-ra{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:var(--text-2);cursor:pointer;transition:all .18s}
.cl-ra:hover{background:rgba(255,255,255,.1);color:var(--text-1)}
.cl-ra.red{border-color:var(--bad-soft);background:var(--bad-soft);color:var(--bad-500)}
.cl-ra.red:hover{background:var(--bad-soft)}

.cl-chk{width:15px;height:15px;border-radius:4px;cursor:pointer;accent-color:var(--ok-500)}
.cl-empty{padding:64px!important;text-align:center;color:var(--text-4);font-size:14px}

.cl-pag{display:flex;align-items:center;justify-content:space-between;padding:11px 20px;border-top:1px solid rgba(255,255,255,.05);background:var(--ink-shell);flex-shrink:0}
.cl-pag-info{font-size:12.5px;color:var(--text-4)}
.cl-pag-r{display:flex;align-items:center;gap:6px}
.cl-pag-pp{padding:5px 9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;color:var(--text-2);font-size:12px;font-family:var(--font-ui);outline:none;cursor:pointer}
.cl-pag-b{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;color:var(--text-2);cursor:pointer;transition:all .18s}
.cl-pag-b:hover:not(:disabled){background:rgba(255,255,255,.08);color:var(--text-1)}
.cl-pag-b:disabled{opacity:.3;cursor:not-allowed}
.cl-pag-n{min-width:28px;height:28px;padding:0 5px;display:flex;align-items:center;justify-content:center;background:transparent;border:1px solid transparent;border-radius:7px;color:var(--text-4);font-size:12.5px;font-weight:500;cursor:pointer;font-family:var(--font-ui);transition:all .18s}
.cl-pag-n:hover{color:var(--text-1);border-color:rgba(255,255,255,.08)}
.cl-pag-n.on{background:var(--ok-soft);color:var(--ok-500);border-color:var(--ok-border)}

.cl-mo{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .25s}
.cl-mo.on{opacity:1;pointer-events:auto}
.cl-mc{background:var(--ink-card);border:1px solid rgba(255,255,255,.1);border-radius:20px;width:480px;max-width:92vw;overflow:hidden;transform:scale(.94) translateY(12px);transition:transform .3s cubic-bezier(.4,0,.2,1);box-shadow:var(--shadow-modal)}
.cl-mo.on .cl-mc{transform:scale(1) translateY(0)}
.cl-m-head{display:flex;align-items:flex-start;justify-content:space-between;padding:22px 24px;border-bottom:1px solid rgba(255,255,255,.06)}
.cl-m-title{font-size:17px;font-weight:700;color:var(--text-1);margin-bottom:3px}
.cl-m-sub{font-size:12.5px;color:var(--text-4)}
.cl-m-cl{width:30px;height:30px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:transparent;color:var(--text-4);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;flex-shrink:0}
.cl-m-cl:hover{background:rgba(255,255,255,.06);color:var(--text-1)}
.cl-m-body{padding:22px 24px;display:flex;flex-direction:column;gap:16px}
.cl-m-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.cl-m-fg{display:flex;flex-direction:column;gap:6px}
.cl-m-lbl{font-size:11px;font-weight:700;color:var(--text-4);text-transform:uppercase;letter-spacing:.08em}
.cl-m-inp,.cl-m-sel{padding:10px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;color:var(--text-1);font-size:13.5px;font-family:var(--font-ui);outline:none;transition:border-color .18s,background .18s;width:100%}
.cl-m-inp::placeholder{color:var(--text-4)}
.cl-m-inp:focus,.cl-m-sel:focus{border-color:var(--ok-border);background:var(--ok-soft)}
.cl-m-inp.err{border-color:var(--bad-border)}
.cl-m-err{font-size:11.5px;color:var(--bad-500)}
.cl-m-sel option{background:var(--ink-shell);color:var(--text-1)}
.cl-m-foot{display:flex;gap:10px;padding:16px 24px;border-top:1px solid rgba(255,255,255,.06)}
.cl-mf-s{flex:1;padding:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;color:var(--text-2);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font-ui);transition:all .18s}
.cl-mf-s:hover{background:rgba(255,255,255,.08);color:var(--text-1)}
.cl-mf-p{flex:2;padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--ok-500);border:none;border-radius:9px;color:var(--on-ok);font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font-ui);box-shadow:0 0 16px var(--ok-border);transition:all .18s}
.cl-mf-p:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}
.cl-mf-p:disabled{opacity:.5;cursor:not-allowed;transform:none}

.cl-conf-ico{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.cl-conf-title{font-size:17px;font-weight:700;color:var(--text-1);text-align:center;margin-bottom:8px}
.cl-conf-desc{font-size:13px;color:var(--text-4);text-align:center;line-height:1.6}
.cl-conf-warn{margin-top:10px;padding:8px 14px;background:var(--bad-soft);border-radius:8px;font-size:12px;color:var(--bad-500);display:flex;align-items:center;gap:6px;justify-content:center}

.cl-toast{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;gap:12px;padding:12px 18px;border-radius:12px;font-size:13.5px;font-weight:500;box-shadow:var(--shadow-modal);animation:clSlideIn .3s cubic-bezier(.4,0,.2,1);border:1px solid;white-space:nowrap}
.cl-toast.ok{background:var(--ok-soft);border-color:var(--ok-border);color:var(--ok-500)}
.cl-toast.err{background:var(--bad-soft);border-color:var(--bad-border);color:var(--bad-500)}
.cl-toast-x{background:none;border:none;cursor:pointer;color:inherit;opacity:.6;display:flex;align-items:center;transition:opacity .15s}
.cl-toast-x:hover{opacity:1}

@keyframes clDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform: none}}
@keyframes clUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform: none}}
@keyframes clRowIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform: none}}
@keyframes clSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform: none}}
@keyframes clSpin{to{transform:rotate(360deg)}}

@media(max-width:1000px){.cl-kpi-row{grid-template-columns:repeat(2,1fr)}}
@media(max-width:700px){
  .cl-top{padding:16px 18px 0}
  .cl-filters{padding:12px 18px}
  .cl-kpi-row{padding:14px 18px 0}
  .cl-h2{font-size:18px}
  .cl-m-row{grid-template-columns:1fr}
  
  .cl-tbl thead { display: none; }
  .cl-row { display: block; padding: 12px 16px !important; border-bottom: 1px solid rgba(255,255,255,.035) !important; }
  .cl-row td { display: block; padding: 6px 0 6px 40% !important; border: none !important; text-align: left !important; position: relative; }
  .cl-row td:first-child::before { display: none; }
  .cl-row td::before {
    content: attr(data-label);
    position: absolute; left: 0; top: 6px; font-size: 10px; color: var(--text-4); text-transform: uppercase; font-weight: 700;
  }
  .cl-cell { margin-bottom: 8px; }
  .cl-nm { font-size: 14px !important; }
  .cl-tier, .cl-type { margin: 4px 0; }
  .cl-row-acts { opacity: 1 !important; justify-content: flex-end; margin-top: 8px; }
  .cl-pag { flex-direction: column; align-items: flex-start !important; gap: 12px; }
  .cl-pag-r { width: 100%; justify-content: space-between; }
  
  .cl-srch-x { min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center; }
  .cl-ra { min-width: 44px; min-height: 44px; width: 44px; height: 44px; }
}

@media(max-width:700px){
  /* 16px is the threshold under which iOS Safari zooms the page in when a field
     is focused; zoomed, the whole layout sits differently on screen. */
  .cl-srch-inp, .cl-fp, .cl-m-inp, .cl-m-sel { font-size: 16px !important; }
  /* The card layout is a block list now, so the 780px table floor must go. */
  .cl-tbl { min-width: 0 !important; }
  /* The list is the page on a phone: release the fixed frame so the whole page
     scrolls once in .main-body, instead of squeezing 127 clients into the
     sliver of height the tiles and filters leave behind. */
  .cl-shell { height: auto; min-height: 100%; overflow: visible; }
  .cl-body, .cl-tbl-wrap { overflow: visible; }
  .cl-tbl-wrap { flex: none; }
  /* Two compact tiles instead of four tall ones: the list needs the height. */
  .cl-kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px; padding: 12px 16px 0; }
  .cl-kpi { padding: 12px 13px; border-radius: 13px; }
  .cl-kpi-ico { width: 28px; height: 28px; margin-bottom: 8px; }
  .cl-kpi-val { font-size: 20px; }
  .cl-kpi-bar { display: none; }
}

@media(max-width:480px){
  .cl-top{padding:12px 16px 0}
  .cl-filters{padding:10px 16px; flex-direction: column; align-items: stretch !important; gap: 10px !important;}
  .cl-srch{max-width:100% !important; width:100% !important;}
  .tier-pills{justify-content: center; flex-wrap: wrap;}
  .cl-m-inp, .cl-m-sel { font-size: 16px !important; }
  /* Scoped to this page: a page-local stylesheet must not restyle the console. */
  .cl-shell button, .cl-shell [role="button"] { min-height: var(--tap-min); }
}

button:focus-visible{outline:2px solid var(--ok-500);outline-offset:2px}
`;

/* ─── TYPES ──────────────────────────────────────────────────────────────── */
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

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const TIER_META: Record<string, { color: string; bg: string; border: string; icon: JSX.Element; label: string }> = {
  Standard:  { color: "var(--text-4)", bg: "rgba(85,96,112,.12)",   border: "rgba(85,96,112,.2)",   icon: <User size={10} />,   label: "Standard"   },
  Bronze:    { color: "var(--warn-500)", bg: "var(--warn-soft)", border: "var(--warn-border)", icon: <Medal size={10} />,  label: "Bronze"     },
  Silver:    { color: "var(--text-2)",   bg: "var(--line-soft)", border: "var(--line)",        icon: <Medal size={10} />,  label: "Silver"     },
  Gold:      { color: "var(--text-1)",   bg: "var(--line)",      border: "var(--line-strong)", icon: <Trophy size={10} />, label: "Gold"       },
  VIP:       { color: "var(--brand-400)", bg: "var(--brand-soft)", border: "var(--brand-border)", icon: <Crown size={10} />, label: "VIP"       },
  Corporate: { color: "var(--brand-500)", bg: "var(--brand-soft)", border: "var(--brand-border)", icon: <Briefcase size={10}/>, label: "Corporate" },

};

const TIERS = ["All", "Standard", "Bronze", "Silver", "Gold", "VIP", "Corporate"];

const TIER_PILL_COLORS: Record<string, { active: string }> = {
  All:       { active: "var(--ok-500)" },
  Standard:  { active: "var(--text-4)" },
  Bronze:    { active: "var(--warn-500)" },
  Silver:    { active: "var(--text-2)" },
  Gold:      { active: "var(--warn-500)" },
  VIP:       { active: "var(--brand-400)" },
  Corporate: { active: "var(--brand-500)" },
};

/* ─── SUB-COMPONENTS ─────────────────────────────────────────────────────── */
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

function KpiCard({ label, value, of, unit, icon, accent, sub, delay = 0 }: {
  label: string; value: number; icon: JSX.Element;
  accent: string; sub?: string; delay?: number;
  /** The whole this figure is part of. The bar only exists when there is one. */
  of?: number;
  /** What the denominator counts, for the bar's tooltip: "127 clients". */
  unit?: string;
}) {
  const counted = useCountUp(value, delay);
  const share = typeof of === "number" && of > 0 ? Math.min(1, value / of) : null;
  return (
    <div className="cl-kpi" style={{ animationDelay: `${delay}ms`, "--kpi-accent": accent } as React.CSSProperties}>
      <div className="cl-kpi-ico" style={{ background: `color-mix(in srgb, ${accent} 20%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 32%, transparent)`, color: accent }}>{icon}</div>
      <div className="cl-kpi-lbl">{label}</div>
      <div className="cl-kpi-val">{counted}</div>
      {sub && <div className="cl-kpi-sub">{sub}</div>}
      {share !== null && (
        <div className="cl-kpi-bar" title={`${value} of ${of} ${unit ?? ""}`.trim()} role="img"
             aria-label={`${value} of ${of} ${unit ?? ""}`.trim()}>
          <div className="cl-kpi-fill" style={{ width: `${Math.round(share * 100)}%`, background: accent }} />
        </div>
      )}
    </div>
  );
}

function Avatar({ name, type }: { name: string; type: string }) {
  /* One neutral disc for every client: a per-name hue turned the table into a
     colour chart and told the reader nothing about the row. */
  const isCorp = type === "Corporate";
  return (
    <div className="cl-av" style={{
      background: isCorp ? "var(--brand-soft)" : "var(--ink-active)",
      color: isCorp ? "var(--brand-400)" : "var(--text-2)",
    }}>
      {isCorp ? <Building2 size={15} /> : <span style={{ fontSize: 13, fontWeight: 700 }}>{name[0]?.toUpperCase()}</span>}
    </div>
  );
}

function SortIcon({ col, sortKey, dir }: { col: string; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={11} style={{ opacity: .35 }} />;
  return dir === "asc" ? <ArrowUp size={11} color="var(--ok-500)" /> : <ArrowDown size={11} color="var(--ok-500)" />;
}

function TierBadge({ tier }: { tier: string }) {
  const m = TIER_META[tier] ?? TIER_META.Standard;
  return (
    <span className="cl-tier" style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
      {m.icon}{m.label}
    </span>
  );
}

function ClientModal({ client, onClose, onSave, saving, canEdit }: {
  client: Partial<Client> | null; onClose: () => void;
  onSave: (f: FormState) => void; saving: boolean; canEdit: boolean;
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
    if (!canEdit) return;
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
              value={form.name} onChange={e => set("name", e.target.value)} disabled={!canEdit} />
            {errs.name && <span className="cl-m-err">{errs.name}</span>}
          </div>
          <div className="cl-m-row">
            <div className="cl-m-fg">
              <label className="cl-m-lbl">Type</label>
              <select className="cl-m-sel" value={form.type} onChange={e => set("type", e.target.value)} disabled={!canEdit}>
                <option>Individual</option>
                <option>Corporate</option>
              </select>
            </div>
            <div className="cl-m-fg">
              <label className="cl-m-lbl">Tier</label>
              <select className="cl-m-sel" value={form.tier} onChange={e => set("tier", e.target.value)} disabled={!canEdit}>
                {["Standard","Bronze","Silver","Gold","VIP","Corporate"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="cl-m-fg">
            <label className="cl-m-lbl">Phone</label>
            <input className={`cl-m-inp${errs.phone ? " err" : ""}`}
              placeholder="XX XXX XXXX"
              value={formatPhoneInput(form.phone)} 
              onChange={e => set("phone", formatPhoneInput(e.target.value))} disabled={!canEdit} />
            {errs.phone && <span className="cl-m-err">{errs.phone}</span>}
          </div>
          <div className="cl-m-fg">
            <label className="cl-m-lbl">Notes <span style={{ color: "var(--text-4)", fontWeight: 400 }}>(optional)</span></label>
            <input className="cl-m-inp"
              placeholder="Any important notes..."
              value={form.notes} onChange={e => set("notes", e.target.value)} disabled={!canEdit} />
          </div>
        </div>
        <div className="cl-m-foot">
          <button className="cl-mf-s" onClick={onClose}>Cancel</button>
          <button className="cl-mf-p" onClick={submit} disabled={saving || !canEdit}>
            {saving ? "Saving..." : <><Check size={14} />{isEdit ? "Save Changes" : "Add Client"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ count, type, onClose, onConfirm }: {
  count: number; type: "archive" | "delete";
  onClose: () => void; onConfirm: () => void;
}) {
  const isDel = type === "delete";
  return (
    <div className="cl-mo on" onClick={onClose}>
      <div className="cl-mc" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ padding: "28px 24px 0" }}>
          <div className="cl-conf-ico" style={{ background: isDel ? "var(--bad-soft)" : "var(--brand-soft)" }}>
            {isDel ? <Trash2 size={24} color="var(--bad-500)" /> : <Archive size={24} color="var(--brand-500)" />}
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
            style={{ flex: 2, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: isDel ? "var(--bad-700)" : "var(--brand-700)", border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-ui)", transition: "all .18s" }}
            onClick={onConfirm}>
            {isDel ? <><Trash2 size={14} /> Delete Permanently</> : <><Archive size={14} /> Archive</>}
          </button>
        </div>
      </div>
    </div>
  );
}

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

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export const Clients = () => {
  const location = useLocation();
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

  const { permission, loading: permLoading, canEdit } = usePermission(location.pathname);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setEditing(null); setConfirm(null); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); canEdit && setEditing({}); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [canEdit]);

  const fetchClients = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      let q = supabase.from("clients").select("*").order("name", { ascending: true });
      if (!showArchived) {
        q = q.or('active.eq.true,active.is.null');
      }
      const { data, error } = await q;
      if (error) throw error;
      if (data) setClients(data);
    } catch (err: any) {
      console.error("Fetch clients error:", err);
      setToast({ msg: `Failed to load clients: ${err.message || 'Unknown error'}`, type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showArchived]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleSave = async (form: FormState) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const payload: any = { 
        name: form.name.trim(), 
        type: form.type, 
        tier: form.tier, 
        phone: form.phone.trim(), 
        notes: form.notes, 
        active: true 
      };
      
      if ((editing as Client)?.id) {
        const { error } = await supabase.from("clients").update(payload).eq("id", (editing as Client).id);
        if (error) throw error;
        setToast({ msg: "Client updated", type: "success" });
      } else {
        const { error } = await supabase.from("clients").insert([payload]);
        if (error) throw error;
        setToast({ msg: "Client added", type: "success" });
      }
      setEditing(null);
      await fetchClients(true);
    } catch (err: any) {
      console.error("Save client error:", err);
      setToast({ msg: `Failed to save: ${err.message}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!canEdit || !confirm) return;
    const { ids, type } = confirm;
    setConfirm(null);
    try {
      if (type === "archive") {
        const { error } = await supabase.from("clients").update({ active: false }).in("id", ids);
        if (error) throw error;
        setToast({ msg: `${ids.length} client${ids.length > 1 ? "s" : ""} archived`, type: "success" });
      } else {
        const { error } = await supabase.from("clients").delete().in("id", ids);
        if (error) throw error;
        setToast({ msg: `${ids.length} client${ids.length > 1 ? "s" : ""} deleted`, type: "success" });
      }
      setSelected(new Set());
      await fetchClients(true);
    } catch (err: any) {
      console.error("Confirm action error:", err);
      setToast({ msg: `Action failed: ${err.message}`, type: "error" });
    }
  };

  const handleExport = () => {
    const escapeCsv = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
    const headers = ["Name", "Type", "Tier", "Phone", "Notes", "Status"];
    const rows = filtered.map(c => [
      c.name,
      c.type,
      c.tier,
      c.phone,
      c.notes || "",
      c.active === false ? "Archived" : "Active"
    ]);
    const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chapman-clients-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ msg: "CSV exported successfully", type: "success" });
  };

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
      const av = String(a[sort.key] ?? ""); const bv = String(b[sort.key] ?? "");
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

  if (loading || permLoading) return (
    <div className="cl-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "var(--text-4)", fontSize: 14, display: "flex", alignItems: "center" }}>
        <RefreshCw size={18} className="cl-spin" style={{ marginRight: 10 }} /> Loading clients...
      </div>
    </div>
  );

  return (
    <div className="cl-shell">
      <style>{CSS}</style>

      {editing  !== null && <ClientModal client={editing} onClose={() => setEditing(null)} onSave={handleSave} saving={saving} canEdit={canEdit} />}
      {confirm  !== null && <ConfirmModal count={confirm.ids.length} type={confirm.type} onClose={() => setConfirm(null)} onConfirm={handleConfirm} />}
      {toast    !== null && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="cl-top">
        <div>
          <h2 className="cl-h2">Clients</h2>
          <p className="cl-sub">
            <span>{stats.total} total</span>
            <span className="cl-dsep">·</span>
            <span style={{ color: "var(--brand-500)" }}>{stats.corporate} corporate</span>
            <span className="cl-dsep">·</span>
            <span style={{ color: "var(--warn-500)" }}>{stats.gold} gold / VIP</span>
          </p>
        </div>
        <div className="cl-acts">
          <button className="cl-btn ghost" title="Refresh" onClick={() => fetchClients(true)}>
            <RefreshCw size={14} className={refreshing ? "cl-spin" : ""} />
          </button>
          <button className="cl-btn ghost" title="Export" onClick={handleExport}><Download size={14} /></button>
          <button 
            className="cl-btn primary" 
            onClick={() => canEdit && setEditing({})}
            disabled={!canEdit}
            style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? "pointer" : "not-allowed" }}
          >
            <Plus size={14} /> {canEdit ? "Add Client" : "View Only"}
          </button>
        </div>
      </div>

      {!canEdit && (
        <div className="cl-view-banner">
          <Shield size={14} color="var(--brand-500)" />
          <span>View-only access · modifications disabled</span>
        </div>
      )}

      <div className="cl-kpi-row">
        <KpiCard label="Total Clients"   value={stats.total}     icon={<Users size={18} />}     accent="var(--brand-500)" sub="All types"    delay={0}   />
        <KpiCard label="Corporate"       value={stats.corporate} of={stats.total} unit="clients" icon={<Building2 size={18} />} accent="var(--info-500)" sub="B2B clients"  delay={80}  />
        <KpiCard label="Gold / VIP"      value={stats.gold}      of={stats.total} unit="clients" icon={<Crown size={18} />}     accent="var(--warn-500)" sub="Top tier"     delay={160} />
        <KpiCard label="Active"          value={stats.active}    of={stats.total} unit="clients" icon={<Check size={18} />}     accent="var(--ok-500)" sub="Not archived" delay={240} />
      </div>

      <div className="cl-filters">
        <div className="cl-srch">
          <Search size={13} className="cl-srch-ico" />
          <input ref={searchRef} className="cl-srch-inp"
            placeholder="Search name or phone..." value={search}
            onChange={e => { setSearch(e.target.value); setPg(1); }} />
          {search && <button className="cl-srch-x" onClick={() => setSearch("")}><X size={11} /></button>}
        </div>

        <div className="tier-pills">
          {TIERS.map(t => {
            const on = tierFilter === t;
            const tc = TIER_PILL_COLORS[t]?.active ?? "var(--text-4)";
            return (
              <button key={t} className="tier-p"
                style={{ color: on ? tc : undefined, borderColor: on ? tc + "60" : undefined, background: on ? tc + "12" : undefined }}
                onClick={() => { setTierFilter(t); setPg(1); }}>
                {t}
              </button>
            );
          })}
        </div>

        <select className="cl-fp" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPg(1); }}>
          <option value="All">All Types</option>
          <option value="Corporate">Corporate</option>
          <option value="Individual">Individual</option>
        </select>

        <button className={`cl-pill arch ${showArchived ? "on" : ""}`} onClick={() => setShowArchived(v => !v)}>
          <Archive size={12} /> {showArchived ? "Hide Archived" : "Archived"}
        </button>

        {hasFilters && (
          <button className="cl-clr" onClick={() => { setTierFilter("All"); setTypeFilter("All"); setSearch(""); }}>
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {selected.size > 0 && canEdit && (
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

      <div className="cl-body">
        <div className="cl-tbl-wrap">
          <table className="cl-tbl">
            <thead>
              <tr>
                <th style={{ width: 44, paddingLeft: 20 }}>
                  <input type="checkbox" className="cl-chk"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} disabled={!canEdit} />
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
                  <td data-label="Select" style={{ paddingLeft: 20, width: 44 }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="cl-chk" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} disabled={!canEdit} />
                  </td>
                  <td data-label="Client">
                    <div className="cl-cell">
                      <Avatar name={c.name} type={c.type} />
                      <div>
                        <div className="cl-nm">{c.name}</div>
                        {c.active === false && <span className="cl-arch-tag">Archived</span>}
                      </div>
                    </div>
                  </td>
                  <td data-label="Type">
                    <div className="cl-type">
                      {c.type === "Corporate" ? <Building2 size={13} color="var(--brand-500)" /> : <User size={13} color="var(--text-4)" />}
                      {c.type}
                    </div>
                  </td>
                  <td data-label="Tier"><TierBadge tier={c.tier} /></td>
                  <td data-label="Phone" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-2)" }}>{c.phone}</td>
                  <td data-label="Actions">
                    <div className="cl-row-acts">
                      {canEdit && (
                        <>
                          <button className="cl-ra" title="Edit" onClick={() => setEditing(c)}><Edit2 size={13} /></button>
                          <button className="cl-ra" title="Archive" onClick={() => setConfirm({ ids: [c.id], type: "archive" })}><Archive size={13} /></button>
                          <button className="cl-ra red" title="Delete" onClick={() => setConfirm({ ids: [c.id], type: "delete" })}><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

export default Clients;