import type { AppError } from "./error.type.js";
import type { ModelRequestPolicy } from "./model.type.js";
import type { ProjectId } from "./project.type.js";

export type AgentSessionId = string & { readonly __brand: "AgentSessionId" };

export type ApprovalMode = "auto-edit" | "controlled-full" | "suggest";

export type SessionStatus =
  | "applying_patch"
  | "cancelled"
  | "completed"
  | "failed"
  | "idle"
  | "running"
  | "starting"
  | "waiting_approval";

export type SessionEventKind =
  | "command_output"
  | "command_request"
  | "diff_ready"
  | "error"
  | "file_read"
  | "session_done"
  | "status"
  | "summary";

export interface AgentSessionRequest {
  readonly approvalMode: ApprovalMode;
  readonly modelPolicy: ModelRequestPolicy;
  readonly projectId: ProjectId;
  readonly prompt: string;
}

export interface AgentSession {
  readonly approvalMode: ApprovalMode;
  readonly createdAt: string;
  readonly id: AgentSessionId;
  readonly projectId: ProjectId;
  readonly status: SessionStatus;
}

export interface SessionEvent {
  readonly error?: AppError;
  readonly id: string;
  readonly kind: SessionEventKind;
  readonly message?: string;
  readonly sessionId: AgentSessionId;
  readonly timestamp: string;
}
