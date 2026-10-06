import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
}

/** Standard surface. Everything on a staff page sits on one of these. */
export const Card = ({
  interactive = false,
  padded = false,
  className,
  children,
  ...rest
}: CardProps) => (
  <div
    className={cn("card", padded && "card--pad", interactive && "card--interactive", className)}
    {...rest}
  >
    {children}
  </div>
);

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  borderless?: boolean;
}

export const CardHeader = ({
  title,
  subtitle,
  actions,
  borderless = false,
  className,
  ...rest
}: CardHeaderProps) => (
  <div className={cn("card-header", borderless && "card-header--borderless", className)} {...rest}>
    <div className="grow">
      <div className="section-title">{title}</div>
      {subtitle ? <div className="section-sub">{subtitle}</div> : null}
    </div>
    {actions ? <div className="row" style={{ gap: "var(--sp-2)" }}>{actions}</div> : null}
  </div>
);

export const CardBody = ({
  tight = false,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tight?: boolean }) => (
  <div className={cn("card-body", tight && "card-body--tight", className)} {...rest}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("card-footer", className)} {...rest}>
    {children}
  </div>
);

export default Card;
