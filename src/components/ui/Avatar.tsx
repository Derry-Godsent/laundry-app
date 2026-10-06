import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: "sm" | "md" | "lg";
  /**
   * Tint this avatar for one person. Pass a stable hue so the same customer
   * keeps the same colour in every list they appear in.
   */
  hue?: number;
}

export const Avatar = ({ name, size = "md", hue, className, style, ...rest }: AvatarProps) => {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <span
      className={cn("avatar", size !== "md" && `avatar--${size}`, className)}
      style={
        hue === undefined
          ? style
          : {
              ...style,
              background: `hsl(${hue}, 34%, 20%)`,
              borderColor: `hsl(${hue}, 40%, 30%)`,
              color: `hsl(${hue}, 58%, 70%)`,
            }
      }
      aria-hidden="true"
      {...rest}
    >
      {initials}
    </span>
  );
};

export default Avatar;
