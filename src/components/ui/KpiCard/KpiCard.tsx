import type { ReactNode } from "react";
import { StatTile } from "../StatTile";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  icon?: ReactNode;
  accent?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Legacy KPI card, kept so older pages keep compiling — it now renders the
 * shared StatTile so it can never drift from the rest of the console.
 */
export const KpiCard = ({ title, value, trend, icon, accent, onClick, className }: KpiCardProps) => (
  <StatTile
    label={title}
    value={value}
    icon={icon}
    accent={accent}
    onClick={onClick}
    className={className}
    delta={
      trend
        ? {
            value: trend.direction === "down" ? -Math.abs(trend.value) : trend.value,
          }
        : undefined
    }
  />
);
