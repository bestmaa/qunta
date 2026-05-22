import { open } from "@tauri-apps/plugin-dialog";
import { Button, Panel, StatusBadge, WorkspaceLayout } from "@qunta/ui";
import { useEffect, useState } from "react";

import {
  type DesktopProjectMetadata,
  type DesktopWorkspaceSummary,
  scanWorkspace,
  validateProjectPath
} from "./desktop-commands.js";
import { AgentTimeline, type AgentTimelineEvent } from "./AgentTimeline.js";
import { FileTree, type FileTreeEntry } from "./FileTree.js";
import { PromptComposer } from "./PromptComposer.js";

const recentProjectsKey = "qunta.recentProjects";
const mockEvents: readonly AgentTimelineEvent[] = [
  { id: "evt-1", title: "Prepared project context", type: "thinking" },
  { id: "evt-2", title: "Read package metadata", type: "file_read", detail: "package.json" },
  { id: "evt-3", title: "Requested verification command", type: "command_request", detail: "pnpm test" },
  { id: "evt-4", title: "Verification ready", type: "test_result", detail: "No command has run yet." }
];
const mockFiles: readonly FileTreeEntry[] = [
  { path: "package.json", status: "modified" },
  { path: "src/App.tsx", status: "modified" },
  { path: "src/PromptComposer.tsx", status: "added" },
  { path: ".env", status: "unchanged" },
  { path: "node_modules/react/index.js", status: "unchanged" }
];

type ApprovalState = "approved" | "pending" | "rejected";

export function App() {
  const [activeProject, setActiveProject] = useState<DesktopProjectMetadata | null>(null);
  const [workspaceSummary, setWorkspaceSummary] = useState<DesktopWorkspaceSummary | null>(null);
  const [recentProjects, setRecentProjects] = useState<readonly DesktopProjectMetadata[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [approvalState, setApprovalState] = useState<ApprovalState>("pending");
  const [approvalAudit, setApprovalAudit] = useState("Waiting for user decision");
  const [composerStatus, setComposerStatus] = useState("Composer ready");

  useEffect(() => {
    setRecentProjects(readRecentProjects());
  }, []);

  async function chooseProject() {
    setPickerError(null);
    setIsPicking(true);

    try {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected !== "string") {
        return;
      }

      const metadata = await validateProjectPath(selected);
      const nextProjects = rememberProject(metadata, recentProjects);
      await activateProject(metadata);
      setRecentProjects(nextProjects);
      localStorage.setItem(recentProjectsKey, JSON.stringify(nextProjects));
    } catch (error) {
      setPickerError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsPicking(false);
    }
  }

  async function activateProject(project: DesktopProjectMetadata) {
    setActiveProject(project);
    setWorkspaceSummary(await scanWorkspace(project.path));
  }

  return (
    <WorkspaceLayout
      activity={
        <div className="activity-shell">
          <header className="project-header">
            <div>
              <h1>{activeProject ? activeProject.name : "No project selected"}</h1>
              <p>{activeProject?.path ?? "Open a local folder to prepare a coding session."}</p>
            </div>
            <Button disabled={!activeProject} tone="primary">
              New Session
            </Button>
          </header>
          <Panel heading="Session">
            {activeProject ? (
              <div className="project-summary">
                <StatusBadge tone={activeProject.isGitRepository ? "success" : "neutral"}>
                  {activeProject.isGitRepository ? "Git workspace" : "Folder workspace"}
                </StatusBadge>
                {workspaceSummary ? (
                  <div className="summary-grid">
                    <SummaryRow label="Languages" values={workspaceSummary.languages} />
                    <SummaryRow label="Managers" values={workspaceSummary.packageManagers} />
                    <SummaryRow label="Tests" values={workspaceSummary.testCommands} />
                    <SummaryRow label="Git" values={[workspaceSummary.gitState]} />
                  </div>
                ) : (
                  <div className="loading-state">Scanning workspace...</div>
                )}
              </div>
            ) : (
              <div className="empty-state">Select a project to start a coding session.</div>
            )}
          </Panel>
          <div className="session-surface">
            <div className="session-placeholder">{composerStatus}</div>
            <AgentTimeline events={mockEvents} />
            <PromptComposer
              disabled={!activeProject}
              onCancel={() => setComposerStatus("Session cancelled")}
              onSubmit={(prompt) => setComposerStatus(`Queued: ${prompt}`)}
            />
            <div className="error-strip">No active runtime errors.</div>
          </div>
          <footer className="status-bar">
            <span>Profile: Suggest</span>
            <span>Gateway: ready</span>
            <span>Sidecar: diagnostics pending</span>
          </footer>
        </div>
      }
      details={
        <div className="details-stack">
          <Panel heading="Status">
            <div className="status-stack">
              <StatusBadge tone="success">Shell ready</StatusBadge>
              {activeProject ? <span>{activeProject.name}</span> : <span>No project selected</span>}
            </div>
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
                <span>{activeProject?.path ?? "No project selected"}</span>
                <span>Medium risk</span>
                <span>Verify project after changes</span>
              </div>
              <div className="approval-actions">
                <Button
                  disabled={!activeProject || approvalState !== "pending"}
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
        </div>
      }
      sidebar={
        <Panel
          actions={
            <Button disabled={isPicking} onClick={chooseProject} size="sm">
              {isPicking ? "Opening" : "Open"}
            </Button>
          }
          heading="Projects"
        >
          {pickerError ? <div className="error-text">{pickerError}</div> : null}
          <div className="project-list">
            {recentProjects.length === 0 ? (
              <div className="empty-state">No recent projects.</div>
            ) : (
              recentProjects.map((project) => (
                <button
                  className="project-list-item"
                  key={project.id}
                  onClick={() => {
                    void activateProject(project);
                  }}
                  type="button"
                >
                  <span>{project.name}</span>
                  <small>{project.path}</small>
                </button>
              ))
            )}
          </div>
          <FileTree
            entries={mockFiles}
            ignoredEntries={workspaceSummary?.ignoredEntries ?? ["node_modules"]}
          />
        </Panel>
      }
    />
  );
}

function rememberProject(
  project: DesktopProjectMetadata,
  projects: readonly DesktopProjectMetadata[]
): readonly DesktopProjectMetadata[] {
  return [project, ...projects.filter((item) => item.id !== project.id)].slice(0, 8);
}

function readRecentProjects(): readonly DesktopProjectMetadata[] {
  try {
    const raw = localStorage.getItem(recentProjectsKey);
    return raw ? (JSON.parse(raw) as readonly DesktopProjectMetadata[]) : [];
  } catch {
    return [];
  }
}

function SummaryRow({
  label,
  values
}: {
  readonly label: string;
  readonly values: readonly string[];
}) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{values.length > 0 ? values.join(", ") : "None detected"}</strong>
    </div>
  );
}
