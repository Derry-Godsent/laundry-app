import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOverlay } from "./useOverlay";

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
 *
 * The takeover is rendered on <body> rather than in place, because it has to
 * cover the screen whatever the page around it is doing. Any ancestor with a
 * transform, a filter or a scroll container becomes the containing block for a
 * position: fixed descendant, and then the takeover is laid out against the
 * page and scrolls with it, so the header walks off the top and the pinned
 * action ends up below the fold. It also opens through `useOverlay`, so Escape
 * closes it, focus stays inside it, and the page behind it cannot scroll.
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
  const isTakeover = isOverlay && Boolean(onClose);

  const containerRef = useOverlay(isTakeover, onClose ?? (() => {}));

  const panel = (
    <aside
      ref={isTakeover ? containerRef : undefined}
      className={cn("detail-view", isOverlay && "is-overlay", className)}
      aria-label={typeof title === "string" ? title : undefined}
      role={isTakeover ? "dialog" : undefined}
      aria-modal={isTakeover ? true : undefined}
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

  /* Portalled in the browser; rendered in place where there is no document,
     so the component still renders on the server. */
  if (isTakeover && typeof document !== "undefined") return createPortal(panel, document.body);
  return panel;
};

export default DetailView;
