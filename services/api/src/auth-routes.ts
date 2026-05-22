import type { IncomingMessage } from "node:http";

import type {
  DeviceLoginPollRequest,
  DeviceLoginStartRequest,
  SessionRefreshRequest,
  SessionRevokeRequest
} from "@qunta/shared-types";

import type { AuthStore } from "./auth-store.js";
import { readJson, type JsonResponse } from "./http-json.js";

export async function handleAuthRoute(
  store: AuthStore,
  request: IncomingMessage
): Promise<JsonResponse | undefined> {
  if (request.method === "POST" && request.url === "/v1/auth/device/start") {
    const body = await readJson<DeviceLoginStartRequest>(request);
    return { body: store.startDeviceLogin(body), status: 200 };
  }

  if (request.method === "POST" && request.url === "/v1/auth/device/poll") {
    const body = await readJson<DeviceLoginPollRequest>(request);
    const session = store.pollDeviceLogin(body.deviceCode);
    return session
      ? { body: session, status: 200 }
      : { body: authPending(), status: 202 };
  }

  if (request.method === "POST" && request.url === "/v1/auth/session/refresh") {
    const body = await readJson<SessionRefreshRequest>(request);
    const session = store.refreshSession(body.sessionId);
    return session
      ? { body: session, status: 200 }
      : { body: authRequired(), status: 401 };
  }

  if (request.method === "POST" && request.url === "/v1/auth/session/revoke") {
    const body = await readJson<SessionRevokeRequest>(request);
    return { body: store.revokeSession(body.sessionId), status: 200 };
  }

  return undefined;
}

function authPending() {
  return {
    error: { code: "auth_required", message: "Device login is still pending" },
    ok: false
  };
}

function authRequired() {
  return {
    error: { code: "auth_required", message: "Session is not active" },
    ok: false
  };
}
