import { open } from "@tauri-apps/plugin-dialog";
import { Button, Panel, StatusBadge, WorkspaceLayout } from "@qunta/ui";
import { canTransition } from "@qunta/shared-types";
import { useEffect, useState } from "react";

import {
  type DesktopProjectMetadata,
  type DesktopWorkspaceSummary,
  scanWorkspace,
  validateProjectPath
} from "./desktop-commands.js";
import { AgentTimeline } from "./AgentTimeline.js";
import { DetailsPanels } from "./DetailsPanels.js";
import { DiffViewer } from "./DiffViewer.js";
import { FileTree } from "./FileTree.js";
import { mockDiffs, mockEvents, mockFiles } from "./mock-data.js";
import { PromptComposer } from "./PromptComposer.js";
import {
  approvalModeLabel,
  buildRunnerConfig,
  type ApprovalMode
} from "./runner-config.js";
import { useMockRunner } from "./useMockRunner.js";

const recentProjectsKey = "qunta.recentProjects";

export function App() {
  const [activeProject, setActiveProject] = useState<DesktopProjectMetadata | null>(null);
  const [workspaceSummary, setWorkspaceSummary] = useState<DesktopWorkspaceSummary | null>(null);
  const [recentProjects, setRecentProjects] = useState<readonly DesktopProjectMetadata[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>("suggest");
  const runner = useMockRunner(mockEvents, buildRunnerConfig(activeProject, approvalMode));

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
            <Button disabled={!activeProject || !canTransition("idle", "start")} tone="primary">
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
            <div className="session-placeholder">Session state: {runner.status}</div>
            <AgentTimeline events={runner.events} />
            <DiffViewer files={mockDiffs} />
            <PromptComposer
              disabled={!activeProject}
              isRunning={runner.isRunning}
              onCancel={runner.cancel}
              onSubmit={runner.start}
            />
            <div className="error-strip">No active runtime errors.</div>
          </div>
          <footer className="status-bar">
            <span>Profile: {approvalModeLabel(approvalMode)}</span>
            <span>Session: {runner.status}</span>
            <span>Gateway: ready</span>
            <span>Sidecar: diagnostics pending</span>
          </footer>
        </div>
      }
      details={
        <DetailsPanels
          approvalMode={approvalMode}
          isSessionRunning={runner.isRunning}
          onApprovalModeChange={setApprovalMode}
          project={activeProject}
          workspaceSummary={workspaceSummary}
        />
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
