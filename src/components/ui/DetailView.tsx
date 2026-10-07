import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DetailViewProps {
  /** Heading: usually the record's name or number. */
  title: ReactNode;
  subtitle?: ReactNode;
  /** Buttons for the record: edit, print, advance. */
  actions?: ReactNode;
  children: ReactNode;
  /** The primary action row, pinned to the bottom of the panel on a phone. */
  footer?: ReactNode;
  /**
   * Phone behaviour: `overlay` takes over the screen with a back button,
   * `inline` stays in the layout. Use `overlay` for list-to-detail screens
   * where the list is still behind the panel.
   */
  variant?: "overlay" | "inline";
  /** Called by the back button and by Escape when the panel is an overlay. */
  onClose?: () => void;
  className?: string;
}

/**
 * One record, in full.
 *
 * On a desk it is the second column beside the list. On a phone it becomes a
 * takeover screen with its own back button: a two-column list-and-detail layout
 * cannot fit 390px, and pushing the detail below the list means scrolling past
 * every record before you can act on one.
 */
export const DetailView = ({
  title,
  subtitle,
  actions,
  children,
  footer,
  variant = "inline",
  onClose,
  className,
}: DetailViewProps) => {
  const isOverlay = variant === "overlay";

  return (
    <aside
      className={cn("detail-view", isOverlay && "is-overlay", className)}
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div className="detail-view__bar">
        {isOverlay && onClose ? (
          <button type="button" className="detail-view__back" onClick={onClose} data-autofocus>
            <ArrowLeft size={15} /> Back
          </button>
        ) : null}

        <div className="detail-view__titles">
          <div className="detail-view__title">{title}</div>
          {subtitle ? <div className="detail-view__sub">{subtitle}</div> : null}
        </div>

        {actions ? <div className="detail-view__actions">{actions}</div> : null}
      </div>

      <div className="detail-view__body">{children}</div>

      {footer ? <div className="action-bar">{footer}</div> : null}
    </aside>
  );
};

export default DetailView;
