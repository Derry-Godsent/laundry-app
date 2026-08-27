import { useState, useEffect, ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
// @ts-ignore
import { supabase } from "./lib/supabaseClient"; 
import MainLayout from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Orders } from "./pages/Orders";
import { OrderBuilder } from "./pages/OrderBuilder";
import { Staff } from "./pages/Staff";
import { Services } from "./pages/Services";
import { Payments } from "./pages/Payments";
import { Settings } from "./pages/Settings";
import { Security } from "./pages/Security";
import { Clients } from "./pages/Clients";
import { Receipt } from "./pages/Receipt";
import { Login } from "./pages/Login";
import { Reports } from "./pages/Reports";
import { SystemAdmin } from "./pages/SystemAdmin";
import { Profile } from "./pages/Profile";
import { Help } from "./pages/Help";
import { MobileRequests } from "./pages/MobileRequests";

/* ─── PROTECTED ROUTE WRAPPER ────────────────────────────────────────────── */
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      setSession(session);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", 
        color: "#9aa3b5", fontFamily: "'DM Sans', sans-serif", background: "#07090e" 
      }}>
        Loading...
      </div>
    );
  }
  
  if (!session) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />, 
  },
  {
    path: "/",
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "orders", element: <Orders /> },
      { path: "new-order", element: <OrderBuilder /> },
      { path: "staff", element: <Staff /> },
      { path: "services", element: <Services /> },
      { path: "payments", element: <Payments /> },
      { path: "settings", element: <Settings /> },
      { path: "security", element: <Security /> },
      { path: "clients", element: <Clients /> },
      { path: "receipt", element: <Receipt /> },
      { path: "system", element: <SystemAdmin /> },
      { path: "profile", element: <Profile /> },
      { path: "reports", element: <Reports /> },
      { path: "help", element: <Help /> },
      { path: "mobile-requests", element: <MobileRequests /> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> }, 
]);
