import { useSyncExternalStore } from "react";
// @ts-ignore
import { supabaseUrl, supabaseAnonKey } from "../lib/supabaseClient";

/**
 * One connection state for the whole console.
 *
 * Before this, every page guessed at its own: some watched `navigator.onLine`,
 * some treated any failed request as being offline, and one of them (Settings)
 * marked the page offline when a *save* was refused. That is how a console ends
 * up announcing "the system is offline" to somebody who is online and simply
 * not allowed to write that row.
 *
 * The rule here is: only the backend can tell us whether the backend is
 * reachable. The browser's own flag is reported alongside, never trusted on its
 * own, because `navigator.onLine` is false on plenty of working connections
 * (captive portals, VPNs, some Android webviews) and true on plenty of broken
 * ones.
 *
 * It is a module-level store rather than a React context, so the top bar, the
 * banner, the sign-in screen and any page see the same value with no provider
 * ordering to get wrong.
 */

export type ConnectionStatus = "checking" | "live" | "offline";

/** Which side of the wire is at fault, when we are offline. */
export type ConnectionReason = "network" | "server" | null;

export interface ConnectionState {
  status: ConnectionStatus;
  reason: ConnectionReason;
  /** Whether the browser itself claims to be online. Reported, not trusted. */
  browserOnline: boolean;
  /** When the last probe finished. Null until the first one has. */
  lastChecked: number | null;
}

const PROBE_TIMEOUT_MS = 8000;
const HEARTBEAT_MS = 30000;

const browserOnline = () =>
  typeof navigator === "undefined" ? true : navigator.onLine;

let state: ConnectionState = {
  status: "checking",
  reason: null,
  browserOnline: browserOnline(),
  lastChecked: null,
};

const listeners = new Set<() => void>();

const setState = (patch: Partial<ConnectionState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

/**
 * Ask the backend whether it is up.
 *
 * The auth health endpoint is the right thing to ask: it needs no session, it
 * touches no table, and it cannot be answered from a cache. Any HTTP reply at
 * all means something is listening, and a 2xx from this endpoint means the API
 * is healthy. A thrown request, an aborted one, or a non-2xx answer means it is
 * not, and the caller decides how to say so.
 */
const probe = async (): Promise<boolean> => {
  if (typeof fetch === "undefined") return true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey },
      signal: controller.signal,
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

let probing = false;

/** Run a probe now, unless one is already in flight. */
export const checkConnection = async (): Promise<void> => {
  if (probing) return;
  probing = true;
  const reachable = await probe();
  probing = false;
  setState({
    status: reachable ? "live" : "offline",
    /* Both sides agree it is down, or the browser thinks it is up and the
       server still does not answer: two different problems, two messages. */
    reason: reachable ? null : browserOnline() ? "server" : "network",
    browserOnline: browserOnline(),
    lastChecked: Date.now(),
  });
};

/** Re-check, and show that a check is happening. */
export const retryConnection = () => {
  setState({ status: "checking", reason: null });
  void checkConnection();
};

let started = false;

const start = () => {
  if (started || typeof window === "undefined") return;
  started = true;

  void checkConnection();

  const onBrowserOnline = () => {
    setState({ browserOnline: true, status: "checking", reason: null });
    void checkConnection();
  };

  const onBrowserOffline = () => {
    /* The browser is sure it is offline, so say so immediately rather than
       waiting for the probe to time out. The next probe still has the last
       word: a browser that is wrong about this will be corrected. */
    setState({
      browserOnline: false,
      status: "offline",
      reason: "network",
      lastChecked: Date.now(),
    });
    void checkConnection();
  };

  window.addEventListener("online", onBrowserOnline);
  window.addEventListener("offline", onBrowserOffline);

  /* Coming back to the tab, or back to the app on a phone, is when a stale
     status is most likely and most visible. */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void checkConnection();
  });
  window.addEventListener("focus", () => void checkConnection());

  // A heartbeat, but only while somebody is looking at the page.
  const beat = () => {
    if (document.visibilityState === "visible") void checkConnection();
  };
  setInterval(beat, HEARTBEAT_MS);
};

const subscribe = (listener: () => void) => {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;

/** The whole console reads its connection state from here. */
export const useConnection = (): ConnectionState & {
  retry: () => void;
  isOffline: boolean;
  isLive: boolean;
} => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    ...snapshot,
    retry: retryConnection,
    isOffline: snapshot.status === "offline",
    isLive: snapshot.status === "live",
  };
};

/**
 * Whether a failed request means the connection is down, as opposed to the
 * request being refused, the row missing or the permission absent.
 *
 * Supabase surfaces a network failure as a fetch error with no HTTP status;
 * anything that reached the server carries a status or a PostgREST code.
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  const err = error as { message?: string; status?: number; code?: string };
  const message = String(err.message ?? "");
  if (/Failed to fetch|NetworkError|Load failed|ERR_|fetch failed|timed out|timeout/i.test(message)) return true;
  if (typeof err.status === "number") return false;
  if (err.code) return false;
  // No status and no code, and no recognisable message: treat as unknown rather
  // than blaming the network, so a page never invents an outage.
  return false;
};
