import { randomUUID } from "node:crypto";

import type {
  AccountId,
  DeviceLoginCompleteResponse,
  DeviceLoginStartRequest,
  DeviceLoginStartResponse,
  SessionId,
  SessionRefreshResponse,
  SessionRevokeResponse
} from "@qunta/shared-types";

interface DeviceLoginRecord {
  readonly accountId: AccountId;
  readonly deviceCode: string;
  readonly deviceLabel: string;
  readonly expiresAt: string;
  readonly sessionId: SessionId;
}

export class AuthStore {
  private readonly devices = new Map<string, DeviceLoginRecord>();
  private readonly sessions = new Map<string, DeviceLoginCompleteResponse>();

  startDeviceLogin(request: DeviceLoginStartRequest): DeviceLoginStartResponse {
    const deviceLabel = `${request.platform}:${request.deviceName}`.trim();
    const deviceCode = `QUNTA-${randomUUID().slice(0, 8).toUpperCase()}`;
    const expiresAt = expiresInMinutes(10);
    const record: DeviceLoginRecord = {
      accountId: brandAccountId("acct_dev"),
      deviceCode,
      deviceLabel,
      expiresAt,
      sessionId: brandSessionId(`sess_${randomUUID()}`)
    };

    this.devices.set(deviceCode, record);

    return {
      deviceCode,
      expiresAt,
      verificationUrl: `https://app.qunta.dev/device?code=${deviceCode}`
    };
  }

  pollDeviceLogin(deviceCode: string): DeviceLoginCompleteResponse | undefined {
    const record = this.devices.get(deviceCode);
    if (!record) return undefined;

    const session: DeviceLoginCompleteResponse = {
      accessToken: `qat_${randomUUID()}`,
      accountId: record.accountId,
      expiresAt: expiresInMinutes(60),
      refreshToken: `qrt_${randomUUID()}`,
      sessionId: record.sessionId
    };

    this.sessions.set(record.sessionId, session);
    this.devices.delete(deviceCode);
    return session;
  }

  refreshSession(sessionId: SessionId): SessionRefreshResponse | undefined {
    if (!this.sessions.has(sessionId)) return undefined;
    return {
      expiresAt: expiresInMinutes(60),
      sessionId
    };
  }

  revokeSession(sessionId: SessionId): SessionRevokeResponse {
    this.sessions.delete(sessionId);
    return { revoked: true, sessionId };
  }
}

function expiresInMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function brandAccountId(value: string): AccountId {
  return value as AccountId;
}

function brandSessionId(value: string): SessionId {
  return value as SessionId;
}
