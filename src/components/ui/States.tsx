import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingRowsProps {
  /** How many placeholder rows to draw. Four fits a phone screen. */
  rows?: number;
  className?: string;
  /** Screen-reader text; the rows themselves are decorative. */
  label?: string;
}

/**
 * A list that is still loading.
 *
 * Placeholder rows rather than a spinner: the page keeps its shape, and a slow
 * connection does not look like an empty list.
 */
export const LoadingRows = ({ rows = 4, className, label = "Loading" }: LoadingRowsProps) => (
  <div className={cn("loading-rows", className)} role="status" aria-label={label}>
    {Array.from({ length: rows }).map((_, index) => (
      <div className="loading-rows__row" key={index}>
        <div className="loading-rows__dot skeleton" />
        <div className="loading-rows__lines">
          <div
            className="loading-rows__line skeleton"
            style={{ width: index % 2 === 0 ? "62%" : "44%" }}
          />
          <div className="loading-rows__line skeleton" style={{ width: "34%" }} />
        </div>
      </div>
    ))}
  </div>
);

export interface ErrorStateProps {
  title?: string;
  /** What went wrong, in plain words, and what the reader can do about it. */
  message: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/** A request that failed, with the one action that might fix it. */
export const ErrorState = ({
  title = "That did not load",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) => (
  <div className={cn("state-block", className)} role="alert">
    <div className="state-block__icon">
      <AlertTriangle size={20} />
    </div>
    <h3>{title}</h3>
    <p>{message}</p>
    {onRetry ? (
      <button type="button" className="btn btn--secondary" onClick={onRetry} style={{ marginTop: "var(--sp-3)" }}>
        <RefreshCw size={15} /> {retryLabel}
      </button>
    ) : null}
  </div>
);

export default LoadingRows;
