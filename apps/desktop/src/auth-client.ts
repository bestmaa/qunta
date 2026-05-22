import type {
  DeviceLoginCompleteResponse,
  DeviceLoginStartRequest,
  DeviceLoginStartResponse,
  SessionRefreshRequest,
  SessionRefreshResponse,
  SessionRevokeRequest,
  SessionRevokeResponse
} from "@qunta/shared-types";

export interface AuthClient {
  readonly pollDeviceLogin: (deviceCode: string) => Promise<DeviceLoginCompleteResponse>;
  readonly refreshSession: (request: SessionRefreshRequest) => Promise<SessionRefreshResponse>;
  readonly revokeSession: (request: SessionRevokeRequest) => Promise<SessionRevokeResponse>;
  readonly startDeviceLogin: (
    request: DeviceLoginStartRequest
  ) => Promise<DeviceLoginStartResponse>;
}

export function createAuthClient(baseUrl: string): AuthClient {
  return {
    pollDeviceLogin(deviceCode) {
      return postJson(`${baseUrl}/v1/auth/device/poll`, { deviceCode });
    },
    refreshSession(request) {
      return postJson(`${baseUrl}/v1/auth/session/refresh`, request);
    },
    revokeSession(request) {
      return postJson(`${baseUrl}/v1/auth/session/revoke`, request);
    },
    startDeviceLogin(request) {
      return postJson(`${baseUrl}/v1/auth/device/start`, request);
    }
  };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST"
  });

  if (!response.ok) throw new Error(`Request failed with ${response.status}`);
  return (await response.json()) as T;
}
