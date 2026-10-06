import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BannerTone = "info" | "ok" | "warn" | "bad";

export interface BannerProps {
  tone?: BannerTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  role?: "status" | "alert";
}

const ICONS: Record<BannerTone, ReactNode> = {
  info: <Info size={16} />,
  ok: <CheckCircle2 size={16} />,
  warn: <TriangleAlert size={16} />,
  bad: <AlertCircle size={16} />,
};

/** Inline feedback: save confirmations, permission notices, load errors. */
export const Banner = ({ tone = "info", title, children, className, role }: BannerProps) => (
  <div className={cn("banner", `banner--${tone}`, className)} role={role}>
    {ICONS[tone]}
    <div className="grow">
      {title ? <strong>{title}</strong> : null}
      <span>{children}</span>
    </div>
  </div>
);

export default Banner;
