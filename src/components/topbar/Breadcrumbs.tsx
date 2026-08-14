import { useLocation, Link } from "react-router-dom";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react"; // Removed 'Home' import
import "./Breadcrumbs.css";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  "new-order": "New Order",
  staff: "Staff",
  clients: "Clients",
  services: "Services",
  receipt: "Receipt",
  payments: "Payments",
  security: "Security",
  settings: "Settings",
  system: "System Admin",
  profile: "Profile",
  help: "Help",
};

function formatLabel(raw: string): string {
  return raw
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const Breadcrumbs = () => {
  const location = useLocation();

  const paths = useMemo(() => {
    const cleanPath = location.pathname.split("?")[0].split("#")[0];
    return cleanPath.split("/").filter(Boolean);
  }, [location.pathname]);

  if (paths.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const label = routeLabels[path] || formatLabel(path);
        const url = `/${paths.slice(0, index + 1).join("/")}`;

        return (
          <div key={path} className="breadcrumb-item">
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

export default Breadcrumbs;