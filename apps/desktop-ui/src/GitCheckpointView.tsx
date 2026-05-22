import { Button, StatusBadge } from "@qunta/ui";

import type { DesktopGitCheckpoint, DesktopGitStatusSnapshot } from "./desktop-commands.js";

export interface GitCheckpointViewProps {
  readonly error: string | null;
  readonly isLoading: boolean;
  readonly localCheckpoint: DesktopGitCheckpoint | null;
  readonly onMarkCheckpoint: () => void;
  readonly onRefresh: () => void;
  readonly snapshot: DesktopGitStatusSnapshot | null;
}

export function GitCheckpointView({
  error,
  isLoading,
  localCheckpoint,
  onMarkCheckpoint,
  onRefresh,
  snapshot
}: GitCheckpointViewProps) {
  if (error) {
    return (
      <div className="git-panel">
        <div className="error-text">{error}</div>
        <Button onClick={onRefresh} size="sm">
          Refresh
        </Button>
      </div>
    );
  }

  if (!snapshot) {
    return <div className="empty-state">{isLoading ? "Reading git status..." : "No git status."}</div>;
  }

  return (
    <div className="git-panel">
      <div className="git-header">
        <StatusBadge tone={snapshot.isDirty ? "warning" : "success"}>
          {snapshot.isDirty ? "dirty" : "clean"}
        </StatusBadge>
        <strong>{snapshot.branch}</strong>
      </div>
      <div className="git-files">
        {snapshot.changedFiles.length === 0 ? (
          <span>No changed files.</span>
        ) : (
          snapshot.changedFiles.map((file) => (
            <div className="git-file" key={`${file.status}:${file.path}`}>
              <span>{file.status}</span>
              <strong>{file.path}</strong>
            </div>
          ))
        )}
      </div>
      <div className="checkpoint-card">
        <span>{localCheckpoint ? "Checkpoint saved locally" : snapshot.checkpoint.label}</span>
        <code>{localCheckpoint?.id ?? snapshot.checkpoint.id}</code>
      </div>
      <div className="git-actions">
        <Button disabled={isLoading} onClick={onRefresh} size="sm">
          Refresh
        </Button>
        <Button onClick={onMarkCheckpoint} size="sm" tone="primary">
          Mark Checkpoint
        </Button>
      </div>
    </div>
  );
}
