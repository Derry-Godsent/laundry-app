import type { ReactNode } from "react";
import { StatTile } from "../StatTile";
import { Sparkline } from "../Sparkline";

interface KpiCardProps {
  title: string;
  value: string | number;
  /**
   * A trend, drawn as a sparkline. `values` is the series to draw; `direction`
   * only sets the accent, because the shape of the line already carries the
   * movement and a coloured arrow badge on top of it says the same thing twice.
   */
  trend?: { value: number; direction: "up" | "down" | "neutral"; values?: number[] };
  icon?: ReactNode;
  accent?: string;
  role?: "hero" | "standard" | "compact";
  onClick?: () => void;
  className?: string;
}

const ACCENTS = {
  up: "var(--ok-500)",
  down: "var(--bad-500)",
  neutral: "var(--brand-500)",
} as const;

/**
 * A summary tile with a trend, kept for pages that already call it: it renders
 * the shared StatTile plus a Sparkline so it can never drift from the console.
 */
export const KpiCard = ({ title, value, trend, icon, accent, role, onClick, className }: KpiCardProps) => (
  <StatTile
    label={title}
    value={value}
    icon={icon}
    role={role ?? (trend ? "split" : "standard")}
    accent={accent ?? (trend ? ACCENTS[trend.direction] : undefined)}
    onClick={onClick}
    className={className}
    sparkline={trend?.values && trend.values.length > 1 ? <Sparkline data={trend.values} color={accent ?? ACCENTS[trend.direction]} /> : undefined}
    meta={trend && !trend.values ? `${trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}${Math.abs(trend.value)}% vs last week` : undefined}
  />
);
