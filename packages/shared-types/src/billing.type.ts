import type { AccountId } from "./auth.type.js";
import type { PlanId, PlanStatus, UsageLimits } from "./account.type.js";

export type BillingProviderId = "manual" | "stripe" | "paddle";

export type BillingInterval = "month" | "year";

export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

export type BillingCancellationReason =
  | "customer_request"
  | "payment_failed"
  | "policy_violation"
  | "unknown";

export interface BillingPlanContract {
  readonly billingInterval: BillingInterval;
  readonly providerPlanId: string;
  readonly publicName: string;
  readonly quntaPlanId: PlanId;
  readonly trialDays: number;
  readonly usageLimits: UsageLimits;
}

export interface BillingSubscriptionStatus {
  readonly accountId: AccountId;
  readonly cancelAtPeriodEnd: boolean;
  readonly currentPeriodEndsAt: string;
  readonly planId: PlanId;
  readonly providerCustomerId: string;
  readonly providerSubscriptionId: string | null;
  readonly provider: BillingProviderId;
  readonly status: PlanStatus;
  readonly trialEndsAt: string | null;
}

export interface BillingInvoiceSummary {
  readonly amountDueMicros: number;
  readonly currency: string;
  readonly dueAt: string | null;
  readonly hostedUrl: string | null;
  readonly id: string;
  readonly status: InvoiceStatus;
}

export interface BillingCancellationRequest {
  readonly accountId: AccountId;
  readonly reason: BillingCancellationReason;
  readonly requestedBy: "server_admin" | "user";
}
