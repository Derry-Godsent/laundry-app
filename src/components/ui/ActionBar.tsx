import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ActionBarProps {
  children: ReactNode;
  /** Optional left-hand text, e.g. a selection count. */
  note?: ReactNode;
  className?: string;
}

/**
 * The primary actions for whatever is on screen.
 *
 * On a desk it is a row at the end of the panel. On a phone it sticks to the
 * bottom of the viewport, clear of the home indicator and the on-screen
 * keyboard, so the action that matters is inside thumb reach instead of below
 * the last card in the list.
 */
export const ActionBar = ({ children, note, className }: ActionBarProps) => (
  <div className={cn("action-bar", className)} role="group">
    {note ? <span className="action-bar__note">{note}</span> : null}
    {children}
  </div>
);

export default ActionBar;
