import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Topbar } from "@/components/topbar/Topbar";
import { FAB } from "@/components/FAB/FAB";
import "./MainLayout.css";

export default function MainLayout() {
  // Only addition: track the route so page content can transition in
  // smoothly instead of snapping. Nothing else about the tree changed.
  const location = useLocation();

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="main-body">
          <div className="route-transition" key={location.pathname}>
            <Outlet />
          </div>
        </main>
        <FAB />
      </div>
    </div>
  );
}