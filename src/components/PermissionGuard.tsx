import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Shield, AlertCircle } from "lucide-react";
import { usePermission } from "../hooks/usePermission";
import "./PermissionGuard.css";

interface PermissionGuardProps {
  children: ReactNode;
  path?: string;
  showBanner?: boolean;
  className?: string;
}

export const PermissionGuard = ({
  children,
  path,
  showBanner = true,
  className = "",
}: PermissionGuardProps) => {
  const location = useLocation();
  const targetPath = path || location.pathname;
  const { loading, error, canView, canEdit } = usePermission(targetPath);

  if (loading) return null;

  if (error) {
    return (
      <div className={`pg-error ${className}`} role="alert">
        <AlertCircle size={14} />
        Unable to check permissions. Please refresh the page.
      </div>
    );
  }

  if (!canView) {
    return (
      <div className={`pg-access-denied ${className}`}>
        <Shield size={14} />
        Access denied. You do not have permission to view this page.
      </div>
    );
  }

  return (
    <>
      {showBanner && !canEdit && (
        <div className="pg-banner" role="status">
          <Shield size={14} />
          <span>View-only access. Contact an administrator to make changes.</span>
        </div>
      )}
      <div className={`pg-content ${className}`}>
        {children}
      </div>
    </>
  );
};

export default PermissionGuard;