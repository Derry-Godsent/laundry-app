import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Check, ChevronRight, ClipboardList, ExternalLink, Inbox,
  MapPin, MessageSquareText, Phone, RefreshCw, ShieldCheck, Smartphone, User, X,
} from "lucide-react";
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
  StatusPill,
} from "../components/ui";
import type { PillTone } from "../components/ui";
import "./MobileRequests.css";

type RequestStatus = "pending" | "under_review" | "needs_customer_confirmation" | "confirmed" | "declined" | "cancelled" | "converted";
type RequestView = "active" | "waiting" | "confirmed" | "declined";

interface MobileRequest {
  id: string;
  client_id: string | null;
  customer_account_id: string | null;
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

interface StatusMeta {
  label: string;
  tone: PillTone;
}

/* One label vocabulary for the whole queue: the same words appear on the
   summary control, the list card and the detail header. */
const STATUS_META: Record<RequestStatus, StatusMeta> = {
  pending: { label: "New", tone: "brand" },
  under_review: { label: "Reviewing", tone: "warn" },
  needs_customer_confirmation: { label: "Waiting for client", tone: "info" },
  confirmed: { label: "Approved", tone: "ok" },
  declined: { label: "Declined", tone: "bad" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  converted: { label: "Order created", tone: "violet" },
};

const VIEW_COPY: Record<RequestView, { title: string; sub: string; empty: string }> = {
  active: {
    title: "Needs action",
    sub: "Requests waiting for Chapman to review, confirm or decline",
    empty: "New client requests appear here the moment they are submitted.",
  },
  waiting: {
    title: "Waiting for client",
    sub: "A date has been proposed and the client has not answered yet",
    empty: "Proposed dates stay here until the client responds in the app.",
  },
  confirmed: {
    title: "Approved work",
    sub: "The client's date is agreed, ready for operational follow-through",
    empty: "Approved requests remain visible here for follow-through.",
  },
  declined: {
    title: "Declined history",
    sub: "Final declines kept as a clear record, no action required",
    empty: "Declined and cancelled requests are kept here as history.",
  },
};

const formatDay = (value: string | null) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" }) : "No date chosen";

const formatCreated = (value: string) =>
  new Date(value).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const money = (value: number | string | null) =>
  value === null ? "Estimate pending" : `₵${Number(value).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const isActiveWork = (status: RequestStatus) => status === "pending" || status === "under_review";

const requestMeta = (request: MobileRequest): StatusMeta =>
  request.request_status === "declined" && request.customer_response === "rejected"
    ? { label: "Client rejected", tone: "bad" }
    : STATUS_META[request.request_status];

const itemCountOf = (request: MobileRequest) =>
  Array.isArray(request.laundry_items)
    ? request.laundry_items.reduce((total, item) => total + Number(item.quantity ?? 1), 0)
    : 0;

/* Who the request belongs to.
 *
 * The row holds the ids but not the names: the embedded read of
 * customer_accounts is not a relationship the console can follow from this
 * table, so the account behind an id is fetched separately, the same way the
 * service-request queue does it. The linked client record is the second
 * source, because the customer app writes one on the first booking. Both reads
 * fail soft: a request is still worth handling when the name cannot be read,
 * and the cell then says so instead of claiming a verification nobody made.
 */
type CustomerIdentity = { full_name: string | null; phone: string | null };
type IdentityMap = Record<string, CustomerIdentity>;

const identityOf = (
  request: MobileRequest,
  accounts: IdentityMap,
  clients: IdentityMap
): CustomerIdentity => {
  const account = request.customer_account_id ? accounts[request.customer_account_id] : undefined;
  if (account) return account;
  const client = request.client_id ? clients[request.client_id] : undefined;
  if (client) return client;
  return {
    full_name: request.customer_accounts?.full_name ?? null,
    phone: request.customer_accounts?.phone ?? null,
  };
};

const customerNameOf = (request: MobileRequest, accounts: IdentityMap, clients: IdentityMap) =>
  identityOf(request, accounts, clients).full_name?.trim() || "Name not readable";

const customerPhoneOf = (request: MobileRequest, accounts: IdentityMap, clients: IdentityMap) =>
  identityOf(request, accounts, clients).phone?.trim() || "No number on file";

function MobileRequestsContent() {
  const { canEdit, loading: permissionLoading } = usePermission("/mobile-requests");

  /* Under this width the queue and the record cannot share the screen: the
     record takes over with its own Back button. Same breakpoint as the
     .detail-view overlay rule, so the behaviour and the style agree. */
  const isNarrow = useMediaQuery("(max-width: 900px)");
  const [requests, setRequests] = useState<MobileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestView>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<IdentityMap>({});
  const [clientRecords, setClientRecords] = useState<IdentityMap>({});
  const [decision, setDecision] = useState<RequestStatus>("needs_customer_confirmation");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  /* Names and numbers for the ids on the queue, in two reads. A failure here
     never stops the queue from loading. */
  const loadIdentities = useCallback(async (accountIds: string[], clientIds: string[]) => {
    if (accountIds.length) {
      const { data, error } = await supabase
        .from("customer_accounts")
        .select("auth_user_id, full_name, phone")
        .in("auth_user_id", accountIds);
      if (!error) {
        const map: IdentityMap = {};
        for (const row of (data ?? []) as Array<{ auth_user_id: string; full_name: string | null; phone: string | null }>) {
          map[row.auth_user_id] = { full_name: row.full_name, phone: row.phone };
        }
        setAccounts(map);
      } else {
        console.warn("Customer accounts could not be read:", error.message);
      }
    }

    if (clientIds.length) {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone")
        .in("id", clientIds);
      if (!error) {
        const map: IdentityMap = {};
        for (const row of (data ?? []) as Array<{ id: string; name: string | null; phone: string | null }>) {
          map[row.id] = { full_name: row.name, phone: row.phone };
        }
        setClientRecords(map);
      } else {
        console.warn("Client records could not be read:", error.message);
      }
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: requestError } = await supabase
      .from("mobile_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestError) {
      console.error("SUPABASE ERROR:", requestError);
      setError(`Could not load requests: ${requestError.message}`);
      setRequests([]);
    } else {
      // Map the row onto the shape the queue renders. If the row carries the
      // customer relationship it is kept, so the queue can show a real name.
      const mappedData = (data ?? []).map((req: any) => ({
        id: req.id,
        client_id: req.client_id || null,
        customer_account_id: req.customer_account_id || null,
        request_status: (req.request_status || "pending").toLowerCase() as RequestStatus,
        requested_for: req.requested_for || null,
        confirmed_for: req.confirmed_for || null,
        pickup_area: req.pickup_area || null,
        pickup_address: req.pickup_address || null,
        pickup_window: req.pickup_window || null,
        pickup_latitude: req.pickup_latitude || null,
        pickup_longitude: req.pickup_longitude || null,
        pickup_accuracy_meters: req.pickup_accuracy_meters || null,
        laundry_items: req.laundry_items || [],
        express: req.express || false,
        estimated_total: req.estimated_total ?? null,
        customer_note: req.customer_note || null,
        staff_note: req.staff_note || null,
        customer_response: req.customer_response || null,
        created_at: req.created_at,
        customer_accounts: req.customer_accounts || null,
      }));

      setRequests(mappedData);
      setSelectedId((current) => current && mappedData.some((req: MobileRequest) => req.id === current) ? current : null);

      const accountIds = Array.from(new Set(mappedData.map((row: MobileRequest) => row.customer_account_id).filter(Boolean))) as string[];
      const clientIds = Array.from(new Set(mappedData.map((row: MobileRequest) => row.client_id).filter(Boolean))) as string[];
      await loadIdentities(accountIds, clientIds);
    }
    setLoading(false);
  }, [loadIdentities]);

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      const status = request.request_status;
      if (filter === "active") return status === "pending" || status === "under_review";
      if (filter === "waiting") return status === "needs_customer_confirmation";
      if (filter === "confirmed") return status === "confirmed" || status === "converted";
      return status === "declined" || status === "cancelled";
    });
  }, [filter, requests]);

  useEffect(() => {
    void loadRequests();

    const channel = supabase
      .channel("mobile-laundry-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mobile_requests" },
        () => {
          void loadRequests();
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          console.info("Staff realtime connected to mobile_requests");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadRequests]);

  const selected = requests.find((request) => request.id === selectedId) ?? null;

  const counts = useMemo(() => ({
    active: requests.filter((request) => isActiveWork(request.request_status)).length,
    waiting: requests.filter((request) => request.request_status === "needs_customer_confirmation").length,
    confirmed: requests.filter((request) => request.request_status === "confirmed" || request.request_status === "converted").length,
    declined: requests.filter((request) => request.request_status === "declined" || request.request_status === "cancelled").length,
  }), [requests]);

  useEffect(() => {
    if (!selected || !isActiveWork(selected.request_status)) return;
    setDecision("needs_customer_confirmation");
    setDate(selected.requested_for ?? "");
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

    const updatePayload: Record<string, unknown> = {
      request_status: decision,
      staff_note: note || null,
      reviewed_at: new Date().toISOString(),
    };

    if (decision === "needs_customer_confirmation") {
      updatePayload.confirmed_for = date; // Use confirmed_for for proposed date
    } else if (decision === "confirmed") {
      updatePayload.confirmed_for = selected.requested_for; // Confirm the client's date
    }

    const { error: updateError } = await supabase
      .from("mobile_requests")
      .update(updatePayload)
      .eq("id", selected.id);

    setSaving(false);
    if (updateError) {
      setError("The request could not be updated. Please try again.");
      return;
    }

    setSelectedId(null);
    setSavedMessage(
      decision === "declined"
        ? "Request declined. It remains in Declined history as a final record."
        : decision === "confirmed"
          ? "Client date approved. It remains in Approved work for the next Chapman step."
          : "New date sent. It remains in Waiting for client until the client responds."
    );
    setFilter(decision === "declined" ? "declined" : decision === "confirmed" ? "confirmed" : "waiting");
    await loadRequests();
  };

  const copy = VIEW_COPY[filter];

  return (
    <div className="page">
      <PageHeader
        eyebrow={<><Smartphone size={13} /> Mobile intake</>}
        title="Mobile Requests"
        actions={
          <Button
            variant="secondary"
            leadingIcon={<RefreshCw size={15} className={loading ? "spin" : ""} />}
            onClick={() => void loadRequests()}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      <SegmentedControl<RequestView>
        ariaLabel="Request views"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "active", label: "Needs action", count: counts.active },
          { value: "waiting", label: "Waiting for client", count: counts.waiting },
          { value: "confirmed", label: "Approved work", count: counts.confirmed },
          { value: "declined", label: "Declined history", count: counts.declined },
        ]}
        className="mr-views"
      />

      {savedMessage ? (
        <Banner tone="ok" role="status" className="mr-feedback">{savedMessage}</Banner>
      ) : null}
      {error ? (
        <Banner tone="bad" role="alert" className="mr-feedback">{error}</Banner>
      ) : null}

      <section className="mr-workspace">
        <Card className="mr-list-panel">
          <CardHeader title={copy.title} subtitle={copy.sub} actions={<span className="tag-count">{filtered.length}</span>} />

          <CardBody tight className="mr-list-body">
            {loading || permissionLoading ? (
              <LoadingRows rows={4} label="Loading requests" />
            ) : filtered.length === 0 ? (
              <EmptyState icon={<ClipboardList size={20} />} title="No requests in this view" message={copy.empty} />
            ) : (
              <RecordList label={copy.title} className="mr-list">
                {filtered.map((request) => {
                  const status = requestMeta(request);
                  const items = itemCountOf(request);
                  const active = selectedId === request.id;

                  return (
                    <RecordRow
                      key={request.id}
                      className="mr-record"
                      selected={active}
                      onClick={() => setSelectedId(request.id)}
                      aria-label={`Open request ${request.id.slice(0, 8)} for ${customerNameOf(request, accounts, clientRecords)}`}
                      lead={<Avatar name={customerNameOf(request, accounts, clientRecords)} size="md" />}
                      title={customerNameOf(request, accounts, clientRecords)}
                      subtitle={`#${request.id.slice(0, 8)} · ${customerPhoneOf(request, accounts, clientRecords)}`}
                      meta={[
                        <><CalendarDays size={12} /> {formatDay(request.requested_for)}</>,
                        <><ClipboardList size={12} /> {items ? `${items} items` : "Items to review"}</>,
                        <strong key="total" className="mr-record__total">{money(request.estimated_total)}</strong>,
                      ]}
                      trail={
                        <>
                          {request.express ? <StatusPill tone="gold">Express</StatusPill> : null}
                          <StatusPill tone={status.tone} dot>{status.label}</StatusPill>
                        </>
                      }
                    />
                  );
                })}
              </RecordList>
            )}
          </CardBody>
        </Card>

        <div className="mr-detail" aria-live="polite">
          {!selected ? (
            <Card className="mr-detail-empty">
              <EmptyState
                icon={<ShieldCheck size={22} />}
                title="Select a request"
                message="Review the client's details, then confirm their date, propose a new one, or decline. Mobile requests stay separate from Orders until Chapman deliberately creates one."
              />
            </Card>
          ) : (
            <DetailView
              key={selected.id}
              className="mr-detail-card"
              variant={isNarrow ? "overlay" : "inline"}
              onClose={() => setSelectedId(null)}
              title={customerNameOf(selected, accounts, clientRecords)}
              subtitle={`Laundry request · #${selected.id.slice(0, 8)} · received ${formatCreated(selected.created_at)}`}
              actions={
                <>
                  <StatusPill tone={requestMeta(selected).tone} dot>{requestMeta(selected).label}</StatusPill>
                  {isNarrow ? null : (
                    <Button variant="ghost" size="sm" iconOnly onClick={() => setSelectedId(null)} aria-label="Close request details">
                      <X size={16} />
                    </Button>
                  )}
                </>
              }
              footer={
                isActiveWork(selected.request_status) ? (
                  <>
                    <span className="mr-action-note">
                      {decision === "confirmed"
                        ? "Approves the client's own date"
                        : decision === "declined"
                          ? "Closes the request"
                          : "Sends the date you choose"}
                    </span>
                    <Button
                      variant="primary"
                      block
                      onClick={() => void saveDecision()}
                      disabled={!canEdit || saving}
                      leadingIcon={<Check size={16} />}
                    >
                      {saving ? "Saving…" : decision === "confirmed" ? "Confirm date" : decision === "declined" ? "Decline request" : "Send date"}
                    </Button>
                  </>
                ) : undefined
              }
            >
              <div className="mr-detail-body">
                <CardBody>
                  <div className="meta-grid">
                    <DetailItem icon={<User size={15} />} label="Customer" value={customerNameOf(selected, accounts, clientRecords)} />
                    <DetailItem icon={<Phone size={15} />} label="Phone number" value={customerPhoneOf(selected, accounts, clientRecords)} />
                    <DetailItem icon={<CalendarDays size={15} />} label="Client's preferred date" value={formatDay(selected.requested_for)} />
                    <DetailItem icon={<CalendarDays size={15} />} label="Date proposed to client" value={selected.confirmed_for ? formatDay(selected.confirmed_for) : "None yet"} />
                    <DetailItem icon={<MapPin size={15} />} label="Collection area" value={selected.pickup_area || selected.pickup_address || "To be confirmed"} />
                    <DetailItem icon={<ClipboardList size={15} />} label="Estimated total" value={money(selected.estimated_total)} />
                    <DetailItem icon={<MessageSquareText size={15} />} label="Pickup window" value={selected.pickup_window || "To be arranged"} />
                    <DetailItem icon={<Smartphone size={15} />} label="Client response" value={selected.customer_response ? (selected.customer_response === "accepted" ? "Accepted the date" : "Rejected the date") : "Not answered yet"} />
                  </div>
                </CardBody>

              <Card>
                <CardHeader title="Pickup location" subtitle="Only shared by the client for this request" />
                <CardBody>
                  {selected.pickup_latitude !== null && selected.pickup_latitude !== undefined && selected.pickup_longitude !== null && selected.pickup_longitude !== undefined ? (
                    <p className="mr-note">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${selected.pickup_latitude},${selected.pickup_longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mr-map-link"
                      >
                        Open client-shared pickup point <ExternalLink size={12} />
                      </a>
                    </p>
                  ) : (
                    <p className="mr-muted">No map point shared. Use the client's area and landmark to arrange pickup.</p>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Laundry items" subtitle={itemCountOf(selected) ? `${itemCountOf(selected)} items requested` : undefined} />
                <CardBody>
                  {Array.isArray(selected.laundry_items) && selected.laundry_items.length ? (
                    <div className="mr-items">
                      {selected.laundry_items.map((item, index) => (
                        <span key={`${item.name}-${index}`}>{item.quantity ?? 1}× {item.name || "Laundry item"}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="mr-muted">The item list appears here when the customer submits the booking.</p>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Notes" subtitle="What the client asked for, and what the office recorded" />
                <CardBody className="mr-notes">
                  <div>
                    <span className="mr-note-label">Customer note</span>
                    <p className={selected.customer_note ? "mr-note" : "mr-muted"}>
                      {selected.customer_note || "No special instructions added."}
                    </p>
                  </div>
                  <div>
                    <span className="mr-note-label">Staff note</span>
                    <p className={selected.staff_note ? "mr-note" : "mr-muted"}>
                      {selected.staff_note || "Nothing recorded yet."}
                    </p>
                  </div>
                </CardBody>
              </Card>

              {isActiveWork(selected.request_status) ? (
                <Card className="mr-decision">
                  <CardHeader
                    title="Staff decision"
                    subtitle="Confirm uses the client's selected date automatically. Propose a date only when Chapman must offer a different option."
                  />
                  <CardBody className="mr-decision-body">
                    <label className="field">
                      <span className="field__label">Status</span>
                      <select
                        className="select"
                        value={decision}
                        onChange={(event) => setDecision(event.target.value as RequestStatus)}
                        disabled={!canEdit || saving}
                      >
                        <option value="needs_customer_confirmation">Propose a date</option>
                        <option value="confirmed">Confirm client date</option>
                        <option value="declined">Decline request</option>
                      </select>
                    </label>

                    {decision === "needs_customer_confirmation" ? (
                      <label className="field">
                        <span className="field__label">Proposed service date</span>
                        <input
                          className="input"
                          type="date"
                          value={date}
                          onChange={(event) => setDate(event.target.value)}
                          disabled={!canEdit || saving}
                        />
                      </label>
                    ) : null}

                    <label className="field">
                      <span className="field__label">Note for customer</span>
                      <textarea
                        className="textarea"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Add a helpful update or next step"
                        disabled={!canEdit || saving}
                        rows={3}
                      />
                    </label>

                    {!canEdit ? (
                      <p className="mr-view-only">You can review this request, but only an authorised manager can change it.</p>
                    ) : null}
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardHeader
                    title={
                      selected.request_status === "needs_customer_confirmation"
                        ? "Waiting for the client"
                        : selected.request_status === "confirmed" || selected.request_status === "converted"
                          ? "Approved work"
                          : "Final declined record"
                    }
                  />
                  <CardBody>
                    <p className="mr-note">
                      {selected.request_status === "needs_customer_confirmation"
                        ? "The client must respond in the Chapman app. No staff action is needed until then."
                        : selected.request_status === "confirmed" || selected.request_status === "converted"
                          ? "Keep this request visible here while Chapman continues with order creation and specialist assignment."
                          : selected.customer_response === "rejected"
                            ? "The client rejected the proposed date. This request is closed and needs no further action."
                            : "Chapman declined this request. It remains as a final history record."}
                    </p>
                  </CardBody>
                </Card>
              )}
              </div>
            </DetailView>
          )}
        </div>
      </section>

      <p className="mr-footnote">
        <Inbox size={13} /> Live queue: new requests and client replies appear without refreshing.
      </p>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) {
  return (
    <div className="meta-item">
      <span className="meta-item__icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export const MobileRequests = () => (
  <PermissionGuard path="/mobile-requests" showBanner={false}>
    <MobileRequestsContent />
  </PermissionGuard>
);
