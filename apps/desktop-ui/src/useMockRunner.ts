import { transitionSession, type SessionStatus } from "@qunta/shared-types";
import { useRef, useState } from "react";

import type { AgentTimelineEvent } from "./AgentTimeline.js";

export interface MockRunnerState {
  readonly events: readonly AgentTimelineEvent[];
  readonly isRunning: boolean;
  readonly start: (prompt: string) => void;
  readonly cancel: () => void;
  readonly status: SessionStatus;
}

export function useMockRunner(seedEvents: readonly AgentTimelineEvent[]): MockRunnerState {
  const [events, setEvents] = useState(seedEvents);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }

    timers.current = [];
  }

  function start(prompt: string) {
    clearTimers();
    setStatus(transitionSession({ status: "idle" }, "start").status);
    setEvents([
      event("start", "Session queued", "thinking", prompt),
      event("ctx", "Project context attached", "file_read", "workspace summary")
    ]);

    timers.current = [
      setTimeout(() => {
        setStatus(transitionSession({ status: "starting" }, "started").status);
        setEvents((current) => [
          ...current,
          event("cmd", "Command approval requested", "command_request", "pnpm test")
        ]);
      }, 120),
      setTimeout(() => {
        setStatus(transitionSession({ status: "running" }, "complete").status);
        setEvents((current) => [
          ...current,
          event("done", "Mock runner completed", "completed", "No files were changed.")
        ]);
      }, 320)
    ];
  }

  function cancel() {
    clearTimers();
    setStatus("cancelled");
    setEvents((current) => [
      ...current,
      event("cancel", "Mock runner cancelled", "completed", "Pending process stopped.")
    ]);
  }

  return {
    cancel,
    events,
    isRunning: status === "starting" || status === "running" || status === "waiting_approval",
    start,
    status
  };
}

function event(
  id: string,
  title: string,
  type: AgentTimelineEvent["type"],
  detail: string
): AgentTimelineEvent {
  return {
    detail,
    id: `${id}-${Date.now()}`,
    title,
    type
  };
}
