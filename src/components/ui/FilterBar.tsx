import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  /** Usually a search field. Grows to fill the row on a desk. */
  search?: ReactNode;
  /** Selects, chips, the view switch: the strip that scrolls sideways on a phone. */
  children?: ReactNode;
  /** Pushed to the far end on a desk; part of the strip on a phone. */
  end?: ReactNode;
  className?: string;
}

/**
 * The filter row shared by every list screen.
 *
 * On a desk the controls wrap onto as many lines as they need. On a phone they
 * become one horizontally scrollable strip, because wrapped filter rows are what
 * pushed the actual list off the bottom of the screen: by the time the filters
 * finished wrapping at 390px, there was no room left for the records.
 */
export const FilterBar = ({ search, children, end, className }: FilterBarProps) => (
  <div className={cn("filter-bar", className)}>
    {search ? <div className="filter-bar__search">{search}</div> : null}

    {children || end ? (
      <div className="filter-bar__rest">
        {children}
        {end ? <span className="filter-bar__spacer" /> : null}
        {end}
      </div>
    ) : null}
  </div>
);

export default FilterBar;
