import { ReactNode } from "react";
import { usePermission } from "../hooks/usePermission";
import { useLocation } from "react-router-dom";
import { Shield } from "lucide-react";

const T = {
  gold: "#dba96a",
  goldDim: "rgba(219,169,106,0.1)",
  goldBord: "rgba(219,169,106,0.22)",
};
const FONT = "'DM Sans', 'Inter', system-ui, sans-serif";

interface PermissionGuardProps {
  children: ReactNode;
  path?: string;
  showBanner?: boolean;
}

export const PermissionGuard = ({ children, path, showBanner = true }: PermissionGuardProps) => {
  const location = useLocation();
  const targetPath = path || location.pathname;
  const { permission, loading, canEdit } = usePermission(targetPath);

  if (loading) return null;

  return (
    <>
      {showBanner && !canEdit && (
        <div style={{
          padding: "10px 14px",
          background: T.goldDim,
          border: `1px solid ${T.goldBord}`,
          borderRadius: 8,
          color: T.gold,
          fontSize: 12,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: FONT
        }}>
          <Shield size={14} />
          View-only access. Contact an administrator to make changes.
        </div>
      )}

      <div style={{
        opacity: canEdit ? 1 : 0.6,
        transition: "opacity 0.2s ease",
        pointerEvents: canEdit ? "auto" : "none",
        position: "relative"
      }}>
        {children}
      </div>
    </>
  );
};