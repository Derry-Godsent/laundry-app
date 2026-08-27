import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronRight, ClipboardList, Inbox, MapPin, MessageSquareText, RefreshCw, ShieldCheck, X } from "lucide-react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { PermissionGuard } from "../components/PermissionGuard";
import { usePermission } from "../hooks/usePermission";
import "./MobileRequests.css";

type RequestStatus = "pending" | "under_review" | "needs_customer_confirmation" | "confirmed" | "declined" | "cancelled" | "converted";

interface MobileRequest {
  id: string;
  request_status: RequestStatus;
  requested_for: string | null;
  confirmed_for: string | null;
  pickup_area: string | null;
  pickup_address: string | null;
  pickup_window: string | null;
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
  confirmed: { label: "Confirmed", color: "#62dd93", background: "rgba(52,211,153,0.14)" },
  declined: { label: "Declined", color: "#fb9494", background: "rgba(248,113,113,0.14)" },
  cancelled: { label: "Cancelled", color: "#9aa3b5", background: "rgba(154,163,181,0.13)" },
  converted: { label: "Order created", color: "#85b3ff", background: "rgba(55,138,221,0.14)" },
};

const STAFF_DECISIONS: RequestStatus[] = ["under_review", "needs_customer_confirmation", "declined"];

const formatDay = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" }) : "No date chosen";
const formatCreated = (value: string) => new Date(value).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const money = (value: number | string | null) => value === null ? "Estimate pending" : `₵${Number(value).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function MobileRequestsContent() {
  const { canEdit, loading: permissionLoading } = usePermission("/mobile-requests");
  const [requests, setRequests] = useState<MobileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<RequestStatus>("under_review");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: requestError } = await supabase
      .from("mobile_requests")
      .select("id, request_status, requested_for, confirmed_for, pickup_area, pickup_address, pickup_window, laundry_items, express, estimated_total, customer_note, staff_note, customer_response, created_at, customer_accounts ( full_name, phone )")
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
    return () => { supabase.removeChannel(channel); };
  }, [loadRequests]);

  const selected = requests.find((request) => request.id === selectedId) ?? null;
  const filtered = useMemo(() => filter === "all" ? requests : requests.filter((request) => request.request_status === filter), [filter, requests]);
  const counts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter((request) => request.request_status === "pending").length,
    waiting: requests.filter((request) => request.request_status === "needs_customer_confirmation").length,
    confirmed: requests.filter((request) => request.request_status === "confirmed").length,
  }), [requests]);

  useEffect(() => {
    if (!selected) return;
    setDecision(STAFF_DECISIONS.includes(selected.request_status) ? selected.request_status : "under_review");
    setDate(selected.confirmed_for ?? "");
    setNote(selected.staff_note ?? "");
  }, [selectedId]);

  const saveDecision = async () => {
    if (!selected) return;
    if (decision === "needs_customer_confirmation" && !date) {
      setError("Choose the proposed service date before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: reviewError } = await supabase.rpc("review_mobile_request", {
      p_request_id: selected.id,
      p_status: decision,
      p_confirmed_for: date || null,
      p_staff_note: note || null,
    });
    setSaving(false);
    if (reviewError) {
      setError("The request could not be updated. Please try again.");
      return;
    }
    await loadRequests();
  };

  return <div className="mr-page">
    <header className="mr-header">
      <div>
        <div className="mr-eyebrow"><Inbox size={14} /> MOBILE INTAKE</div>
        <h1>Mobile Requests</h1>
        <p>Laundry requests from the Chapman mobile app appear here before they become operational orders.</p>
      </div>
      <button className="mr-refresh" onClick={() => void loadRequests()} disabled={loading} aria-label="Refresh mobile requests"><RefreshCw size={16} className={loading ? "mr-spin" : ""} /> Refresh</button>
    </header>

    <section className="mr-summary" aria-label="Mobile request summary">
      <button className={filter === "all" ? "mr-summary-card active" : "mr-summary-card"} onClick={() => setFilter("all")}><span>All Laundry requests</span><strong>{counts.all}</strong></button>
      <button className={filter === "pending" ? "mr-summary-card active amber" : "mr-summary-card amber"} onClick={() => setFilter("pending")}><span>New to review</span><strong>{counts.pending}</strong></button>
      <button className={filter === "needs_customer_confirmation" ? "mr-summary-card active mint" : "mr-summary-card mint"} onClick={() => setFilter("needs_customer_confirmation")}><span>Waiting for client</span><strong>{counts.waiting}</strong></button>
      <button className={filter === "confirmed" ? "mr-summary-card active green" : "mr-summary-card green"} onClick={() => setFilter("confirmed")}><span>Confirmed</span><strong>{counts.confirmed}</strong></button>
    </section>

    <section className="mr-workspace">
      <div className="mr-list-panel">
        <div className="mr-list-heading"><div><h2>Laundry queue</h2><p>{filter === "all" ? "Every mobile Laundry request" : `${STATUS_META[filter].label} requests`}</p></div><span>{filtered.length}</span></div>
        {error ? <div className="mr-error">{error}</div> : null}
        {loading || permissionLoading ? <div className="mr-empty"><RefreshCw size={18} className="mr-spin" /><p>Loading protected requests…</p></div> : filtered.length === 0 ? <div className="mr-empty"><ClipboardList size={24} /><h3>No Laundry requests yet</h3><p>When a verified customer sends a Laundry request from the app, it will appear here.</p></div> : <div className="mr-list">
          {filtered.map((request) => {
            const status = STATUS_META[request.request_status];
            const customerName = request.customer_accounts?.full_name || "Verified customer";
            const itemCount = Array.isArray(request.laundry_items) ? request.laundry_items.reduce((total, item) => total + Number(item.quantity ?? 1), 0) : 0;
            return <button key={request.id} className={selectedId === request.id ? "mr-request selected" : "mr-request"} onClick={() => setSelectedId(request.id)}>
              <div className="mr-request-top"><span className="mr-request-id">#{request.id.slice(0, 8)}</span><span className="mr-status" style={{ color: status.color, background: status.background }}>{status.label}</span></div>
              <div className="mr-customer"><div className="mr-avatar">{customerName.slice(0, 1).toUpperCase()}</div><div><strong>{customerName}</strong><span>{request.customer_accounts?.phone || "Phone verified"}</span></div><ChevronRight size={17} /></div>
              <div className="mr-request-meta"><span><CalendarDays size={13} /> {formatDay(request.requested_for)}</span><span>{itemCount ? `${itemCount} items` : "Items to review"}</span><strong>{money(request.estimated_total)}</strong></div>
            </button>;
          })}
        </div>}
      </div>

      <aside className="mr-detail-panel" aria-live="polite">
        {!selected ? <div className="mr-detail-empty"><ShieldCheck size={26} /><h2>Select a request</h2><p>Review a customer’s Laundry details, then update its status here. Existing Orders stay separate until you create one deliberately.</p></div> : <>
          <div className="mr-detail-header"><div><span className="mr-detail-label">LAUNDRY REQUEST</span><h2>{selected.customer_accounts?.full_name || "Verified customer"}</h2><p>Received {formatCreated(selected.created_at)}</p></div><button onClick={() => setSelectedId(null)} aria-label="Close request details"><X size={18} /></button></div>
          <div className="mr-detail-status"><span className="mr-status" style={{ color: STATUS_META[selected.request_status].color, background: STATUS_META[selected.request_status].background }}>{STATUS_META[selected.request_status].label}</span>{selected.express ? <span className="mr-express">Express care</span> : null}</div>
          <div className="mr-detail-grid"><DetailItem icon={<CalendarDays size={16} />} label="Customer’s preferred date" value={formatDay(selected.requested_for)} /><DetailItem icon={<MapPin size={16} />} label="Collection area" value={selected.pickup_area || selected.pickup_address || "To be confirmed"} /><DetailItem icon={<ClipboardList size={16} />} label="Estimated total" value={money(selected.estimated_total)} /><DetailItem icon={<MessageSquareText size={16} />} label="Pickup window" value={selected.pickup_window || "To be arranged"} /></div>
          <div className="mr-section"><h3>Laundry items</h3>{Array.isArray(selected.laundry_items) && selected.laundry_items.length ? <div className="mr-items">{selected.laundry_items.map((item, index) => <span key={`${item.name}-${index}`}>{item.quantity ?? 1}× {item.name || "Laundry item"}</span>)}</div> : <p className="mr-muted">The item list will show here when the customer submits the booking.</p>}</div>
          <div className="mr-section"><h3>Customer note</h3><p className={selected.customer_note ? "mr-note" : "mr-muted"}>{selected.customer_note || "No special instructions added."}</p></div>
          <div className="mr-decision"><div><h3>Staff decision</h3><p>Propose a date for the customer to accept, or decline the request. A customer’s acceptance confirms it.</p></div><label>Status<select value={decision} onChange={(event) => setDecision(event.target.value as RequestStatus)} disabled={!canEdit || saving}><option value="under_review">Start review</option><option value="needs_customer_confirmation">Propose a date</option><option value="declined">Decline request</option></select></label>{decision === "needs_customer_confirmation" ? <label>Proposed service date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={!canEdit || saving} /></label> : null}<label>Note for customer<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a helpful update or next step" disabled={!canEdit || saving} rows={3} /></label><button className="mr-save" onClick={() => void saveDecision()} disabled={!canEdit || saving}>{saving ? "Saving…" : <><Check size={16} /> Save update</>}</button>{!canEdit ? <p className="mr-view-only">You can review this request, but only an authorised manager can change it.</p> : null}</div>
        </>}
      </aside>
    </section>
  </div>;
}

function DetailItem({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) { return <div className="mr-detail-item"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>; }

export const MobileRequests = () => <PermissionGuard path="/mobile-requests" showBanner={false}><MobileRequestsContent /></PermissionGuard>;
