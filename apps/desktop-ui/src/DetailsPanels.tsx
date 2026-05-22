import { Panel, StatusBadge, Button } from "@qunta/ui";
import { useEffect, useState } from "react";

import {
  type DesktopGitCheckpoint,
  type DesktopGitStatusSnapshot,
  type DesktopProjectMetadata,
  type DesktopWorkspaceSummary,
  getGitStatus
} from "./desktop-commands.js";
import { GitCheckpointView } from "./GitCheckpointView.js";
import { mockTerminalGroups } from "./mock-data.js";
import { TerminalLogPanel } from "./TerminalLogPanel.js";
import { VerificationCommands } from "./VerificationCommands.js";

type ApprovalState = "approved" | "pending" | "rejected";

export interface DetailsPanelsProps {
  readonly project: DesktopProjectMetadata | null;
  readonly workspaceSummary: DesktopWorkspaceSummary | null;
}

export function DetailsPanels({ project, workspaceSummary }: DetailsPanelsProps) {
  const [approvalState, setApprovalState] = useState<ApprovalState>("pending");
  const [approvalAudit, setApprovalAudit] = useState("Waiting for user decision");
  const [gitStatus, setGitStatus] = useState<DesktopGitStatusSnapshot | null>(null);
  const [gitError, setGitError] = useState<string | null>(null);
  const [isGitLoading, setIsGitLoading] = useState(false);
  const [localCheckpoint, setLocalCheckpoint] = useState<DesktopGitCheckpoint | null>(null);

  useEffect(() => {
    setLocalCheckpoint(null);
    void refreshGitStatus();
  }, [project?.path]);

  async function refreshGitStatus() {
    if (!project?.isGitRepository) {
      setGitStatus(null);
      setGitError(project ? "Selected folder is not a git repository." : null);
      return;
    }

    setIsGitLoading(true);
    setGitError(null);

    try {
      setGitStatus(await getGitStatus(project.path));
    } catch (error) {
      setGitStatus(null);
      setGitError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsGitLoading(false);
    }
  }

  return (
    <div className="details-stack">
      <Panel heading="Status">
        <div className="status-stack">
          <StatusBadge tone="success">Shell ready</StatusBadge>
          {project ? <span>{project.name}</span> : <span>No project selected</span>}
        </div>
      </Panel>
      <Panel heading="Git Checkpoint">
        <GitCheckpointView
          error={gitError}
          isLoading={isGitLoading}
          localCheckpoint={localCheckpoint}
          onMarkCheckpoint={() => setLocalCheckpoint(gitStatus?.checkpoint ?? null)}
          onRefresh={() => void refreshGitStatus()}
          snapshot={gitStatus}
        />
      </Panel>
      <Panel
        actions={
          <StatusBadge tone={approvalState === "approved" ? "success" : "warning"}>
            {approvalState}
          </StatusBadge>
        }
        heading="Approvals"
      >
        <div className="approval-card">
          <div className="approval-command">pnpm test</div>
          <div className="approval-meta">
            <span>{project?.path ?? "No project selected"}</span>
            <span>Medium risk</span>
            <span>Verify project after changes</span>
          </div>
          <div className="approval-actions">
            <Button
              disabled={!project || approvalState !== "pending"}
              onClick={() => {
                setApprovalState("approved");
                setApprovalAudit("Command approved by user decision");
              }}
              size="sm"
              tone="primary"
            >
              Approve
            </Button>
            <Button
              disabled={approvalState !== "pending"}
              onClick={() => {
                setApprovalState("rejected");
                setApprovalAudit("Command rejected and will not run");
              }}
              size="sm"
              tone="danger"
            >
              Reject
            </Button>
          </div>
          <div className="approval-audit">{approvalAudit}</div>
        </div>
      </Panel>
      <Panel heading="Terminal">
        <TerminalLogPanel groups={mockTerminalGroups} />
      </Panel>
      <Panel heading="Verification">
        <VerificationCommands commands={workspaceSummary?.testCommands ?? []} cwd={project?.path} />
      </Panel>
    </div>
  );
}
