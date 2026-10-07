import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type ConfirmTone = "danger" | "brand" | "ok";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** Plain words: what will happen, and whether it can be undone. */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** Shows a busy confirm button while the request is in flight. */
  busy?: boolean;
}

const TONE_ICON: Record<ConfirmTone, ReactNode> = {
  danger: <AlertTriangle size={19} />,
  brand: <Info size={19} />,
  ok: <CheckCircle2 size={19} />,
};

const TONE_VARIANT = {
  danger: "danger",
  brand: "primary",
  ok: "ok",
} as const;

/**
 * A decision that changes a record: delete, archive, advance a stage.
 *
 * One dialog for the whole console, so the wording, the tone and the position of
 * the buttons are the same every time staff are asked to confirm something.
 * On a phone it is the screen, and the decision sits at the bottom.
 */
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
}: ConfirmDialogProps) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    className={`confirm confirm--${tone}`}
    aria-label={title}
    footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </Button>
        <span className="modal__spacer" />
        <Button
          variant={TONE_VARIANT[tone]}
          onClick={onConfirm}
          disabled={busy}
          data-autofocus
        >
          {busy ? "Working..." : confirmLabel}
        </Button>
      </>
    }
  >
    <div className="confirm__body">
      <div className="confirm__icon">{TONE_ICON[tone]}</div>
      <p className="confirm__text">{message}</p>
    </div>
  </Modal>
);

export default ConfirmDialog;
