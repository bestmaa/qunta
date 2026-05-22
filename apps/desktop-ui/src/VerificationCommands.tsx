import { Button, StatusBadge } from "@qunta/ui";
import { useState } from "react";

export interface VerificationCommandsProps {
  readonly commands: readonly string[];
  readonly cwd?: string | undefined;
}

export function VerificationCommands({ commands, cwd }: VerificationCommandsProps) {
  const [approvedCommand, setApprovedCommand] = useState<string | null>(null);

  return (
    <div className="verification-panel">
      {commands.length === 0 ? (
        <div className="empty-state">No verification commands detected.</div>
      ) : (
        commands.map((command) => (
          <div className="verification-command" key={command}>
            <div>
              <strong>{command}</strong>
              <span>{cwd ?? "Select a project first"}</span>
            </div>
            <Button disabled={!cwd} onClick={() => setApprovedCommand(command)} size="sm">
              Approve Run
            </Button>
          </div>
        ))
      )}
      {approvedCommand ? (
        <StatusBadge tone="warning">Queued for approval: {approvedCommand}</StatusBadge>
      ) : null}
    </div>
  );
}
