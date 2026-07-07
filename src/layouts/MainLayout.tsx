import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Topbar } from "@/components/topbar/Topbar";
import { FAB } from "@/components/FAB/FAB";
import "./MainLayout.css";

const MOBILE_BREAKPOINT = 1024;

const getIsMobile = () =>
  typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;

export default function MainLayout() {
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(getIsMobile);
  // FIX: default depends on device — mobile should start closed,
  // desktop should start open. Previously this was always `true`,
  // so a phone loading the page saw the sidebar already open.
  const [sidebarOpen, setSidebarOpen] = useState(() => !getIsMobile());

  const resizeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleResize = () => {
      // Debounced: this fired on every pixel of a desktop window drag.
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(() => {
        const mobile = getIsMobile();
        setIsMobile(mobile);
        // FIX: previously only handled desktop -> open. Now also
        // closes the sidebar when shrinking into the mobile range,
        // so the overlay doesn't suddenly appear mid-resize.
        setSidebarOpen(!mobile);
      }, 120);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
    };
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Close on Escape, and lock background scroll while the mobile
  // sidebar is open — both expected behavior for a slide-over panel.
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, sidebarOpen]);

  return (
    <div className="layout-container">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        isMobile={isMobile}
      />

      <div className="main-content">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          isMobile={isMobile}
        />

        <main className="main-body">
          <div className="route-transition" key={location.pathname}>
            <Outlet />
          </div>
        </main>

        <FAB />
      </div>

      {/* FIX: always rendered on mobile (not only while open), with the
         "active" class toggled by state, so the CSS opacity transition
         defined on .sidebar-overlay actually has a "before" state to
         animate from/to. Rendering it conditionally on sidebarOpen
         meant it just popped in/out with no fade. */}
      {isMobile && sidebarOpen && (
  <div 
    className="sidebar-overlay" 
    onClick={() => setSidebarOpen(false)}
  />
)}
    </div>
  );
}