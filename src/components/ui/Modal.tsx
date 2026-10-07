import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOverlay } from "./useOverlay";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Action row. Put the primary action last: it is the closest to the thumb. */
  footer?: ReactNode;
  /** Extra class on the sheet, e.g. `confirm` for a confirmation dialog. */
  className?: string;
  /** Hide the close button when the footer already offers a way out. */
  hideClose?: boolean;
  "aria-label"?: string;
}

/**
 * A focused task.
 *
 * On a desk this is a centred dialog; on a phone it is the full screen, because
 * a floating dialog at 320px leaves no room for the form and none for the
 * keyboard. Escape closes it, the page behind it cannot scroll, and focus is
 * held inside until it closes.
 */
export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
  hideClose = false,
  ...rest
}: ModalProps) => {
  const containerRef = useOverlay(open, onClose);

  /* The portal is mounted on <body> so no ancestor's transform, filter or
     overflow can clip or reposition the sheet. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.dataset.modalOpen;
    document.body.dataset.modalOpen = "true";
    return () => {
      if (previous === undefined) delete document.body.dataset.modalOpen;
      else document.body.dataset.modalOpen = previous;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        className={cn("modal__sheet", className)}
        role="dialog"
        aria-modal="true"
        aria-label={rest["aria-label"]}
      >
        <div className="modal__head">
          <div className="modal__titles">
            <div className="modal__title">{title}</div>
            {subtitle ? <div className="modal__sub">{subtitle}</div> : null}
          </div>
          {hideClose ? null : (
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
              <X size={17} />
            </button>
          )}
        </div>

        <div className="modal__body">{children}</div>

        {footer ? <div className="modal__foot">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
