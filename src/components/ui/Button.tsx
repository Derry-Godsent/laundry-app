import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Two levels per meaning. A solid variant commits something; a tinted variant
 * is a real action that does not need to shout. Both are flat colours, and the
 * hue says what the button is for.
 */
type Variant =
  | "primary"    /* solid accent: the one action that moves the record on   */
  | "secondary"  /* neutral surface, the default                            */
  | "ghost"      /* label only, for the least important action              */
  | "accent"     /* tinted accent                                           */
  | "ok"         /* solid confirm                                           */
  | "ok-tint"    /* tinted confirm                                          */
  | "warn"       /* solid caution                                           */
  | "warn-tint"  /* tinted caution                                          */
  | "info"       /* tinted information                                      */
  | "danger"     /* tinted decline; the row-level destructive action        */
  | "danger-strong"; /* solid destructive; the confirm inside a dialog      */
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Renders a square, icon-only button. Always pass `aria-label`. */
  iconOnly?: boolean;
  block?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

/**
 * The single button in the staff console.
 *
 * Every page used to hand-roll its own `.btn-primary` / `.mr-save` /
 * `.dash-error-retry`; they all render through this component now so hover,
 * focus, disabled and loading states stay identical everywhere.
 */
export const Button = ({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  block = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "btn",
      `btn--${variant}`,
      size !== "md" && `btn--${size}`,
      iconOnly && "btn--icon",
      block && "btn--block",
      className
    )}
    {...rest}
  >
    {leadingIcon}
    {children}
    {trailingIcon}
  </button>
);

export default Button;
