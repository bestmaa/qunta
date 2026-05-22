import { open } from "@tauri-apps/plugin-dialog";
import { Button, Panel, StatusBadge, WorkspaceLayout } from "@qunta/ui";
import { useEffect, useState } from "react";

import {
  type DesktopProjectMetadata,
  type DesktopWorkspaceSummary,
  scanWorkspace,
  validateProjectPath
} from "./desktop-commands.js";

const recentProjectsKey = "qunta.recentProjects";

export function App() {
  const [activeProject, setActiveProject] = useState<DesktopProjectMetadata | null>(null);
  const [workspaceSummary, setWorkspaceSummary] = useState<DesktopWorkspaceSummary | null>(null);
  const [recentProjects, setRecentProjects] = useState<readonly DesktopProjectMetadata[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

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
        <Panel
          actions={<Button tone="primary">New Session</Button>}
          heading={activeProject ? activeProject.name : "Agent Session"}
        >
          {activeProject ? (
            <div className="project-summary">
              <div className="project-path">{activeProject.path}</div>
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
              ) : null}
            </div>
          ) : (
            <div className="empty-state">Select a project to start a coding session.</div>
          )}
        </Panel>
      }
      details={
        <Panel heading="Status">
          <div className="status-stack">
            <StatusBadge tone="success">Shell ready</StatusBadge>
            {activeProject ? <span>{activeProject.name}</span> : <span>No project selected</span>}
          </div>
        </Panel>
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
