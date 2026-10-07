import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TileRole = "hero" | "standard" | "compact" | "split" | "progress";

export interface TileSubValue {
  label: string;
  value: ReactNode;
}

export interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Accent for the rail, the icon chip and the sparkline. */
  accent?: string;
  /**
   * How much of the row this tile is worth. One `hero` per row, and the row
   * should not be all heroes: a number that everything else matches is a number
   * nobody reads. `split` adds two sub-values, `progress` a measured bar.
   */
  role?: TileRole;
  /** Small text under the number, such as "12 today". */
  meta?: ReactNode;
  /** Two sub-values under the number. Only used by the `split` role. */
  subValues?: [TileSubValue, TileSubValue];
  /** 0 to 1. Only used by the `progress` role. */
  progress?: number;
  /** Where the number sits relative to its target, for the progress caption. */
  progressLabel?: ReactNode;
  /** A trend line, usually a Sparkline. Preferred over a delta badge. */
  sparkline?: ReactNode;
  /**
   * A one-off overline above the label, for tiles that need to say something
   * the label cannot ("Needs attention").
   */
  overline?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * The one summary tile.
 *
 * Pages used to hand-roll their own four equal boxes, so every screen looked
 * like every other screen and nothing had emphasis. A tile now declares its
 * role instead: `hero` carries the number the page is about, `standard` the
 * figures beside it, `compact` the dense counts, `split` a figure that breaks
 * into two, and `progress` a figure with a target. Nine of these on a page read
 * as a layout; nine identical ones read as a spreadsheet.
 *
 * A trend is a sparkline rather than a badge. A badge is kept elsewhere for
 * state that a line genuinely cannot draw, such as Declined.
 */
export const StatTile = ({
  label,
  value,
  icon,
  accent = "var(--brand-500)",
  role = "standard",
  meta,
  subValues,
  progress,
  progressLabel,
  sparkline,
  overline,
  onClick,
  className,
}: StatTileProps) => {
  const Tag = onClick ? "button" : "div";
  const clamped = typeof progress === "number" ? Math.max(0, Math.min(1, progress)) : undefined;

  return (
    <Tag
      className={cn("stat", `stat--${role}`, onClick && "card--interactive", className)}
      style={{ "--accent": accent, textAlign: "left" } as CSSProperties}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <div className="stat__top">
        {icon ? <span className="stat__icon">{icon}</span> : <span />}
        {overline ? <span className="stat__overline">{overline}</span> : null}
      </div>

      <div className="stat__label">{label}</div>
      <div className="stat__value tabular">{value}</div>

      {subValues ? (
        <div className="stat__split">
          {subValues.map((item) => (
            <div key={item.label}>
              <span className="stat__split-label">{item.label}</span>
              <strong className="tabular">{item.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {clamped !== undefined ? (
        <div className="stat__progress">
          <div className="stat__bar" role="presentation">
            <span style={{ width: `${clamped * 100}%` }} />
          </div>
          {progressLabel ? <span className="stat__progress-label">{progressLabel}</span> : null}
        </div>
      ) : null}

      {meta ? <div className="stat__meta">{meta}</div> : null}

      {sparkline ? <div className="stat__spark">{sparkline}</div> : null}
    </Tag>
  );
};

export default StatTile;
