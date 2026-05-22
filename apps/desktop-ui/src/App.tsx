import { Button, Panel, StatusBadge, WorkspaceLayout } from "@qunta/ui";

export function App() {
  return (
    <WorkspaceLayout
      activity={
        <Panel
          actions={<Button tone="primary">New Session</Button>}
          heading="Agent Session"
        >
          <div className="empty-state">Select a project to start a coding session.</div>
        </Panel>
      }
      details={
        <Panel heading="Status">
          <StatusBadge tone="success">Shell ready</StatusBadge>
        </Panel>
      }
      sidebar={
        <Panel heading="Projects">
          <Button size="sm">Open Project</Button>
        </Panel>
      }
    />
  );
}
