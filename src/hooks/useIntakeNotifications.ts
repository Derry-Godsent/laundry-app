import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Real notifications for the office.
 *
 * Every alert here comes from a record in the database, and every one of them
 * arrives by itself:
 * - a customer sends a laundry request
 * - a customer asks for cleaning, fumigation, detailing, polytank, or contract work
 * - a customer answers a date CPL offered, by accepting or rejecting it
 * - a customer changes or cancels something
 * - a customer sends an idea for the app
 *
 * The old alert listened to orders filtered by a client id, which a staff member
 * never has, so it silently delivered nothing. This listens to the two intake
 * tables, which is where the office's work actually arrives.
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

function laundryNotification(row: any): StaffNotification {
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
    href: "/mobile-requests",
    createdAt: row.created_at,
  };
}

function serviceNotification(row: any): StaffNotification {
  const area = row.details?.estimatedAreaM2;
  return {
    id: `quote-${row.id}`,
    title: `New ${row.service_title || "service"} request`,
    message: `${row.property_type || "A customer"}${row.preference ? `, ${row.preference}` : ""}${area ? `, about ${area} m2` : ""}. This one needs a date from CPL.`,
    time: minutesAgo(row.created_at),
    read: false,
    type: "info",
    href: "/service-requests",
    createdAt: row.created_at,
  };
}

function answerNotification(row: any): StaffNotification {
  const accepted = row.customer_response === "accepted";
  return {
    id: `answer-${row.id}`,
    title: accepted ? "Customer accepted the date" : "Customer asked for another date",
    message: `${row.pickup_area || "A customer"}${row.confirmed_for ? ` for ${row.confirmed_for}` : ""}. ${accepted ? "The job is ready for the next step." : "Offer a new date when you can."}`,
    time: minutesAgo(row.customer_response_at || row.created_at),
    read: false,
    type: accepted ? "success" : "warning",
    href: "/mobile-requests",
    createdAt: row.customer_response_at || row.created_at,
  };
}

function ideaNotification(row: any): StaffNotification {
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

export const useIntakeNotifications = (userId: string | null, enabled: boolean) => {
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRecent = useCallback(async () => {
    const entries: StaffNotification[] = [];
    const [requests, quotes, ideas] = await Promise.all([
      supabase
        .from("mobile_requests")
        .select("id, pickup_area, laundry_items, estimated_total, requested_for, request_status, customer_response, customer_response_at, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("quote_requests")
        .select("id, service_title, property_type, preference, appointment_response, details, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("chapman_app_ideas")
        .select("id, author_name, kind, idea, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    for (const row of (requests.data ?? []) as any[]) entries.push(laundryNotification(row));
    for (const row of (quotes.data ?? []) as any[]) entries.push(serviceNotification(row));
    for (const row of (ideas.data ?? []) as any[]) entries.push(ideaNotification(row));

    // Anything the customer has already answered is worth telling the office about
    // too, because it decides the next step.
    for (const row of ((requests.data ?? []) as any[]).filter((item) => item.customer_response)) {
      entries.push(answerNotification(row));
    }

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
        const row = payload?.new;
        if (!row?.customer_response) return;
        if (row.customer_response_at && payload?.old?.customer_response === row.customer_response) return;
        push(answerNotification(row));
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
