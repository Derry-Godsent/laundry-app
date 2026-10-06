import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, message, action }: EmptyStateProps) => (
  <div className="empty-state">
    {icon ? <div className="empty-state__icon">{icon}</div> : null}
    <h3>{title}</h3>
    {message ? <p>{message}</p> : null}
    {action ? <div style={{ marginTop: "var(--sp-3)" }}>{action}</div> : null}
  </div>
);

export default EmptyState;
