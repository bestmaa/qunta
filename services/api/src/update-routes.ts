import { createHmac } from "node:crypto";
import type { IncomingMessage } from "node:http";

import type { Platform, ReleaseChannel, UpdateLatestResponse } from "@qunta/shared-types";

import type { JsonResponse } from "./http-json.js";

const signingSecret = "dev_update_metadata_secret";

export function handleUpdateRoute(request: IncomingMessage): JsonResponse | undefined {
  if (request.method !== "GET" || !request.url?.startsWith("/v1/updates/latest")) {
    return undefined;
  }

  const url = new URL(request.url, "https://api.qunta.dev");
  const channel = parseChannel(url.searchParams.get("channel"));
  const platform = parsePlatform(url.searchParams.get("platform"));
  const metadata = createUpdateMetadata(channel, platform);

  return {
    body: { ok: true, update: metadata },
    status: 200
  };
}

export function createUpdateMetadata(
  channel: ReleaseChannel,
  platform: Platform
): UpdateLatestResponse {
  const unsigned = {
    artifactUrl: `https://updates.qunta.dev/${channel}/${platform}/Qunta-0.1.0`,
    channel,
    checksumSha256: "0".repeat(64),
    minimumSupportedVersion: "0.1.0",
    notesUrl: `https://updates.qunta.dev/${channel}/notes/0.1.0`,
    signed: true as const,
    version: "0.1.0"
  };

  return {
    ...unsigned,
    signature: signUpdateMetadata(unsigned)
  };
}

function signUpdateMetadata(value: Omit<UpdateLatestResponse, "signature">): string {
  return createHmac("sha256", signingSecret).update(JSON.stringify(value)).digest("hex");
}

function parseChannel(value: string | null): ReleaseChannel {
  if (value === "beta" || value === "dev") return value;
  return "stable";
}

function parsePlatform(value: string | null): Platform {
  if (value === "linux" || value === "macos") return value;
  return "windows";
}
