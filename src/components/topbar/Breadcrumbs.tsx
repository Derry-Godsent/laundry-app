import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import "./Breadcrumbs.css";

// Map route segments to human-readable labels
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  staff: "Staff",
  services: "Services",
  payments: "Payments",
  security: "Security",
  settings: "Settings",
  // Add more as your app grows
};

export const Breadcrumbs = () => {
  const location = useLocation();
  // Clean path: strip query params & hashes, split, filter empty segments
  const cleanPath = location.pathname.split("?")[0].split("#")[0];
  const paths = cleanPath.split("/").filter(Boolean);

  if (paths.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {/* Home Link */}
      <div className="breadcrumb-item">
        <Link to="/" className="breadcrumb-link home-link" aria-label="Home">
          <Home size={14} />
        </Link>
        <ChevronRight size={14} className="breadcrumb-separator" aria-hidden="true" />
      </div>

      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const label = routeLabels[path] || path.charAt(0).toUpperCase() + path.slice(1);
        const url = `/${paths.slice(0, index + 1).join("/")}`;

        return (
          <div key={`${path}-${index}`} className="breadcrumb-item">
            {!isLast ? (
              <Link to={url} className="breadcrumb-link">{label}</Link>
            ) : (
              <span className="breadcrumb-current" aria-current="page">{label}</span>
            )}
            {!isLast && (
              <ChevronRight size={14} className="breadcrumb-separator" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </nav>
  );
};