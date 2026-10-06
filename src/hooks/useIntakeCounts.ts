import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Live counts for the staff side menu.
 *
 * Each number answers a question the office actually asks:
 * - Orders: how many orders exist.
 * - Mobile Requests: how many laundry requests are still waiting for Chapman.
 * - Service Requests: how many cleaning or service enquiries need a date.
 * - App Ideas: how many ideas from customers nobody has read yet.
 * - App Accounts: how many customers use the app.
 * - Clients: how many client records exist.
 * - Staff: how many staff records exist.
 *
 * Everything updates by itself when a customer sends something or the office
 * changes something, because the channel below listens to those tables.
 */

export interface IntakeCounts {
  orders: number;
  mobileRequests: number;
  serviceRequests: number;
  appIdeas: number;
  appAccounts: number;
  clients: number;
  staff: number;
}

const EMPTY: IntakeCounts = { orders: 0, mobileRequests: 0, serviceRequests: 0, appIdeas: 0, appAccounts: 0, clients: 0, staff: 0 };

async function countRows(table: string, apply?: (query: any) => any): Promise<number> {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (apply) query = apply(query);
  const { count, error } = await query;
  if (error) {
    console.warn(`Staff count for ${table} could not be read:`, error.message);
    return 0;
  }
  return count || 0;
}

export const useIntakeCounts = (enabled: boolean) => {
  const [counts, setCounts] = useState<IntakeCounts>(EMPTY);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const [orders, mobileRequests, serviceRequests, appIdeas, appAccounts, clients, staff] = await Promise.all([
      countRows("orders"),
      countRows("mobile_requests", (query) => query.in("request_status", ["pending", "under_review"])),
      countRows("quote_requests", (query) => query.in("appointment_response", ["awaiting-chapman", "rejected"])),
      countRows("chapman_app_ideas", (query) => query.eq("status", "new")),
      countRows("customer_accounts"),
      countRows("clients"),
      countRows("staff"),
    ]);
    setCounts({ orders, mobileRequests, serviceRequests, appIdeas, appAccounts, clients, staff });
    setLoading(false);
  }, []);

  // The side menu only shows pages this role may see, so there is no point
  // counting anything before the role is known.
  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;

    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { void refresh(); }, 350);
    };

    const channel = supabase
      .channel("staff-sidebar-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "mobile_requests" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_requests" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "chapman_app_ideas" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_accounts" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [enabled, refresh]);

  return { counts, loading, refresh };
};
