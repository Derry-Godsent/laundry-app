import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

import "./index.css";

/* ─── ERROR BOUNDARY (Catches crashes gracefully) ───────── */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to monitoring service (e.g., Sentry, LogRocket)
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", background: "#07090e", color: "#edf0f8",
          fontFamily: "'DM Sans', sans-serif", textAlign: "center", padding: 24
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Something went wrong
            </div>
            <div style={{ fontSize: 14, color: "#9aa3b5", marginBottom: 16 }}>
              The system encountered an unexpected error. Please refresh or contact support.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px", background: "#6c72f3", border: "none",
                borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── LOADING FALLBACK ─────────────────────────────────── */
const LoadingFallback = () => (
  <div style={{
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#07090e", color: "#edf0f8",
    fontFamily: "'DM Sans', sans-serif"
  }}>
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 48, height: 48, border: "3px solid rgba(108,114,243,0.2)",
        borderTopColor: "#6c72f3", borderRadius: "50%", margin: "0 auto 16px",
        animation: "spin 1s linear infinite"
      }} />
      <div style={{ fontSize: 14, color: "#9aa3b5" }}>Loading system...</div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/* ─── REACT QUERY SETUP ────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5,    // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "chapman-query-cache",
});

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});

/* ─── PERFORMANCE MONITORING (Optional) ────────────────── */

if (import.meta.env.PROD && "performance" in window) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const perf = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      console.log("Performance:", {
        dcl: perf.domContentLoadedEventEnd,
        load: perf.loadEventEnd,
        fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime,
      });
    }, 0);
  });
}

/* ─── PWA SERVICE WORKER REGISTRATION ──────────────────── */
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("SW registered:", registration.scope);
        
        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content available — optionally show update prompt
                console.log("New version available. Refresh to update.");
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn("SW registration failed:", err);
      });
  });

  // Handle online/offline status
  window.addEventListener("online", () => console.log("🟢 Online"));
  window.addEventListener("offline", () => console.log("🔴 Offline"));
}

/* ─── ROOT RENDER ──────────────────────────────────────── */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LoadingFallback />}>
          <RouterProvider router={router} />
        </Suspense>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);