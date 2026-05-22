export type AccountId = string & { readonly __brand: "AccountId" };

export type DeviceId = string & { readonly __brand: "DeviceId" };

export type SessionId = string & { readonly __brand: "SessionId" };

export type AuthSessionStatus = "active" | "expired" | "revoked";

export interface AuthSession {
  readonly accountId: AccountId;
  readonly createdAt: string;
  readonly deviceId: DeviceId;
  readonly expiresAt: string;
  readonly id: SessionId;
  readonly status: AuthSessionStatus;
}

export interface LoginStartRequest {
  readonly deviceName: string;
  readonly platform: "windows" | "linux" | "macos";
}

export interface LoginStartResponse {
  readonly deviceCode: string;
  readonly expiresAt: string;
  readonly verificationUrl: string;
}

export interface SessionRefreshRequest {
  readonly refreshToken: string;
  readonly sessionId: SessionId;
}

export interface SessionRefreshResponse {
  readonly expiresAt: string;
  readonly sessionId: SessionId;
}
