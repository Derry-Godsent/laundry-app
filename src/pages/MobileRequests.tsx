import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronRight, ClipboardList, ExternalLink, Inbox, MapPin, MessageSquareText, RefreshCw, ShieldCheck, X } from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { PermissionGuard } from "../components/PermissionGuard";
import { usePermission } from "../hooks/usePermission";
import "./MobileRequests.css";

type RequestStatus = "pending" | "under_review" | "needs_customer_confirmation" | "confirmed" | "declined" | "cancelled" | "converted";
type RequestView = "active" | "waiting" | "confirmed" | "declined";

interface MobileRequest {
  id: string;
  request_status: RequestStatus;
  requested_for: string | null;
  confirmed_for: string | null;
  pickup_area: string | null;
  pickup_address: string | null;
  pickup_window: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  pickup_accuracy_meters: number | null;
  laundry_items: Array<{ name?: string; quantity?: number }> | null;
  express: boolean;
  estimated_total: number | string | null;
  customer_note: string | null;
  staff_note: string | null;
  customer_response: "accepted" | "rejected" | null;
  created_at: string;
  customer_accounts?: { full_name?: string | null; phone?: string | null } | null;
}

const STATUS_META: Record<RequestStatus, { label: string; color: string; background: string }> = {
  pending: { label: "New", color: "#aab4ff", background: "rgba(108,114,243,0.16)" },
  under_review: { label: "Reviewing", color: "#f6c769", background: "rgba(246,199,105,0.14)" },
  needs_customer_confirmation: { label: "Waiting for client", color: "#61d7bc", background: "rgba(52,211,153,0.14)" },
  confirmed: { label: "Approved", color: "#62dd93", background: "rgba(52,211,153,0.14)" },
  declined: { label: "Declined", color: "#fb9494", background: "rgba(248,113,113,0.14)" },
  cancelled: { label: "Cancelled", color: "#9aa3b5", background: "rgba(154,163,181,0.13)" },
  converted: { label: "Order created", color: "#85b3ff", background: "rgba(55,138,221,0.14)" },
};

const formatDay = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" }) : "No date chosen";
const formatCreated = (value: string) => new Date(value).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const money = (value: number | string | null) => value === null ? "Estimate pending" : `₵${Number(value).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const isActiveWork = (status: RequestStatus) => status === "pending" || status === "under_review";
const requestMeta = (request: MobileRequest) => request.request_status === "declined" && request.customer_response === "rejected" ? { label: "Client rejected", color: "#fb9494", background: "rgba(248,113,113,0.14)" } : STATUS_META[request.request_status];

function MobileRequestsContent() {
  const { canEdit, loading: permissionLoading } = usePermission("/mobile-requests");
  const [requests, setRequests] = useState<MobileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestView>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<RequestStatus>("needs_customer_confirmation");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: requestError } = await supabase
      .from("mobile_requests")
      .select("id, request_status, requested_for, confirmed_for, pickup_area, pickup_address, pickup_window, pickup_latitude, pickup_longitude, pickup_accuracy_meters, laundry_items, express, estimated_total, customer_note, staff_note, customer_response, created_at, customer_accounts ( full_name, phone )")
      .eq("service_code", "laundry")
      .order("created_at", { ascending: false });
    if (requestError) {
      setError("Mobile requests could not be loaded. Please refresh the page.");
      setRequests([]);
    } else {
      setRequests((data ?? []) as MobileRequest[]);
      setSelectedId((current) => current && (data ?? []).some((request: MobileRequest) => request.id === current) ? current : null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadRequests();
    const channel = supabase.channel("mobile-laundry-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "mobile_requests" }, () => { void loadRequests(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadRequests]);

  const selected = requests.find((request) => request.id === selectedId) ?? null;
  const filtered = useMemo(() => requests.filter((request) => {
    if (filter === "active") return isActiveWork(request.request_status);
    if (filter === "waiting") return request.request_status === "needs_customer_confirmation";
    if (filter === "confirmed") return request.request_status === "confirmed" || request.request_status === "converted";
    return request.request_status === "declined" || request.request_status === "cancelled";
  }), [filter, requests]);
  const counts = useMemo(() => ({
    active: requests.filter((request) => isActiveWork(request.request_status)).length,
    waiting: requests.filter((request) => request.request_status === "needs_customer_confirmation").length,
    confirmed: requests.filter((request) => request.request_status === "confirmed" || request.request_status === "converted").length,
    declined: requests.filter((request) => request.request_status === "declined" || request.request_status === "cancelled").length,
  }), [requests]);

  useEffect(() => {
    if (!selected || !isActiveWork(selected.request_status)) return;
    setDecision("needs_customer_confirmation");
    setDate(selected.requested_for ?? selected.confirmed_for ?? "");
    setNote(selected.staff_note ?? "");
  }, [selectedId, selected]);

  const saveDecision = async () => {
    if (!selected || !isActiveWork(selected.request_status)) return;
    if (decision === "needs_customer_confirmation" && !date) {
      setError("Choose the proposed service date before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    const { error: reviewError } = await supabase.rpc("review_mobile_request", {
      p_request_id: selected.id,
      p_status: decision,
      p_confirmed_for: decision === "needs_customer_confirmation" ? date || null : null,
      p_staff_note: note || null,
    });
    setSaving(false);
    if (reviewError) {
      setError("The request could not be updated. Please try again.");
      return;
    }
    setSelectedId(null);
    setSavedMessage(decision === "declined" ? "Request declined. It remains in Declined history as a final record." : decision === "confirmed" ? "Client date approved. It remains in Approved work for the next Chapman step." : "New date sent. It remains in Waiting for client until the client responds.");
    setFilter(decision === "declined" ? "declined" : decision === "confirmed" ? "confirmed" : "waiting");
    await loadRequests();
  };

  const heading = filter === "active" ? ["Active Laundry queue", "Requests waiting for Chapman action"] : filter === "waiting" ? ["Waiting for client", "Date proposals awaiting a client answer"] : filter === "confirmed" ? ["Approved work", "Requests ready for operational follow-through"] : ["Declined history", "Final client or staff declines; no action required"];
  return <div className="mr-page">
    <header className="mr-header"><div><div className="mr-eyebrow"><Inbox size={14} /> MOBILE INTAKE</div><h1>Mobile Requests</h1><p>Every request remains visible in its correct work view: action needed, client reply, approved work, or final decline history.</p></div><button className="mr-refresh" onClick={() => void loadRequests()} disabled={loading} aria-label="Refresh mobile requests"><RefreshCw size={16} className={loading ? "mr-spin" : ""} /> Refresh</button></header>
    <section className="mr-summary" aria-label="Mobile request management views">
      <button className={filter === "active" ? "mr-summary-card active" : "mr-summary-card"} onClick={() => setFilter("active")}><span>Needs action</span><strong>{counts.active}</strong></button>
      <button className={filter === "waiting" ? "mr-summary-card active mint" : "mr-summary-card mint"} onClick={() => setFilter("waiting")}><span>Waiting for client</span><strong>{counts.waiting}</strong></button>
      <button className={filter === "confirmed" ? "mr-summary-card active green" : "mr-summary-card green"} onClick={() => setFilter("confirmed")}><span>Approved work</span><strong>{counts.confirmed}</strong></button>
      <button className={filter === "declined" ? "mr-summary-card active amber" : "mr-summary-card amber"} onClick={() => setFilter("declined")}><span>Declined history</span><strong>{counts.declined}</strong></button>
    </section>
    <section className="mr-workspace">
      <div className="mr-list-panel"><div className="mr-list-heading"><div><h2>{heading[0]}</h2><p>{heading[1]}</p></div><span>{filtered.length}</span></div>{error ? <div className="mr-error">{error}</div> : null}{savedMessage ? <div className="mr-empty">{savedMessage}</div> : null}{loading || permissionLoading ? <div className="mr-empty"><RefreshCw size={18} className="mr-spin" /><p>Loading protected requests…</p></div> : filtered.length === 0 ? <div className="mr-empty"><ClipboardList size={24} /><h3>No requests in this view</h3><p>{filter === "active" ? "New client requests will appear here when Chapman needs to act." : filter === "waiting" ? "Requests stay here until the client replies." : filter === "confirmed" ? "Approved requests remain here for follow-through." : "Final declined requests remain here as a clear record."}</p></div> : <div className="mr-list">{filtered.map((request) => { const status = requestMeta(request); const customerName = request.customer_accounts?.full_name || "Verified customer"; const itemCount = Array.isArray(request.laundry_items) ? request.laundry_items.reduce((total, item) => total + Number(item.quantity ?? 1), 0) : 0; return <button key={request.id} className={selectedId === request.id ? "mr-request selected" : "mr-request"} onClick={() => setSelectedId(request.id)}><div className="mr-request-top"><span className="mr-request-id">#{request.id.slice(0, 8)}</span><span className="mr-status" style={{ color: status.color, background: status.background }}>{status.label}</span></div><div className="mr-customer"><div className="mr-avatar">{customerName.slice(0, 1).toUpperCase()}</div><div><strong>{customerName}</strong><span>{request.customer_accounts?.phone || "Phone verified"}</span></div><ChevronRight size={17} /></div><div className="mr-request-meta"><span><CalendarDays size={13} /> {formatDay(request.confirmed_for ?? request.requested_for)}</span><span>{itemCount ? `${itemCount} items` : "Items to review"}</span><strong>{money(request.estimated_total)}</strong></div></button>; })}</div>}</div>
      <aside className="mr-detail-panel" aria-live="polite">{!selected ? <div className="mr-detail-empty"><ShieldCheck size={26} /><h2>Select a request</h2><p>Review client details and manage the next appropriate step. Mobile requests remain separate from existing Orders until Chapman creates one deliberately.</p></div> : <><div className="mr-detail-header"><div><span className="mr-detail-label">LAUNDRY REQUEST</span><h2>{selected.customer_accounts?.full_name || "Verified customer"}</h2><p>Received {formatCreated(selected.created_at)}</p></div><button onClick={() => setSelectedId(null)} aria-label="Close request details"><X size={18} /></button></div><div className="mr-detail-status"><span className="mr-status" style={{ color: requestMeta(selected).color, background: requestMeta(selected).background }}>{requestMeta(selected).label}</span>{selected.express ? <span className="mr-express">Express care</span> : null}</div><div className="mr-detail-grid"><DetailItem icon={<CalendarDays size={16} />} label="Client’s preferred date" value={formatDay(selected.requested_for)} /><DetailItem icon={<MapPin size={16} />} label="Collection area" value={selected.pickup_area || selected.pickup_address || "To be confirmed"} /><DetailItem icon={<ClipboardList size={16} />} label="Estimated total" value={money(selected.estimated_total)} /><DetailItem icon={<MessageSquareText size={16} />} label="Pickup window" value={selected.pickup_window || "To be arranged"} /></div><div className="mr-section"><h3>Pickup location</h3>{selected.pickup_latitude !== null && selected.pickup_latitude !== undefined && selected.pickup_longitude !== null && selected.pickup_longitude !== undefined ? <p className="mr-note"><a href={`https://www.google.com/maps/search/?api=1&query=${selected.pickup_latitude},${selected.pickup_longitude}`} target="_blank" rel="noreferrer" style={{ color: "#61d7bc", fontWeight: 700 }}>Open client-shared pickup point <ExternalLink size={12} style={{ verticalAlign: "middle" }} /></a>{selected.pickup_accuracy_meters ? ` · approximately ${Math.round(selected.pickup_accuracy_meters)} m accuracy` : ""}</p> : <p className="mr-muted">No map point shared. Use the client’s area and landmark to arrange pickup.</p>}</div><div className="mr-section"><h3>Laundry items</h3>{Array.isArray(selected.laundry_items) && selected.laundry_items.length ? <div className="mr-items">{selected.laundry_items.map((item, index) => <span key={`${item.name}-${index}`}>{item.quantity ?? 1}× {item.name || "Laundry item"}</span>)}</div> : <p className="mr-muted">The item list will show here when the customer submits the booking.</p>}</div><div className="mr-section"><h3>Customer note</h3><p className={selected.customer_note ? "mr-note" : "mr-muted"}>{selected.customer_note || "No special instructions added."}</p></div>{isActiveWork(selected.request_status) ? <div className="mr-decision"><div><h3>Staff decision</h3><p>Confirm uses the client’s selected date automatically. Propose a date only when Chapman needs to offer a different option.</p></div><label>Status<select value={decision} onChange={(event) => setDecision(event.target.value as RequestStatus)} disabled={!canEdit || saving}><option value="needs_customer_confirmation">Propose a date</option><option value="confirmed">Confirm client date</option><option value="declined">Decline request</option></select></label>{decision === "needs_customer_confirmation" ? <label>Proposed service date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={!canEdit || saving} /></label> : null}<label>Note for customer<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a helpful update or next step" disabled={!canEdit || saving} rows={3} /></label><button className="mr-save" onClick={() => void saveDecision()} disabled={!canEdit || saving}>{saving ? "Saving…" : <><Check size={16} /> Send update</>}</button>{!canEdit ? <p className="mr-view-only">You can review this request, but only an authorised manager can change it.</p> : null}</div> : <div className="mr-section"><h3>{selected.request_status === "needs_customer_confirmation" ? "Waiting for the client" : selected.request_status === "confirmed" || selected.request_status === "converted" ? "Approved work" : "Final declined record"}</h3><p className="mr-note">{selected.request_status === "needs_customer_confirmation" ? "The client must respond in the Chapman app. No staff action is needed until then." : selected.request_status === "confirmed" || selected.request_status === "converted" ? "Keep this request visible here while Chapman continues with order creation and specialist assignment." : selected.customer_response === "rejected" ? "The client rejected the proposed date. This request is closed and needs no further action." : "Chapman declined this request. It remains as a final history record."}</p></div>}</>}</aside>
    </section>
  </div>;
}

function DetailItem({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) { return <div className="mr-detail-item"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>; }
export const MobileRequests = () => <PermissionGuard path="/mobile-requests" showBanner={false}><MobileRequestsContent /></PermissionGuard>;
