import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PillTone = "neutral" | "brand" | "gold" | "ok" | "warn" | "bad" | "info" | "violet";

export interface StatusPillProps {
  tone?: PillTone;
  children: ReactNode;
  /** Show the leading status dot. Useful for live/work states. */
  dot?: boolean;
  className?: string;
  title?: string;
}

/**
 * Status chip used by every queue, table and detail panel.
 *
 * A single tone vocabulary means "Waiting for client" looks the same in the
 * sidebar badge, the request list and the request detail, so staff only have to
 * learn the colours once.
 */
export const StatusPill = ({ tone = "neutral", dot = false, children, className, title }: StatusPillProps) => (
  <span className={cn("pill", `pill--${tone}`, className)} title={title}>
    {dot ? <span className="pill__dot" aria-hidden="true" /> : null}
    {children}
  </span>
);

export default StatusPill;
