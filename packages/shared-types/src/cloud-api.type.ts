import type { AccountId, AuthSession, DeviceId, SessionId } from "./auth.type.js";
import type { ModelCapability, ModelIntent } from "./model.type.js";
import type { UsageSummary } from "./usage.type.js";

export type Platform = "linux" | "macos" | "windows";

export type ReleaseChannel = "beta" | "dev" | "stable";

export interface DeviceLoginPollRequest {
  readonly deviceCode: string;
}

export interface DeviceLoginCompleteResponse {
  readonly accessToken: string;
  readonly accountId: AccountId;
  readonly expiresAt: string;
  readonly refreshToken: string;
  readonly sessionId: SessionId;
}

export interface AccountPlan {
  readonly features: readonly string[];
  readonly name: string;
  readonly sessionLimit: number;
  readonly status: "active" | "past_due" | "trialing";
}

export interface AccountResponse {
  readonly accountId: AccountId;
  readonly deviceId: DeviceId;
  readonly plan: AccountPlan;
  readonly session: AuthSession;
}

export interface AccountUsageResponse {
  readonly month: string;
  readonly remainingTokens: number;
  readonly summary: UsageSummary;
}

export interface GatewaySessionRequest {
  readonly agentSessionId: string;
  readonly capabilities: readonly ModelCapability[];
  readonly modelIntent: ModelIntent;
}

export interface GatewaySessionResponse {
  readonly expiresAt: string;
  readonly gatewayBaseUrl: string;
  readonly gatewayToken: string;
}

export interface BillingStatusResponse {
  readonly billingPortalAvailable: boolean;
  readonly plan: AccountPlan;
  readonly renewalAt?: string;
}

export interface UpdateLatestRequest {
  readonly channel: ReleaseChannel;
  readonly platform: Platform;
}

export interface UpdateLatestResponse {
  readonly artifactUrl: string;
  readonly channel: ReleaseChannel;
  readonly notesUrl: string;
  readonly signature: string;
  readonly version: string;
}
