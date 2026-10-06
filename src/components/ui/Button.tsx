import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "danger" | "ok";
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
