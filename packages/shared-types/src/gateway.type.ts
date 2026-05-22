import type { AppError } from "./error.type.js";
import type { ModelRequestPolicy } from "./model.type.js";
import type { UsageSummary } from "./usage.type.js";

export type GatewayMessageRole = "assistant" | "system" | "tool" | "user";

export type GatewayChunkType = "done" | "error" | "text_delta" | "tool_call";

export interface GatewayMessage {
  readonly content: string;
  readonly role: GatewayMessageRole;
}

export interface GatewayRequest {
  readonly agentSessionId: string;
  readonly messages: readonly GatewayMessage[];
  readonly modelPolicy: ModelRequestPolicy;
  readonly stream: true;
}

export interface GatewayToolCall {
  readonly argumentsJson: string;
  readonly toolName: string;
}

export interface GatewayChunk {
  readonly auditId: string;
  readonly delta?: string;
  readonly done: boolean;
  readonly error?: AppError;
  readonly toolCall?: GatewayToolCall;
  readonly type: GatewayChunkType;
  readonly usage?: UsageSummary;
}

export interface GatewaySessionToken {
  readonly expiresAt: string;
  readonly token: string;
}
