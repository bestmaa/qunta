export interface ThemeTokens {
  readonly color: {
    readonly background: string;
    readonly border: string;
    readonly danger: string;
    readonly foreground: string;
    readonly muted: string;
    readonly primary: string;
    readonly success: string;
    readonly warning: string;
  };
  readonly radius: {
    readonly md: string;
    readonly sm: string;
  };
  readonly space: {
    readonly lg: string;
    readonly md: string;
    readonly sm: string;
    readonly xs: string;
  };
}

export const themeTokens: ThemeTokens = {
  color: {
    background: "#101214",
    border: "#2d3338",
    danger: "#d04f4f",
    foreground: "#f1f4f6",
    muted: "#89939d",
    primary: "#4f8cff",
    success: "#3fa66b",
    warning: "#d6a84f"
  },
  radius: {
    md: "8px",
    sm: "4px"
  },
  space: {
    lg: "24px",
    md: "16px",
    sm: "8px",
    xs: "4px"
  }
};
