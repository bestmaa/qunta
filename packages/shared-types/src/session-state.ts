import type { SessionStatus } from "./session.type.js";

export type SessionTransition =
  | "apply_patch"
  | "cancel"
  | "complete"
  | "fail"
  | "request_approval"
  | "resolve_approval"
  | "start"
  | "started";

export interface SessionState {
  readonly status: SessionStatus;
  readonly reason?: string;
}

const transitionTable: Record<SessionStatus, Partial<Record<SessionTransition, SessionStatus>>> = {
  applying_patch: {
    complete: "completed",
    fail: "failed"
  },
  cancelled: {},
  completed: {},
  failed: {},
  idle: {
    start: "starting"
  },
  running: {
    apply_patch: "applying_patch",
    cancel: "cancelled",
    complete: "completed",
    fail: "failed",
    request_approval: "waiting_approval"
  },
  starting: {
    cancel: "cancelled",
    fail: "failed",
    started: "running"
  },
  waiting_approval: {
    cancel: "cancelled",
    fail: "failed",
    resolve_approval: "running"
  }
};

export function canTransition(status: SessionStatus, transition: SessionTransition) {
  return transitionTable[status][transition] !== undefined;
}

export function transitionSession(
  state: SessionState,
  transition: SessionTransition,
  reason?: string
): SessionState {
  const nextStatus = transitionTable[state.status][transition];
  if (!nextStatus) {
    return {
      reason: reason ?? `Cannot ${transition} from ${state.status}`,
      status: state.status
    };
  }

  return reason ? { reason, status: nextStatus } : { status: nextStatus };
}

export function isTerminalSessionStatus(status: SessionStatus) {
  return status === "cancelled" || status === "completed" || status === "failed";
}
