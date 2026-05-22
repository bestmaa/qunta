import { Button, StatusBadge } from "@qunta/ui";
import { useState } from "react";

export type DiffStatus = "added" | "deleted" | "modified";

export interface DiffFile {
  readonly path: string;
  readonly status: DiffStatus;
  readonly hunks: readonly string[];
}

export interface DiffViewerProps {
  readonly files: readonly DiffFile[];
}

const maxDiffLines = 80;

export function truncateDiff(lines: readonly string[]) {
  if (lines.length <= maxDiffLines) {
    return { lines, truncated: false };
  }

  return {
    lines: [...lines.slice(0, 50), "... diff truncated ...", ...lines.slice(-20)],
    truncated: true
  };
}

export function DiffViewer({ files }: DiffViewerProps) {
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "rejected">>({});
  const [activePath, setActivePath] = useState(files[0]?.path ?? "");
  const activeFile = files.find((file) => file.path === activePath) ?? files[0];
  const truncated = activeFile ? truncateDiff(activeFile.hunks) : undefined;

  if (!activeFile || !truncated) {
    return <div className="empty-state">No patch preview.</div>;
  }

  return (
    <div className="diff-viewer">
      <div className="diff-file-list">
        {files.map((file) => (
          <button
            className="diff-file-tab"
            key={file.path}
            onClick={() => setActivePath(file.path)}
            type="button"
          >
            <span>{file.path}</span>
            <StatusBadge tone={file.status === "deleted" ? "danger" : "info"}>
              {decisions[file.path] ?? file.status}
            </StatusBadge>
          </button>
        ))}
      </div>
      <div className="diff-toolbar">
        <Button onClick={() => void navigator.clipboard?.writeText(activeFile.path)} size="sm">
          Copy Path
        </Button>
        <Button disabled={Object.values(decisions).every((value) => value !== "accepted")} size="sm">
          Apply Accepted
        </Button>
        <Button onClick={() => setDecisions({ ...decisions, [activeFile.path]: "accepted" })} size="sm">
          Accept
        </Button>
        <Button
          onClick={() => setDecisions({ ...decisions, [activeFile.path]: "rejected" })}
          size="sm"
          tone="danger"
        >
          Reject
        </Button>
      </div>
      <pre className="diff-lines">
        {truncated.lines.map((line, index) => (
          <span className={lineClass(line)} key={`${activeFile.path}-${index}`}>
            {line}
          </span>
        ))}
      </pre>
    </div>
  );
}

function lineClass(line: string) {
  if (line.startsWith("+")) {
    return "diff-line diff-line-added";
  }

  if (line.startsWith("-")) {
    return "diff-line diff-line-deleted";
  }

  return "diff-line";
}
