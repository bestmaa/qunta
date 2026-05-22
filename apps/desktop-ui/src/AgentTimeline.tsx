import { StatusBadge } from "@qunta/ui";

export type AgentEventType =
  | "command_output"
  | "command_request"
  | "completed"
  | "file_read"
  | "patch"
  | "test_result"
  | "thinking";

export interface AgentTimelineEvent {
  readonly id: string;
  readonly title: string;
  readonly type: AgentEventType;
  readonly detail?: string;
}

export interface AgentTimelineProps {
  readonly events: readonly AgentTimelineEvent[];
}

const eventTone: Record<AgentEventType, "info" | "neutral" | "success" | "warning"> = {
  command_output: "neutral",
  command_request: "warning",
  completed: "success",
  file_read: "neutral",
  patch: "info",
  test_result: "success",
  thinking: "info"
};

export function maskSecretText(value: string) {
  return value
    .replace(/(token|secret|password|api[_-]?key)=\S+/gi, "$1=***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***");
}

export function groupTimelineEvents(events: readonly AgentTimelineEvent[]) {
  return events.map((event) => ({
    ...event,
    detail: event.detail ? maskSecretText(compactOutput(event.detail)) : undefined
  }));
}

export function AgentTimeline({ events }: AgentTimelineProps) {
  const grouped = groupTimelineEvents(events);

  return (
    <div className="timeline" role="list">
      {grouped.map((event) => (
        <article className="timeline-event" key={event.id} role="listitem">
          <div className="timeline-event-header">
            <StatusBadge tone={eventTone[event.type]}>{event.type.replace("_", " ")}</StatusBadge>
            <strong>{event.title}</strong>
          </div>
          {event.detail ? <pre>{event.detail}</pre> : null}
        </article>
      ))}
    </div>
  );
}

function compactOutput(value: string) {
  const lines = value.split(/\r?\n/);
  if (lines.length <= 6) {
    return value;
  }

  return [...lines.slice(0, 3), "...", ...lines.slice(-2)].join("\n");
}
