import type { HTMLAttributes } from "react";

import { joinClassNames } from "./class-name.js";

export type StatusTone = "danger" | "info" | "neutral" | "success" | "warning";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: StatusTone;
}

const toneClass: Record<StatusTone, string> = {
  danger: "ca-status-danger",
  info: "ca-status-info",
  neutral: "ca-status-neutral",
  success: "ca-status-success",
  warning: "ca-status-warning"
};

export function StatusBadge({ children, className, tone = "neutral", ...props }: StatusBadgeProps) {
  return (
    <span className={joinClassNames("ca-status", toneClass[tone], className)} {...props}>
      {children}
    </span>
  );
}
