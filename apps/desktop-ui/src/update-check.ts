import type { ReleaseChannel, UpdateLatestResponse } from "@qunta/shared-types";

export interface UpdateCheckState {
  readonly canInstall: false;
  readonly channel: ReleaseChannel;
  readonly message: string;
  readonly update: UpdateLatestResponse | null;
}

export function summarizeUpdateMetadata(update: UpdateLatestResponse | null): UpdateCheckState {
  if (!update) {
    return {
      canInstall: false,
      channel: "stable",
      message: "No update metadata loaded",
      update: null
    };
  }

  if (!update.signed || update.signature.length < 32) {
    return {
      canInstall: false,
      channel: update.channel,
      message: "Unsigned update rejected",
      update: null
    };
  }

  return {
    canInstall: false,
    channel: update.channel,
    message: `Update ${update.version} available`,
    update
  };
}
