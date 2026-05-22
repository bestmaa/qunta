import type { ButtonHTMLAttributes, ReactNode } from "react";

import { joinClassNames } from "./class-name.js";

export type ButtonTone = "danger" | "neutral" | "primary";

export type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon?: ReactNode;
  readonly size?: ButtonSize;
  readonly tone?: ButtonTone;
}

const toneClass: Record<ButtonTone, string> = {
  danger: "ca-button ca-button-danger",
  neutral: "ca-button ca-button-neutral",
  primary: "ca-button ca-button-primary"
};

const sizeClass: Record<ButtonSize, string> = {
  md: "ca-button-md",
  sm: "ca-button-sm"
};

export function Button({
  children,
  className,
  icon,
  size = "md",
  tone = "neutral",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={joinClassNames(toneClass[tone], sizeClass[size], className)}
      type={type}
      {...props}
    >
      {icon ? <span className="ca-button-icon">{icon}</span> : null}
      <span className="ca-button-label">{children}</span>
    </button>
  );
}
