import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Accent colour for the rail, icon chip and sparkline. */
  accent?: string;
  delta?: { value: number; label?: string };
  /** Small text under the number, such as "12 today" or "vs yesterday". */
  meta?: ReactNode;
  sparkline?: ReactNode;
  onClick?: () => void;
  className?: string;
}

const trendClass = (value: number) =>
  value > 0 ? "delta--up" : value < 0 ? "delta--down" : "delta--flat";

export const StatTile = ({
  label,
  value,
  icon,
  accent = "var(--brand-500)",
  delta,
  meta,
  sparkline,
  onClick,
  className,
}: StatTileProps) => {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      className={cn("stat", onClick && "card--interactive", className)}
      style={{ "--accent": accent, textAlign: "left" } as CSSProperties}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <div className="stat__top">
        {icon ? <span className="stat__icon">{icon}</span> : <span />}
        {delta ? (
          /* No arrow glyphs: a triangle character is not an icon, it renders
             differently on every platform, and a tile reads its trend from the
             sparkline beside it. The number keeps the direction in words for
             screen readers. */
          <span className={cn("delta", trendClass(delta.value))}>
            <span className="sr-only">
              {delta.value > 0 ? "Up" : delta.value < 0 ? "Down" : "Flat"}
            </span>
            {Math.abs(delta.value)}%
          </span>
        ) : null}
      </div>

      <div className="stat__label">{label}</div>
      <div className="stat__value tabular">{value}</div>

      {meta || delta?.label ? (
        <div className="stat__meta">
          {delta?.label ? <span>{delta.label}</span> : null}
          {meta}
        </div>
      ) : null}

      {sparkline ? <div className="stat__spark">{sparkline}</div> : null}
    </Tag>
  );
};

export default StatTile;
