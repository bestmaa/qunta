import { Button, StatusBadge } from "@qunta/ui";
import { useEffect, useState } from "react";

import type { DesktopProjectMetadata } from "./desktop-commands.js";

type ApprovalMode = "auto_edit" | "controlled_full" | "suggest";
type UpdateChannel = "beta" | "stable";

interface LocalSettings {
  readonly approvalMode: ApprovalMode;
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
  telemetryEnabled: false,
  trustedCommandsCleared: false,
  updateChannel: "stable"
};

const cloudSettings: CloudSettings = {
  accountStatus: "trialing",
  planName: "Free"
};

export interface SettingsPanelProps {
  readonly project: DesktopProjectMetadata | null;
}

export function SettingsPanel({ project }: SettingsPanelProps) {
  const [settings, setSettings] = useState<LocalSettings>(defaultLocalSettings);
  const [confirmDanger, setConfirmDanger] = useState(false);
  const [diagnosticState, setDiagnosticState] = useState("Diagnostics ready");

  useEffect(() => {
    setSettings(readLocalSettings());
  }, []);

  function saveSettings(nextSettings: LocalSettings) {
    setSettings(nextSettings);
    localStorage.setItem(settingsKey, JSON.stringify(nextSettings));
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
              saveSettings({ ...settings, approvalMode: event.target.value as ApprovalMode })
            }
            value={settings.approvalMode}
          >
            <option value="suggest">Suggest</option>
            <option value="auto_edit">Auto edit</option>
            <option value="controlled_full">Controlled full</option>
          </select>
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
        <Button onClick={() => setDiagnosticState("Diagnostics bundle staged")} size="sm">
          Diagnostics
        </Button>
        <span>{diagnosticState}</span>
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
