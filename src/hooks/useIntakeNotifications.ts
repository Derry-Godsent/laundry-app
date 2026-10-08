import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Real notifications for the office.
 *
 * Every alert here comes from a record in the database, and every one of them
 * arrives by itself:
 * - a customer sends a laundry request
 * - a customer asks for cleaning, fumigation, detailing, polytank, or contract work
 * - a customer answers a date CPL offered on a laundry request
 * - a customer answers an appointment CPL offered on a service request
 * - a customer creates an account in the customer app
 * - a customer sends an idea for the app
 *
 * The list holds only what is still the office's to do, and what has just
 * changed the next step: an intake nobody has answered, a customer's reply, a
 * new account, an unread idea. A job the office has already dealt with is not
 * repeated here, because a list of last week's work is a list nobody reads.
 *
 * The old alert listened to orders filtered by a client id, which a staff member
 * never has, so it silently delivered nothing. This listens to the intake tables,
 * which is where the office's work actually arrives.
 *
 * Read state is kept in the browser, per staff member, so the count means
 * "new since I last looked" rather than resetting on every refresh.
 */

export interface StaffNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "success" | "info" | "warning" | "error";
  /** Where clicking the alert should take the office. */
  href: string;
  createdAt: string;
}

const READ_KEY_PREFIX = "chapman-staff-alerts-read:";
const MAX_ITEMS = 20;

const readIdsFor = (userId: string | null): string[] => {
  if (!userId || typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(READ_KEY_PREFIX + userId);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const rememberReadIds = (userId: string | null, ids: string[]) => {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(READ_KEY_PREFIX + userId, JSON.stringify(ids.slice(-200)));
  } catch {
    // Read state is a convenience. Losing it must not break the alert list.
  }
};

const money = (value: unknown) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? `GH₵${number.toFixed(2)}` : "";
};

const minutesAgo = (iso: string) => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GH", { day: "numeric", month: "short" });
};

export function laundryNotification(row: any): StaffNotification {
  const items = Array.isArray(row.laundry_items)
    ? row.laundry_items.reduce((total: number, item: any) => total + Number(item?.quantity ?? 1), 0)
    : 0;
  return {
    id: `mobile-${row.id}`,
    title: "New laundry request",
    message: `${items} item${items === 1 ? "" : "s"} from ${row.pickup_area || "a customer"}${row.estimated_total ? `, about ${money(row.estimated_total)}` : ""}. ${row.requested_for ? `Preferred ${row.requested_for}.` : ""}`,
    time: minutesAgo(row.created_at),
    read: false,
    type: "success",
    href: "/mobile-requests?view=active",
    createdAt: row.created_at,
  };
}

export function serviceNotification(row: any): StaffNotification {
  const area = row.details?.estimatedAreaM2;
  return {
    id: `quote-${row.id}`,
    title: `New ${row.service_title || "service"} request`,
    message: `${row.property_type || "A customer"}${row.preference ? `, ${row.preference}` : ""}${area ? `, about ${area} m2` : ""}. This one needs a date from CPL.`,
    time: minutesAgo(row.created_at),
    read: false,
    type: "info",
    href: "/service-requests?view=action",
    createdAt: row.created_at,
  };
}

/* The customer's answer to a date the office offered on a laundry request.
 *
 * A rejection is final: the database closes the request and clears the offered
 * date, so the office must not be told to offer another one. Anything else that
 * carries a response is the older "ask for another date" path. */
export function answerNotification(row: any): StaffNotification {
  const accepted = row.customer_response === "accepted";
  const closed = !accepted && row.request_status === "declined";
  const where = row.pickup_area || "A customer";
  return {
    id: `answer-${row.id}`,
    title: accepted ? "Customer accepted the date" : closed ? "Customer rejected the date" : "Customer asked for another date",
    message: accepted
      ? `${where}${row.confirmed_for ? ` for ${row.confirmed_for}` : ""}. The job is ready for the next step.`
      : closed
        ? `${where} closed the request. It stays in Declined history as the final record.`
        : `${where}. Offer a new date when you can.`,
    time: minutesAgo(row.customer_response_at || row.created_at),
    read: false,
    type: accepted ? "success" : "warning",
    href: accepted ? "/mobile-requests?view=confirmed" : closed ? "/mobile-requests?view=declined" : "/mobile-requests?view=waiting",
    createdAt: row.customer_response_at || row.created_at,
  };
}

/* The customer's answer to an appointment the office offered on a service
 * request. Asking for another date leaves the request with the office, which is
 * why it carries the same weight as a new enquiry. "declined" is the office's
 * own action on that table, not the customer's, so it is not reported here. */
export function appointmentAnswerNotification(row: any): StaffNotification {
  const accepted = row.appointment_response === "accepted";
  const what = row.service_title || "service request";
  return {
    id: `appointment-${row.id}`,
    title: accepted ? `Customer accepted the ${what} appointment` : `Customer wants another date for ${what}`,
    message: accepted
      ? `${row.property_type || "The property"} is booked. The next step is on the work side.`
      : `${row.property_type || "The property"}. Offer another date when you can.`,
    time: minutesAgo(row.created_at),
    read: false,
    type: accepted ? "success" : "warning",
    href: accepted ? "/service-requests?view=accepted" : "/service-requests?view=another",
    createdAt: row.created_at,
  };
}

/* Somebody created an account in the customer app. Every app relationship starts
 * here, and until now only the side menu count moved when one arrived. */
export function signupNotification(row: any): StaffNotification {
  const name = row.full_name || "A customer";
  return {
    id: `account-${row.auth_user_id}`,
    title: "New app account",
    message: `${name}${row.phone ? `, ${row.phone}` : ""} created an account in the customer app.`,
    time: minutesAgo(row.created_at),
    read: false,
    type: "info",
    href: "/app-accounts",
    createdAt: row.created_at,
  };
}

export function ideaNotification(row: any): StaffNotification {
  const kind = row.kind === "remove" ? "remove something" : row.kind === "change" ? "change something" : "add something";
  return {
    id: `idea-${row.id}`,
    title: "New idea for the app",
    message: `${row.author_name || "A customer"} wants to ${kind}: ${String(row.idea || "").slice(0, 120)}`,
    time: minutesAgo(row.created_at),
    read: false,
    type: "info",
    href: "/app-ideas",
    createdAt: row.created_at,
  };
}

/* The two decisions the live listener makes, kept out of the effect so they can
 * be read, and checked, as plain rules.
 *
 * Exported with the builders below so the probe can prove the wording and the
 * transition rules without a database to talk to. */

/** A customer answered a laundry date, and this update is what answered it. */
export const isCustomerDateAnswer = (row: any, before: any) =>
  Boolean(row?.customer_response) && before?.customer_response !== row.customer_response;

/** A customer answered a service appointment. The office setting "declined" on
 *  that table is its own action and must not arrive as news about a customer. */
export const isCustomerAppointmentAnswer = (row: any, before: any) =>
  Boolean(row) &&
  row.appointment_response !== before?.appointment_response &&
  (row.appointment_response === "accepted" || row.appointment_response === "rejected");

export const useIntakeNotifications = (userId: string | null, enabled: boolean) => {
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRecent = useCallback(async () => {
    const entries: StaffNotification[] = [];

    /* Each query asks for exactly the rows that still need somebody: laundry
     * requests nobody has answered, service enquiries waiting on the office,
     * the replies that decide a next step, unread ideas, and recent signups.
     * A resolved row is left out rather than dressed up as news. */
    const [requests, quotes, answered, replies, ideas, accounts] = await Promise.all([
      supabase
        .from("mobile_requests")
        .select("id, pickup_area, laundry_items, estimated_total, requested_for, request_status, created_at")
        .in("request_status", ["pending", "under_review"])
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("quote_requests")
        .select("id, service_title, property_type, preference, appointment_response, details, created_at")
        .eq("appointment_response", "awaiting-chapman")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("quote_requests")
        .select("id, service_title, property_type, appointment_response, created_at")
        .in("appointment_response", ["accepted", "rejected"])
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("mobile_requests")
        .select("id, pickup_area, request_status, customer_response, customer_response_at, confirmed_for, created_at")
        .not("customer_response", "is", null)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("chapman_app_ideas")
        .select("id, author_name, kind, idea, status, created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("customer_accounts")
        .select("auth_user_id, full_name, phone, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    /* A query that fails must say which one, or the office is left with an
       empty panel and no reason for it. */
    for (const [table, result] of [["mobile_requests", requests], ["quote_requests", quotes], ["quote replies", answered], ["mobile replies", replies], ["chapman_app_ideas", ideas], ["customer_accounts", accounts]] as [string, { error: { message: string } | null }][]) {
      if (result.error) console.warn(`Alert list could not read ${table}:`, result.error.message);
    }

    for (const row of (requests.data ?? []) as any[]) entries.push(laundryNotification(row));
    for (const row of (quotes.data ?? []) as any[]) entries.push(serviceNotification(row));
    for (const row of (answered.data ?? []) as any[]) entries.push(appointmentAnswerNotification(row));
    for (const row of (replies.data ?? []) as any[]) entries.push(answerNotification(row));
    for (const row of (ideas.data ?? []) as any[]) entries.push(ideaNotification(row));
    for (const row of (accounts.data ?? []) as any[]) entries.push(signupNotification(row));

    setNotifications(entries.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, MAX_ITEMS));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setReadIds(readIdsFor(userId));
    void loadRecent();
  }, [enabled, userId, loadRecent]);

  useEffect(() => {
    if (!enabled) return;

    const push = (entry: StaffNotification) => {
      setNotifications((current) => {
        if (current.some((item) => item.id === entry.id)) return current;
        return [entry, ...current].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, MAX_ITEMS);
      });
    };

    const channel = supabase
      .channel("staff-intake-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mobile_requests" }, (payload: any) => {
        if (payload?.new) push(laundryNotification(payload.new));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "quote_requests" }, (payload: any) => {
        if (payload?.new) push(serviceNotification(payload.new));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chapman_app_ideas" }, (payload: any) => {
        if (payload?.new) push(ideaNotification(payload.new));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mobile_requests" }, (payload: any) => {
        if (isCustomerDateAnswer(payload?.new, payload?.old)) push(answerNotification(payload.new));
      })
      /* The customer answering an appointment. Only a change of answer counts,
         and only the two answers a customer can give: the office setting
         "declined" on that table is its own action, not news about a customer. */
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "quote_requests" }, (payload: any) => {
        if (isCustomerAppointmentAnswer(payload?.new, payload?.old)) push(appointmentAnswerNotification(payload.new));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customer_accounts" }, (payload: any) => {
        if (payload?.new) push(signupNotification(payload.new));
      })
      .subscribe();

    // Keep the "how long ago" wording honest while the page stays open.
    timer.current = setInterval(() => {
      setNotifications((current) => current.map((item) => ({ ...item, time: minutesAgo(item.createdAt) })));
    }, 60000);

    return () => {
      if (timer.current) clearInterval(timer.current);
      supabase.removeChannel(channel);
    };
  }, [enabled, userId]);

  const notificationsWithReadState = notifications.map((item) => ({ ...item, read: readIds.includes(item.id) }));

  const markRead = useCallback((ids: string[]) => {
    setReadIds((current) => {
      const merged = Array.from(new Set([...current, ...ids]));
      rememberReadIds(userId, merged);
      return merged;
    });
  }, [userId]);

  const unreadCount = notificationsWithReadState.filter((item) => !item.read).length;

  return {
    notifications: notificationsWithReadState,
    unreadCount,
    loading,
    markRead,
    markAllRead: () => markRead(notifications.map((item) => item.id)),
  };
};
