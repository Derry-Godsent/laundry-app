import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Inbox, Ruler, RefreshCw, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PermissionGuard } from "../components/PermissionGuard";
import { usePermission } from "../hooks/usePermission";
import { useMediaQuery } from "../hooks/useMediaQuery";
import {
  Avatar,
  Banner,
  Button,
  Card,
  CardBody,
  CardHeader,
  DetailView,
  EmptyState,
  LoadingRows,
  PageHeader,
  RecordList,
  RecordRow,
  SegmentedControl,
} from "../components/ui";
import "./ServiceRequests.css";

/**
 * Service Requests
 *
 * Cleaning, fumigation, detailing, polytank and contract requests sent from the
 * Chapman customer app. The laundry queue has its own page, Mobile Requests.
 *
 * These arrived in the database and no staff screen read them, so customers were
 * asking for work that nobody could see. This page closes that gap.
 *
 * The page is additive: it reads and writes only quote_requests and, read-only,
 * customer_accounts. Nothing existing is altered.
 */

type AppointmentResponse = "awaiting-chapman" | "awaiting-customer" | "accepted" | "rejected" | "declined";
type RequestView = "action" | "waiting" | "accepted" | "another" | "declined";

interface QuoteDetails {
  primaryLabel?: string;
  primaryValue?: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  estimatedAreaM2?: number;
  cameraGuided?: boolean;
  estimateLabel?: string;
  serviceLocation?: string;
  selectedOptions?: string[];
  requestedDate?: string;
  cleanerCount?: string;
  cleanerGenderPreference?: string;
  cleanerExperiencePreference?: string;
  concerns?: string[];
  proposedDate?: string;
  spaceBreakdown?: Record<string, unknown> | null;
}

interface ServiceRequest {
  id: string;
  customer_account_id: string | null;
  service_id: string | null;
  service_title: string | null;
  property_type: string | null;
  preference: string | null;
  details: QuoteDetails | null;
  appointment_response: AppointmentResponse;
  declined_reason: string | null;
  created_at: string;
}

interface CustomerIdentity {
  full_name: string | null;
  phone: string | null;
}

const STATE_META: Record<AppointmentResponse, { label: string; color: string; background: string }> = {
  "awaiting-chapman": { label: "Needs a date", color: "var(--brand-400)", background: "var(--brand-soft)" },
  "awaiting-customer": { label: "With the customer", color: "var(--warn-500)", background: "var(--warn-soft)" },
  accepted: { label: "Accepted", color: "var(--ok-500)", background: "var(--ok-soft)" },
  rejected: { label: "Wants another date", color: "var(--bad-500)", background: "var(--bad-soft)" },
  declined: { label: "Not taken", color: "var(--bad-500)", background: "var(--bad-soft)" },
};

/**
 * Quick reasons staff can pick with one tap, then edit if they want. The wording
 * is what the customer reads in the app, so each one is written plainly.
 */
const QUICK_REASONS = [
  "Fully booked on your preferred dates",
  "This job needs a site visit before we can price it",
  "Outside the areas we cover right now",
];

const SERVICE_NAMES: Record<string, string> = {
  cleaning: "Deep cleaning",
  fumigation: "Fumigation",
  detailing: "Car detailing",
  polytank: "Polytank cleaning",
  contract: "Contract cleaning",
  fabric: "Fabric and carpet care",
};

const formatDay = (value: string | null | undefined) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "No date chosen";

const formatReceived = (value: string) => new Date(value).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Staff can offer a date or decline while the request is still in their hands.
 * Once a date is with the customer, or the customer has accepted, they must wait
 * for the customer rather than changing the story underneath them.
 */
const isActionable = (response: AppointmentResponse) =>
  response !== "awaiting-customer" && response !== "accepted";

const requestState = (request: ServiceRequest) => STATE_META[request.appointment_response] ?? STATE_META["awaiting-chapman"];

/** Turns "estimatedAreaM2" into "Estimated area" for the detail panel. */
const readableKey = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());

function ServiceRequestsContent() {
  const { canEdit, loading: permissionLoading } = usePermission("/service-requests");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [identities, setIdentities] = useState<Record<string, CustomerIdentity>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestView>("action");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  /**
   * Customer names and numbers are loaded separately and defensively. If the
   * protection rules ever stop staff reading that table, this page still works
   * and simply shows the request without a name, instead of failing entirely.
   */
  const loadIdentities = useCallback(async (accountIds: string[]) => {
    if (!accountIds.length) { setIdentities({}); return; }
    try {
      const { data, error: identityError } = await supabase
        .from("customer_accounts")
        .select("auth_user_id, full_name, phone")
        .in("auth_user_id", accountIds);
      if (identityError) { setIdentities({}); return; }
      const map: Record<string, CustomerIdentity> = {};
      for (const row of (data ?? []) as Array<{ auth_user_id: string; full_name: string | null; phone: string | null }>) {
        map[row.auth_user_id] = { full_name: row.full_name, phone: row.phone };
      }
      setIdentities(map);
    } catch {
      setIdentities({});
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: requestError } = await supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestError) {
      console.error("SUPABASE ERROR:", requestError);
      setError(`Could not load service requests: ${requestError.message}`);
      setRequests([]);
    } else {
      const mapped: ServiceRequest[] = (data ?? []).map((row: any) => ({
        id: row.id,
        customer_account_id: row.customer_account_id ?? null,
        service_id: row.service_id ?? null,
        service_title: row.service_title ?? null,
        property_type: row.property_type ?? null,
        preference: row.preference ?? null,
        details: (row.details ?? null) as QuoteDetails | null,
        appointment_response: (row.appointment_response || "awaiting-chapman") as AppointmentResponse,
        declined_reason: row.declined_reason ?? null,
        created_at: row.created_at,
      }));
      setRequests(mapped);
      setSelectedId((current) => (current && mapped.some((request) => request.id === current) ? current : null));
      const accountIds = Array.from(new Set(mapped.map((request) => request.customer_account_id).filter((id): id is string => Boolean(id))));
      await loadIdentities(accountIds);
    }
    setLoading(false);
  }, [loadIdentities]);

  useEffect(() => {
    void loadRequests();

    const channel = supabase
      .channel("staff-service-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quote_requests" },
        () => { void loadRequests(); }
      )
      .subscribe((status: any) => {
        if (status === "SUBSCRIBED") console.log("Staff realtime connected to quote_requests");
      });

    return () => { void supabase.removeChannel(channel); };
  }, [loadRequests]);

  /* Under 900px the record takes over the screen: the queue and the detail
     cannot share a phone. Same breakpoint as .detail-view.is-overlay. */
  const isNarrow = useMediaQuery("(max-width: 900px)");

  const selected = requests.find((request) => request.id === selectedId) ?? null;

  const counts = useMemo(() => ({
    action: requests.filter((request) => request.appointment_response === "awaiting-chapman").length,
    waiting: requests.filter((request) => request.appointment_response === "awaiting-customer").length,
    accepted: requests.filter((request) => request.appointment_response === "accepted").length,
    another: requests.filter((request) => request.appointment_response === "rejected").length,
    declined: requests.filter((request) => request.appointment_response === "declined").length,
  }), [requests]);

  const filtered = useMemo(() => requests.filter((request) => {
    if (filter === "action") return request.appointment_response === "awaiting-chapman";
    if (filter === "waiting") return request.appointment_response === "awaiting-customer";
    if (filter === "accepted") return request.appointment_response === "accepted";
    if (filter === "another") return request.appointment_response === "rejected";
    return request.appointment_response === "declined";
  }), [filter, requests]);

  useEffect(() => {
    if (!selected) return;
    const requested = selected.details?.requestedDate ? selected.details.requestedDate.slice(0, 10) : "";
    const proposed = selected.details?.proposedDate ? selected.details.proposedDate.slice(0, 10) : "";
    setDate(proposed || requested);
    setDeclineReason("");
  }, [selectedId, selected]);

  const customerName = (request: ServiceRequest) => {
    const identity = request.customer_account_id ? identities[request.customer_account_id] : undefined;
    if (identity?.full_name) return identity.full_name;
    if (identity?.phone) return identity.phone;
    return "Customer details protected";
  };

  const customerPhone = (request: ServiceRequest) => {
    const identity = request.customer_account_id ? identities[request.customer_account_id] : undefined;
    return identity?.phone ?? null;
  };

  /**
   * Sends a date to the customer for approval. The customer app reads this and
   * shows an accept or reject choice, so the loop is closed on both sides.
   */
  const sendDate = async () => {
    if (!selected) return;
    if (!date) { setError("Choose the date you want to offer before saving."); return; }
    setSaving(true);
    setError(null);
    setSavedMessage(null);

    const nextDetails = { ...(selected.details ?? {}), proposedDate: date };
    const { error: updateError } = await supabase
      .from("quote_requests")
      .update({ appointment_response: "awaiting-customer", details: nextDetails })
      .eq("id", selected.id);

    setSaving(false);
    if (updateError) {
      setError("The date could not be sent. Please try again.");
      return;
    }

    setSelectedId(null);
    setSavedMessage(`${formatDay(date)} sent to the customer. It stays in With the customer until they reply in the app.`);
    setFilter("waiting");
    await loadRequests();
  };

  /**
   * Tells the customer Chapman cannot take this request, and why. This is stored
   * on the request and the customer app shows the reason on their tracking page.
   * A request can be taken again later by offering a date, which clears nothing
   * the customer was told, so the history stays honest.
   */
  const sendDecline = async () => {
    if (!selected) return;
    const reason = declineReason.trim();
    if (reason.length < 5) { setError("Write a short reason first. The customer reads this line in the app."); return; }
    setSaving(true);
    setError(null);
    setSavedMessage(null);

    const { error: updateError } = await supabase
      .from("quote_requests")
      .update({ appointment_response: "declined", declined_reason: reason })
      .eq("id", selected.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message.toLowerCase().includes("declined_reason")
        ? "The reason box is missing from the database. Run docs/decline-with-reason.sql once, then try again."
        : "The decline could not be saved. Please try again.");
      return;
    }

    setSelectedId(null);
    setSavedMessage(`Declined. The customer now sees this reason in the app: "${reason}"`);
    setFilter("declined");
    await loadRequests();
  };

  const heading: [string, string] = filter === "action"
    ? ["Needs a date", "Requests waiting for Chapman to offer a service date"]
    : filter === "waiting"
      ? ["With the customer", "Dates offered, waiting for the customer to accept or reject"]
      : filter === "accepted"
        ? ["Accepted", "The customer approved the date, ready for the next Chapman step"]
        : filter === "another"
          ? ["Wants another date", "The customer asked for a different date and needs a new offer"]
          : ["Not taken", "Chapman could not take these requests. The customer has been told why"];

  return <div className="sr-page">
    <PageHeader
      eyebrow={<><Inbox size={13} /> App intake</>}
      title="Service Requests"
      subtitle="Cleaning, fumigation, detailing, polytank and contract requests sent from the Chapman app."
      actions={
        <Button
          variant="secondary"
          leadingIcon={<RefreshCw size={15} className={loading ? "sr-spin" : ""} />}
          onClick={() => void loadRequests()}
          disabled={loading}
        >
          Refresh
        </Button>
      }
    />

    <SegmentedControl<RequestView>
      ariaLabel="Service request views"
      value={filter}
      onChange={setFilter}
      options={[
        { value: "action", label: "Needs a date", count: counts.action },
        { value: "waiting", label: "With the customer", count: counts.waiting },
        { value: "accepted", label: "Accepted", count: counts.accepted },
        { value: "another", label: "Wants another date", count: counts.another },
        { value: "declined", label: "Not taken", count: counts.declined },
      ]}
      className="sr-views"
    />

    {savedMessage ? (
      <Banner tone="ok" role="status" className="sr-feedback">{savedMessage}</Banner>
    ) : null}
    {error ? (
      <Banner tone="bad" role="alert" className="sr-feedback">{error}</Banner>
    ) : null}

    <section className="sr-workspace">
      <Card className="sr-list-panel">
        <CardHeader
          title={heading[0]}
          subtitle={heading[1]}
          actions={<span className="tag-count">{filtered.length}</span>}
        />

        <CardBody tight className="sr-list-body">
          {loading || permissionLoading ? (
            <LoadingRows rows={4} label="Loading service requests" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={20} />}
              title="No requests in this view"
              message="New app requests appear here the moment a customer sends one."
              action={requests.length === 0 ? (
                <p className="sr-hint">
                  If a customer has already sent one and it is not here, the database may not be
                  letting staff read these records yet. Running the statement file
                  {" "}<strong>docs/security-fix.sql</strong>, section 4, switches that on.
                </p>
              ) : undefined}
            />
          ) : (
            <RecordList label={heading[0]} className="sr-list">
              {filtered.map((request) => {
                const state = requestState(request);
                const area = request.details?.estimatedAreaM2;
                return (
                  <RecordRow
                    key={request.id}
                    className="sr-record"
                    selected={selectedId === request.id}
                    onClick={() => setSelectedId(request.id)}
                    aria-label={`Open request ${request.id.slice(0, 8)} from ${customerName(request)}`}
                    lead={<Avatar name={customerName(request)} size="md" />}
                    title={request.service_title || SERVICE_NAMES[request.service_id ?? ""] || "Service request"}
                    subtitle={`#${request.id.slice(0, 8)} · ${customerName(request)}`}
                    meta={[
                      <><CalendarDays size={12} /> {formatDay(request.details?.requestedDate?.slice(0, 10))}</>,
                      <>{area ? `${area} m2 measured` : "No measurement"}</>,
                    ]}
                    trail={<span className="sr-status" style={{ color: state.color, background: state.background }}>{state.label}</span>}
                  />
                );
              })}
            </RecordList>
          )}
        </CardBody>
      </Card>

      <div className="sr-detail-wrap" aria-live="polite">
        {!selected ? (
          <Card className="sr-detail-empty-card">
            <EmptyState
              icon={<ShieldCheck size={22} />}
              title="Select a request"
              message="Review what the customer asked for, then offer a date. The customer accepts or rejects it in the app, and the answer appears here."
            />
          </Card>
        ) : (
          <DetailView
            key={selected.id}
            className="sr-detail"
            variant={isNarrow ? "overlay" : "inline"}
            onClose={() => setSelectedId(null)}
            title={selected.service_title || SERVICE_NAMES[selected.service_id ?? ""] || "Service request"}
            subtitle={`Received ${formatReceived(selected.created_at)}`}
            footer={
              isActionable(selected.appointment_response) ? (
                <>
                  {selected.appointment_response === "declined" ? null : (
                    <Button
                      variant="danger"
                      onClick={() => void sendDecline()}
                      disabled={!canEdit || saving}
                    >
                      {saving ? "Saving..." : "Decline"}
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    block
                    onClick={() => void sendDate()}
                    disabled={!canEdit || saving}
                  >
                    {saving ? "Sending..." : "Send this date"}
                  </Button>
                </>
              ) : undefined
            }
          >
            <div className="sr-detail-status">
              <span className="sr-status" style={{ color: requestState(selected).color, background: requestState(selected).background }}>{requestState(selected).label}</span>
              {selected.details?.cameraGuided ? <span className="sr-tag">Camera guided</span> : null}
            </div>

            <div className="sr-detail-grid">
              <DetailItem icon={<CalendarDays size={16} />} label="Customer's preferred date" value={formatDay(selected.details?.requestedDate?.slice(0, 10))} />
              <DetailItem icon={<ClipboardList size={16} />} label="Property" value={selected.property_type || "Not stated"} />
              <DetailItem icon={<SlidersHorizontal size={16} />} label="Preference" value={selected.preference || "Not stated"} />
              <DetailItem icon={<Ruler size={16} />} label="Measured area" value={selected.details?.estimatedAreaM2 ? `${selected.details.estimatedAreaM2} m2` : "Not measured"} />
              <DetailItem icon={<ClipboardList size={16} />} label="Customer" value={customerName(selected)} />
              <DetailItem icon={<ClipboardList size={16} />} label="Phone" value={customerPhone(selected) ?? "Protected in the app"} />
            </div>

            {selected.details?.estimateLabel ? <div className="sr-section"><h3>Estimate shown to the customer</h3><p className="sr-note">{selected.details.estimateLabel}</p></div> : null}

            {selected.details?.concerns && selected.details.concerns.length > 0
              ? <div className="sr-section"><h3>What the customer told us</h3><div className="sr-chips">{selected.details.concerns.map((concern, index) => <span key={`${concern}-${index}`}>{concern}</span>)}</div></div>
              : null}

            {selected.details?.selectedOptions && selected.details.selectedOptions.length > 0
              ? <div className="sr-section"><h3>Areas chosen</h3><div className="sr-chips">{selected.details.selectedOptions.map((option, index) => <span key={`${option}-${index}`}>{option}</span>)}</div></div>
              : null}

            {selected.service_id === "contract" && (selected.details?.cleanerCount || selected.details?.cleanerGenderPreference || selected.details?.cleanerExperiencePreference)
              ? <div className="sr-section"><h3>Team requested</h3><p className="sr-note">
                {[selected.details?.cleanerCount, selected.details?.cleanerGenderPreference, selected.details?.cleanerExperiencePreference].filter(Boolean).join(" | ")}
              </p></div>
              : null}

            {selected.details?.spaceBreakdown
              ? <div className="sr-section"><h3>Room by room</h3><div className="sr-grid">
                {Object.entries(selected.details.spaceBreakdown)
                  .filter(([key, value]) => key !== "description" && value !== undefined && value !== null && value !== "")
                  .map(([key, value]) => <div className="sr-grid-item" key={key}><small>{readableKey(key)}</small><strong>{Array.isArray(value) ? value.join(", ") : String(value)}</strong></div>)}
              </div></div>
              : null}

            {selected.appointment_response === "declined" ? (
              <div className="sr-declined-box">
                <h3>Chapman said no to this request</h3>
                <p className="sr-note">The customer saw this line in the app: "{selected.declined_reason || "no reason was written"}"</p>
                <p className="sr-muted-small">You can still take the work. Offering a date below puts the request back in the customer's hands with a new date to accept.</p>
              </div>
            ) : null}

            {isActionable(selected.appointment_response) ? (
              <>
                <div className="sr-decision">
                  <div>
                    <h3>{selected.appointment_response === "rejected" ? "Offer a new date" : selected.appointment_response === "declined" ? "Take the work after all" : "Offer a service date"}</h3>
                    <p>The customer sees this date in the app and accepts or rejects it. {selected.appointment_response === "rejected" ? "They already asked for a different date." : "Starting from their preferred date is usually fastest."}</p>
                  </div>
                  <label>Date to offer<input type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={!canEdit || saving} /></label>
                  <p className="sr-bar-hint">Send this date is at the foot of this panel.</p>
                </div>

                {selected.appointment_response === "declined" ? null : (
                  <div className="sr-decision sr-decision-decline">
                    <div>
                      <h3>Or decline it, with a reason</h3>
                      <p>The customer reads your reason in the app, so write it the way you would say it to them. One line is enough.</p>
                    </div>
                    <div className="sr-reasons">
                      {QUICK_REASONS.map((quick) => (
                        <button key={quick} type="button" className={declineReason === quick ? "sr-reason-chip active" : "sr-reason-chip"} onClick={() => setDeclineReason(quick)} disabled={!canEdit || saving}>{quick}</button>
                      ))}
                    </div>
                    <label>Reason the customer will read<textarea value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} placeholder="For example: We are fully booked on the dates you chose. Send a request for the following week and we will take it." disabled={!canEdit || saving} rows={3} /></label>
                    <p className="sr-bar-hint">Decline is at the foot of this panel.</p>
                    {!canEdit ? <p className="sr-view-only">You can review this request, but only an authorised manager can decline it.</p> : null}
                  </div>
                )}
              </>
            ) : (
              <div className="sr-section">
                <h3>{selected.appointment_response === "accepted" ? "Accepted by the customer" : "Waiting for the customer"}</h3>
                <p className="sr-note">
                  {selected.appointment_response === "accepted"
                    ? `The customer accepted ${formatDay(selected.details?.proposedDate?.slice(0, 10))}. Create the order when the team is ready.`
                    : `Chapman offered ${formatDay(selected.details?.proposedDate?.slice(0, 10))}. The answer appears here as soon as the customer replies in the app.`}
                </p>
              </div>
            )}
          </DetailView>
        )}
      </div>
    </section>
  </div>;
}
function DetailItem({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) {
  return <div className="sr-detail-item"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

export const ServiceRequests = () => <PermissionGuard path="/service-requests" showBanner={false}><ServiceRequestsContent /></PermissionGuard>;
