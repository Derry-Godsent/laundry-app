import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, KeyRound, RefreshCw, Search, ShieldCheck, Smartphone, UserCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PermissionGuard } from "../components/PermissionGuard";
import { usePermission } from "../hooks/usePermission";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { DetailView, EmptyState, LoadingRows } from "../components/ui";
import "./AppAccounts.css";

/**
 * App Accounts
 *
 * Who has signed into the CPL app, and every security moment recorded on
 * their account: a sign-in, a PIN set, a PIN removed, a PIN used up.
 *
 * The app writes these notes itself. Until now no staff screen read them, so a
 * customer setting up or dropping their app PIN left a trail nobody could see.
 * The office now has the same picture as the customer.
 *
 * What is deliberately absent: the four digits. No PIN, no hash, nothing that
 * would help anyone guess. These rows say only what happened and when.
 *
 * If the security table has not been created in this project yet, the customer
 * list still works and the history says so plainly.
 */

type EventKind = "sign_in" | "pin_set" | "pin_removed" | "pin_used_up";

interface AppCustomer {
  auth_user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  client_id: string | null;
}

/* What this customer has asked for, from both intake queues.
 *
 * Every app relationship starts as one of these, so an account on its own is
 * half a picture: the office also needs to know whether the person is waiting
 * on something. The two tables link to the account by `customer_account_id`,
 * which is the same key the queues themselves use. */
export interface CustomerAsk {
  id: string;
  kind: "laundry" | "service";
  label: string;
  state: string;
  tone: "waiting" | "live" | "done";
  /** When the customer asked. Ordering is on this for both queues: a laundry
   *  request's preferred pickup date is a different kind of time from a service
   *  enquiry's arrival, and mixing the two would order the list by nothing. */
  askedAt: string;
}

const LAUNDRY_STATE: Record<string, { label: string; tone: CustomerAsk["tone"] }> = {
  pending: { label: "Waiting for CPL", tone: "waiting" },
  under_review: { label: "Being reviewed", tone: "live" },
  needs_customer_confirmation: { label: "With the customer", tone: "live" },
  confirmed: { label: "Date agreed", tone: "done" },
  converted: { label: "Turned into an order", tone: "done" },
  declined: { label: "Closed by the customer", tone: "done" },
  cancelled: { label: "Cancelled", tone: "done" },
};

const SERVICE_STATE: Record<string, { label: string; tone: CustomerAsk["tone"] }> = {
  "awaiting-chapman": { label: "Waiting for a date from CPL", tone: "waiting" },
  "awaiting-customer": { label: "With the customer", tone: "live" },
  accepted: { label: "Date accepted", tone: "done" },
  rejected: { label: "Wants another date", tone: "waiting" },
  declined: { label: "Not taken up", tone: "done" },
};

/** Rows in, what the office reads out. Pure, so the probe can check it. */
export const mapAsks = (laundry: any[], service: any[]): CustomerAsk[] => {
  const asks: CustomerAsk[] = [];

  for (const row of laundry) {
    const state = LAUNDRY_STATE[row.request_status] ?? { label: row.request_status || "Recorded", tone: "live" as const };
    asks.push({
      id: `laundry-${row.id}`,
      kind: "laundry",
      label: [
        "Laundry pickup",
        row.estimated_total ? `about GH₵${Number(row.estimated_total).toFixed(2)}` : "",
        row.requested_for ? `for ${row.requested_for}` : "",
      ].filter(Boolean).join(", "),
      state: state.label,
      tone: state.tone,
      askedAt: row.created_at,
    });
  }

  for (const row of service) {
    const state = SERVICE_STATE[row.appointment_response] ?? { label: row.appointment_response || "Recorded", tone: "live" as const };
    asks.push({
      id: `service-${row.id}`,
      kind: "service",
      label: row.service_title ? `${row.service_title} request` : "Service request",
      state: state.label,
      tone: state.tone,
      askedAt: row.created_at,
    });
  }

  return asks.sort((left, right) => new Date(right.askedAt).getTime() - new Date(left.askedAt).getTime());
};

interface SecurityEvent {
  id: string;
  auth_user_id: string;
  kind: EventKind;
  created_at: string;
}

const KIND_META: Record<EventKind, { label: string; sentence: string; color: string; background: string }> = {
  sign_in: { label: "Signed in", sentence: "Opened their account with a code sent to their phone", color: "var(--brand-400)", background: "var(--brand-soft)" },
  pin_set: { label: "PIN set", sentence: "Added a 4 digit PIN to their phone", color: "var(--ok-500)", background: "var(--ok-soft)" },
  pin_removed: { label: "PIN removed", sentence: "Gave up the PIN, or asked to forget it", color: "var(--warn-500)", background: "var(--warn-soft)" },
  pin_used_up: { label: "PIN used up", sentence: "Five wrong tries, so the PIN was deleted", color: "var(--bad-500)", background: "var(--bad-soft)" },
};

const formatMoment = (value: string) =>
  new Date(value).toLocaleString("en-GH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

const isMissingTable = (error: { code?: string } | null) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205");

function AppAccountsContent() {
  usePermission("/app-accounts");
  const [customers, setCustomers] = useState<AppCustomer[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyOff, setHistoryOff] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [asks, setAsks] = useState<CustomerAsk[]>([]);
  const [asksNote, setAsksNote] = useState<string | null>(null);
  const [asksLoading, setAsksLoading] = useState(false);

  const loadEverything = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [{ data: people, error: peopleError }, { data: notes, error: notesError }] = await Promise.all([
      supabase
        .from("customer_accounts")
        .select("auth_user_id, full_name, phone, created_at, client_id")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("chapman_app_security_events")
        .select("id, auth_user_id, kind, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (peopleError) {
      setError(`Could not load app accounts: ${peopleError.message}`);
      setCustomers([]);
    } else {
      setCustomers((people ?? []) as AppCustomer[]);
    }

    if (notesError) {
      setHistoryOff(isMissingTable(notesError));
      if (!isMissingTable(notesError)) setError(`Could not load the security history: ${notesError.message}`);
      setEvents([]);
    } else {
      setHistoryOff(false);
      setEvents((notes ?? []) as SecurityEvent[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadEverything();

    const channel = supabase
      .channel("staff-app-accounts")
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_accounts" }, () => { void loadEverything(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "chapman_app_security_events" }, () => { void loadEverything(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadEverything]);

  /* What this one customer has asked for. Read when an account is opened rather
     than for the whole list, so the page never pulls every request in the
     system to decorate a name. */
  const loadAsks = useCallback(async (accountId: string) => {
    setAsksLoading(true);
    setAsksNote(null);

    const [laundry, service] = await Promise.all([
      supabase
        .from("mobile_requests")
        .select("id, request_status, requested_for, estimated_total, created_at")
        .eq("customer_account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("quote_requests")
        .select("id, service_title, appointment_response, created_at")
        .eq("customer_account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (laundry.error && service.error) {
      setAsks([]);
      setAsksNote(`Their requests could not be read: ${laundry.error.message}`);
    } else {
      if (laundry.error) console.warn("Could not read this customer's laundry requests:", laundry.error.message);
      if (service.error) console.warn("Could not read this customer's service requests:", service.error.message);
      setAsks(mapAsks(laundry.data ?? [], service.data ?? []));
      if (laundry.error || service.error) setAsksNote("One of the two queues could not be read, so this list may be short.");
    }

    setAsksLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedId) { setAsks([]); setAsksNote(null); return; }
    void loadAsks(selectedId);
  }, [selectedId, loadAsks]);

  const byCustomer = useMemo(() => {
    const grouped = new Map<string, SecurityEvent[]>();
    events.forEach((note) => {
      const list = grouped.get(note.auth_user_id) ?? [];
      list.push(note);
      grouped.set(note.auth_user_id, list);
    });
    return grouped;
  }, [events]);

  const summary = useMemo(() => {
    const today = startOfToday();
    const signInsToday = events.filter((note) => note.kind === "sign_in" && new Date(note.created_at).getTime() >= today).length;

    let pinsInUse = 0;
    byCustomer.forEach((notes) => {
      const latestPin = notes.find((note) => note.kind !== "sign_in");
      if (latestPin?.kind === "pin_set") pinsInUse += 1;
    });

    return { accounts: customers.length, signInsToday, pinsInUse, events: events.length };
  }, [customers, events, byCustomer]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((person) =>
      (person.full_name ?? "").toLowerCase().includes(needle) || (person.phone ?? "").toLowerCase().includes(needle));
  }, [customers, query]);

  /* Under 900px the account takes over the screen: the list and the record
     cannot share a phone. Same breakpoint as .detail-view.is-overlay. */
  const isNarrow = useMediaQuery("(max-width: 900px)");

  const selected = useMemo(() => customers.find((person) => person.auth_user_id === selectedId) ?? null, [customers, selectedId]);
  const selectedHistory = useMemo(() => (selectedId ? byCustomer.get(selectedId) ?? [] : []), [byCustomer, selectedId]);

  const lastMoment = (person: AppCustomer) => {
    const notes = byCustomer.get(person.auth_user_id);
    return notes && notes.length ? notes[0].created_at : null;
  };

  const pinState = (person: AppCustomer) => {
    const latestPin = (byCustomer.get(person.auth_user_id) ?? []).find((note) => note.kind !== "sign_in");
    if (!latestPin) return { label: "No PIN", color: "var(--text-3)", background: "var(--ink-raised)" };
    if (latestPin.kind === "pin_set") return { label: "PIN in use", color: "var(--ok-500)", background: "var(--ok-soft)" };
    if (latestPin.kind === "pin_used_up") return { label: "PIN used up", color: "var(--bad-500)", background: "var(--bad-soft)" };
    return { label: "PIN removed", color: "var(--warn-500)", background: "var(--warn-soft)" };
  };

  return (
    <div className="aa-page">
      <header className="aa-header">
        <div>
          <span className="aa-eyebrow"><Smartphone size={13} /> FROM THE CUSTOMER APP</span>
          <h1>App Accounts</h1>
          <p>
            Who has signed into the CPL app, and every security moment on their account:
            a sign-in, a PIN added, a PIN removed, a PIN used up. The four digits are never
            stored, here or anywhere, so nothing on this page could help anyone guess one.
          </p>
        </div>
        <button className="aa-refresh" onClick={() => { void loadEverything(); }} disabled={loading}>
          <RefreshCw size={14} className={loading ? "aa-spin" : undefined} /> Refresh
        </button>
      </header>

      <div className="aa-summary">
        <div className="aa-summary-card"><span>App accounts</span><strong>{summary.accounts}</strong></div>
        <div className="aa-summary-card"><span>Signed in today</span><strong>{summary.signInsToday}</strong></div>
        <div className="aa-summary-card"><span>PINs in use</span><strong>{summary.pinsInUse}</strong></div>
        <div className="aa-summary-card"><span>Moments recorded</span><strong>{summary.events}</strong></div>
      </div>

      {error && <div className="aa-error">{error}</div>}

      {historyOff && (
        <div className="aa-notready">
          <ShieldCheck size={20} />
          <h2>The security history is not switched on in this project yet</h2>
          <p>
            The app is writing nothing yet because the place that stores these notes has not
            been created. Run <strong>docs/customers-birthdays-and-ideas.sql</strong>, section 6, once,
            and every sign-in and PIN moment will appear here from then on.
          </p>
        </div>
      )}

      <div className="aa-workspace">
        <section className="aa-list-panel">
          <div className="aa-list-heading">
            <div>
              <h2>App customers</h2>
              <p>Newest account first, with the last moment recorded on each.</p>
            </div>
            <span>{visible.length}</span>
          </div>

          <label className="aa-search">
            <Search size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a name or a number"
            />
          </label>

          {loading ? (
            <LoadingRows rows={4} label="Reading accounts" />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<UserCheck size={20} />}
              title="No app accounts yet"
              message="An account appears here the first time a customer signs in to the app with their phone."
            />
          ) : (
            <div className="aa-list">
              {visible.map((person) => {
                const pin = pinState(person);
                const last = lastMoment(person);
                return (
                  <button
                    key={person.auth_user_id}
                    className={`aa-person ${selectedId === person.auth_user_id ? "selected" : ""}`}
                    onClick={() => setSelectedId(person.auth_user_id)}
                  >
                    <div className="aa-person-top">
                      <strong>{person.full_name?.trim() || "Name not given"}</strong>
                      <span className="aa-pin" style={{ color: pin.color, background: pin.background }}>{pin.label}</span>
                    </div>
                    <div className="aa-person-meta">
                      <span>{person.phone ?? "No number"}</span>
                      <span>{last ? `Last: ${formatMoment(last)}` : "No moments recorded yet"}</span>
                      <span>{person.client_id ? "On the client list" : "Not on the client list yet"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="aa-detail-panel" aria-live="polite">
          {!selected ? (
            <div className="aa-detail-empty-card">
              <EmptyState
                icon={<UserCheck size={22} />}
                title="Choose an account"
                message="Pick a customer to see every moment recorded on their account, newest first."
              />
            </div>
          ) : (
            <DetailView
              key={selected.auth_user_id}
              className="aa-detail"
              variant={isNarrow ? "overlay" : "inline"}
              onClose={() => setSelectedId(null)}
              title={selected.full_name?.trim() || "Name not given"}
              subtitle={`${selected.phone ?? "No number"} · joined ${formatMoment(selected.created_at)}`}
            >

              <div className="aa-asks">
                <div className="aa-asks-head">
                  <h3>What they have asked for</h3>
                  <span>Newest first, from both queues</span>
                </div>

                {asksLoading ? (
                  <p className="aa-asks-note">Reading their requests</p>
                ) : asks.length === 0 ? (
                  <p className="aa-asks-note">
                    Nothing yet. An account appears here whether or not the person has
                    asked for anything, so this can simply mean they have not booked.
                  </p>
                ) : (
                  <ul className="aa-asks-list">
                    {asks.map((ask) => (
                      <li key={ask.id} className={`aa-ask aa-ask--${ask.tone}`}>
                        <span className="aa-ask-label">{ask.label}</span>
                        <span className="aa-ask-state">{ask.state}</span>
                        <time>{formatMoment(ask.askedAt)}</time>
                      </li>
                    ))}
                  </ul>
                )}

                {asksNote && <p className="aa-asks-note aa-asks-note--warn">{asksNote}</p>}

                <div className="aa-asks-links">
                  <Link to="/mobile-requests">Mobile Requests <ArrowRight size={13} aria-hidden="true" /></Link>
                  <Link to="/service-requests">Service Requests <ArrowRight size={13} aria-hidden="true" /></Link>
                </div>
              </div>

              <div className="aa-honest">
                <KeyRound size={15} />
                <span>
                  The PIN lives on the customer's phone, not here. CPL can see that a PIN was
                  set or given up, never the four digits.
                </span>
              </div>

              <div className="aa-history">
                {selectedHistory.length === 0 ? (
                  <EmptyState
                    icon={<KeyRound size={20} />}
                    title="No moments recorded yet"
                    message={
                      historyOff
                        ? "The history table is not switched on in this project yet, so nothing has been saved."
                        : "This customer has not signed in or touched their PIN since the record began."
                    }
                  />
                ) : (
                  selectedHistory.map((note) => {
                    const meta = KIND_META[note.kind] ?? { label: note.kind, sentence: "", color: "var(--text-2)", background: "var(--ink-raised)" };
                    return (
                      <div key={note.id} className="aa-moment">
                        <span className="aa-moment-kind" style={{ color: meta.color, background: meta.background }}>{meta.label}</span>
                        <div className="aa-moment-copy">
                          <span>{meta.sentence}</span>
                          <time>{formatMoment(note.created_at)}</time>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </DetailView>
          )}
        </section>
      </div>
    </div>
  );
}

export const AppAccounts = () => (
  <PermissionGuard>
    <AppAccountsContent />
  </PermissionGuard>
);

export default AppAccounts;
