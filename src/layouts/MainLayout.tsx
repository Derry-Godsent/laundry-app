import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react"; // ✅ Added
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Topbar } from "@/components/topbar/Topbar";
import { FAB } from "@/components/FAB/FAB";
import "./MainLayout.css";

// ✅ Added mobile breakpoint constant
const MOBILE_BREAKPOINT = 1024;

export default function MainLayout() {
  const location = useLocation();
  
  // ✅ Added state for sidebar and mobile detection
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );

  // ✅ Added resize listener for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      // Auto-close sidebar when switching to desktop
      if (!mobile) setSidebarOpen(true);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="layout-container">
      {/* ✅ Pass props to Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobile={isMobile}
      />
      
      <div className="main-content">
        {/* ✅ Pass props to Topbar */}
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

      {/* ✅ Mobile overlay to close sidebar when clicking outside */}
      {isMobile && sidebarOpen && (
        <div 
          className="sidebar-overlay active" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}