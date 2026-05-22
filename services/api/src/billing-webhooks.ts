import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

import type { AccountEntitlement, AccountId, PlanId, PlanStatus } from "@qunta/shared-types";

import { createDefaultEntitlement, freePlan, proPlan, teamPlan } from "./account-model.js";
import type { JsonResponse } from "./http-json.js";

export interface BillingAuditEvent {
  readonly accountId: AccountId;
  readonly eventType: string;
  readonly providerEventId: string;
}

interface BillingWebhookPayload {
  readonly accountId: AccountId;
  readonly eventId: string;
  readonly eventType: "subscription.cancelled" | "subscription.updated";
  readonly planId: PlanId;
  readonly status: PlanStatus;
}

export class BillingWebhookStore {
  private readonly auditEvents: BillingAuditEvent[] = [];
  private readonly entitlements = new Map<string, AccountEntitlement>();

  apply(payload: BillingWebhookPayload): AccountEntitlement {
    const entitlement = {
      ...createDefaultEntitlement(payload.accountId),
      plan: planFor(payload.planId),
      status: payload.status
    };

    this.entitlements.set(payload.accountId, entitlement);
    this.auditEvents.push({
      accountId: payload.accountId,
      eventType: payload.eventType,
      providerEventId: payload.eventId
    });
    return entitlement;
  }

  audits(): readonly BillingAuditEvent[] {
    return this.auditEvents;
  }
}

export async function handleBillingWebhook(
  store: BillingWebhookStore,
  secret: string,
  request: IncomingMessage
): Promise<JsonResponse | undefined> {
  if (request.method !== "POST" || request.url !== "/v1/billing/webhooks/mock") {
    return undefined;
  }

  const body = await readRawBody(request);
  if (!verifySignature(body, request.headers["x-qunta-signature"], secret)) {
    return { body: { error: { code: "auth_required", message: "Invalid signature" }, ok: false }, status: 401 };
  }

  const payload = JSON.parse(body.toString("utf8")) as BillingWebhookPayload;
  const entitlement = store.apply(payload);
  return {
    body: { auditEvents: store.audits(), entitlement, ok: true },
    status: 200
  };
}

export function signMockWebhook(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function verifySignature(
  body: Buffer,
  signature: string | string[] | undefined,
  secret: string
): boolean {
  const received = Array.isArray(signature) ? signature[0] : signature;
  if (!received) return false;

  const expected = signMockWebhook(body.toString("utf8"), secret);
  return safeEqual(received, expected);
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function readRawBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function planFor(planId: PlanId) {
  if (planId === "pro") return proPlan;
  if (planId === "team") return teamPlan;
  return freePlan;
}
