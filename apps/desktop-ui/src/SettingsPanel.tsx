import { Button, StatusBadge } from "@qunta/ui";
import { useEffect, useState } from "react";

import { exportDiagnosticsBundle, type DesktopProjectMetadata } from "./desktop-commands.js";
import { approvalModeLabel, type ApprovalMode } from "./runner-config.js";

type UpdateChannel = "beta" | "stable";

interface LocalSettings {
  readonly approvalMode: ApprovalMode;
  readonly projectPermissionModes: Record<string, ApprovalMode>;
  readonly telemetryEnabled: boolean;
  readonly trustedCommandsCleared: boolean;
  readonly updateChannel: UpdateChannel;
}

interface CloudSettings {
  readonly accountStatus: "active" | "trialing";
  readonly planName: string;
}

const settingsKey = "qunta.desktopSettings";

const defaultLocalSettings: LocalSettings = {
  approvalMode: "suggest",
  projectPermissionModes: {},
  telemetryEnabled: false,
  trustedCommandsCleared: false,
  updateChannel: "stable"
};

const cloudSettings: CloudSettings = {
  accountStatus: "trialing",
  planName: "Free"
};

export interface SettingsPanelProps {
  readonly approvalMode: ApprovalMode;
  readonly isSessionRunning: boolean;
  readonly onApprovalModeChange: (mode: ApprovalMode) => void;
  readonly project: DesktopProjectMetadata | null;
}

export function SettingsPanel({
  approvalMode,
  isSessionRunning,
  onApprovalModeChange,
  project
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<LocalSettings>(defaultLocalSettings);
  const [confirmDanger, setConfirmDanger] = useState(false);
  const [confirmRunningMode, setConfirmRunningMode] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [diagnosticState, setDiagnosticState] = useState("Diagnostics ready");

  useEffect(() => {
    const nextSettings = readLocalSettings();
    setSettings(nextSettings);
    const projectMode = project ? nextSettings.projectPermissionModes[project.id] : undefined;
    onApprovalModeChange(projectMode ?? nextSettings.approvalMode);
  }, [project?.id]);

  function saveSettings(nextSettings: LocalSettings) {
    setSettings(nextSettings);
    localStorage.setItem(settingsKey, JSON.stringify(nextSettings));
  }

  function saveApprovalMode(mode: ApprovalMode) {
    const nextSettings = {
      ...settings,
      approvalMode: mode,
      projectPermissionModes: project
        ? { ...settings.projectPermissionModes, [project.id]: mode }
        : settings.projectPermissionModes
    };
    saveSettings(nextSettings);
    onApprovalModeChange(mode);
    setDiagnosticState(
      isSessionRunning && !confirmRunningMode
        ? "Saved for new sessions"
        : "Runner config updated"
    );
  }

  return (
    <div className="settings-panel">
      <section>
        <div className="settings-row">
          <span>Account</span>
          <StatusBadge tone="success">{cloudSettings.accountStatus}</StatusBadge>
        </div>
        <strong>{cloudSettings.planName}</strong>
      </section>
      <section>
        <label>
          Project
          <select disabled={!project} value={project?.id ?? "none"}>
            <option value={project?.id ?? "none"}>{project?.name ?? "No project selected"}</option>
          </select>
        </label>
      </section>
      <section>
        <label>
          Permissions
          <select
            onChange={(event) =>
              saveApprovalMode(event.target.value as ApprovalMode)
            }
            value={approvalMode}
          >
            <option value="suggest">Suggest</option>
            <option value="auto_edit">Auto edit</option>
            <option value="controlled_full">Controlled full</option>
          </select>
        </label>
        <span>Mode: {approvalModeLabel(approvalMode)}. Changes are for new sessions.</span>
        <label className="settings-toggle">
          <input
            checked={confirmRunningMode}
            disabled={!isSessionRunning}
            onChange={(event) => setConfirmRunningMode(event.target.checked)}
            type="checkbox"
          />
          Apply during running session
        </label>
      </section>
      <section className="settings-row">
        <label className="settings-toggle">
          <input
            checked={settings.telemetryEnabled}
            onChange={(event) =>
              saveSettings({ ...settings, telemetryEnabled: event.target.checked })
            }
            type="checkbox"
          />
          Telemetry
        </label>
        <select
          onChange={(event) =>
            saveSettings({ ...settings, updateChannel: event.target.value as UpdateChannel })
          }
          value={settings.updateChannel}
        >
          <option value="stable">Stable</option>
          <option value="beta">Beta</option>
        </select>
      </section>
      <section className="settings-row">
        <Button
          onClick={() => {
            void exportDiagnosticsBundle(privacyMode).then((bundle) => {
              setDiagnosticState(`Diagnostics exported for ${bundle.os}`);
            }).catch(() => setDiagnosticState("Diagnostics export unavailable"));
          }}
          size="sm"
        >
          Diagnostics
        </Button>
        <span>{diagnosticState}</span>
      </section>
      <section>
        <label className="settings-toggle">
          <input
            checked={privacyMode}
            onChange={(event) => setPrivacyMode(event.target.checked)}
            type="checkbox"
          />
          Privacy mode
        </label>
      </section>
      <section>
        <label className="settings-toggle">
          <input
            checked={confirmDanger}
            onChange={(event) => setConfirmDanger(event.target.checked)}
            type="checkbox"
          />
          Confirm reset
        </label>
        <Button
          disabled={!confirmDanger}
          onClick={() =>
            saveSettings({ ...settings, trustedCommandsCleared: true })
          }
          size="sm"
          tone="danger"
        >
          Reset Trusted Commands
        </Button>
      </section>
    </div>
  );
}

function readLocalSettings(): LocalSettings {
  try {
    return { ...defaultLocalSettings, ...JSON.parse(localStorage.getItem(settingsKey) ?? "{}") };
  } catch {
    return defaultLocalSettings;
  }
}
