import { Button, StatusBadge } from "@qunta/ui";
import { useState, type KeyboardEvent } from "react";

export interface PromptComposerProps {
  readonly disabled?: boolean;
  readonly isRunning?: boolean;
  readonly onCancel?: () => void;
  readonly onSubmit?: (prompt: string, includeProjectContext: boolean) => void;
}

export function canSubmitPrompt(prompt: string, disabled = false, isRunning = false) {
  return prompt.trim().length > 0 && !disabled && !isRunning;
}

export function PromptComposer({
  disabled = false,
  isRunning = false,
  onCancel,
  onSubmit
}: PromptComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [includeProjectContext, setIncludeProjectContext] = useState(true);
  const [attachments, setAttachments] = useState<readonly string[]>([]);
  const canSend = canSubmitPrompt(prompt, disabled, isRunning);

  function submit() {
    if (!canSend) {
      return;
    }

    onSubmit?.(prompt.trim(), includeProjectContext);
    setPrompt("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  function addAttachment() {
    if (!attachments.includes("workspace-summary.md")) {
      setAttachments([...attachments, "workspace-summary.md"]);
    }
  }

  return (
    <div className="composer">
      <div className="composer-topline">
        <label className="composer-toggle">
          <input
            checked={includeProjectContext}
            disabled={disabled || isRunning}
            onChange={(event) => setIncludeProjectContext(event.currentTarget.checked)}
            type="checkbox"
          />
          <span>Project context</span>
        </label>
        <StatusBadge tone={isRunning ? "warning" : "neutral"}>
          {isRunning ? "Running" : "Ready"}
        </StatusBadge>
      </div>
      <textarea
        className="composer-input"
        disabled={disabled || isRunning}
        onChange={(event) => setPrompt(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Qunta to inspect, edit, or verify this project..."
        rows={4}
        value={prompt}
      />
      <div className="attachment-row">
        {attachments.length === 0 ? (
          <span>No attachments</span>
        ) : (
          attachments.map((attachment) => (
            <button
              className="attachment-chip"
              key={attachment}
              onClick={() => setAttachments(attachments.filter((item) => item !== attachment))}
              type="button"
            >
              {attachment}
            </button>
          ))
        )}
      </div>
      <div className="composer-actions">
        <Button disabled={disabled || isRunning} onClick={addAttachment} size="sm">
          Attach
        </Button>
        <div className="composer-submit">
          <Button disabled={!isRunning} onClick={onCancel} size="sm" tone="danger">
            Cancel
          </Button>
          <Button disabled={!canSend} onClick={submit} size="sm" tone="primary">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
