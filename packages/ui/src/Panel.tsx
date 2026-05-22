import type { HTMLAttributes, ReactNode } from "react";

import { joinClassNames } from "./class-name.js";

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  readonly actions?: ReactNode;
  readonly heading?: ReactNode;
}

export function Panel({ actions, children, className, heading, ...props }: PanelProps) {
  return (
    <section className={joinClassNames("ca-panel", className)} {...props}>
      {heading || actions ? (
        <header className="ca-panel-header">
          {heading ? <h2 className="ca-panel-title">{heading}</h2> : null}
          {actions ? <div className="ca-panel-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="ca-panel-body">{children}</div>
    </section>
  );
}
