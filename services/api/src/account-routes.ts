import type { IncomingMessage } from "node:http";

import type { AccountId } from "@qunta/shared-types";

import { createDefaultEntitlement } from "./account-model.js";
import type { JsonResponse } from "./http-json.js";

export function handleAccountRoute(request: IncomingMessage): JsonResponse | undefined {
  if (request.method === "GET" && request.url === "/v1/account") {
    const accountId = getAccountId(request);
    const entitlement = createDefaultEntitlement(accountId);
    return {
      body: {
        accountId,
        entitlement,
        plan: {
          features: entitlement.plan.features,
          name: entitlement.plan.name,
          sessionLimit: entitlement.plan.limits.sessionsPerMonth,
          status: entitlement.status
        },
        session: null
      },
      status: 200
    };
  }

  if (request.method === "GET" && request.url === "/v1/account/usage") {
    const entitlement = createDefaultEntitlement(getAccountId(request));
    return {
      body: {
        month: new Date().toISOString().slice(0, 7),
        remainingTokens: entitlement.plan.limits.monthlyTokens,
        summary: entitlement.usage
      },
      status: 200
    };
  }

  return undefined;
}

function getAccountId(request: IncomingMessage): AccountId {
  const value = request.headers["x-qunta-account-id"];
  return (Array.isArray(value) ? value[0] : value ?? "acct_dev") as AccountId;
}
