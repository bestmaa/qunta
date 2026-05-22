import type { HTMLAttributes, ReactNode } from "react";

import { joinClassNames } from "./class-name.js";

export interface WorkspaceLayoutProps extends HTMLAttributes<HTMLDivElement> {
  readonly activity: ReactNode;
  readonly details: ReactNode;
  readonly sidebar: ReactNode;
}

export function WorkspaceLayout({
  activity,
  className,
  details,
  sidebar,
  ...props
}: WorkspaceLayoutProps) {
  return (
    <div className={joinClassNames("ca-workspace", className)} {...props}>
      <aside className="ca-workspace-sidebar">{sidebar}</aside>
      <main className="ca-workspace-activity">{activity}</main>
      <aside className="ca-workspace-details">{details}</aside>
    </div>
  );
}
