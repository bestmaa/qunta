export type ErrorCode =
  | "auth_required"
  | "billing_required"
  | "cancelled"
  | "gateway_unavailable"
  | "invalid_request"
  | "not_found"
  | "permission_denied"
  | "rate_limited"
  | "workspace_denied";

export interface AppError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly requestId?: string;
  readonly retryAfterMs?: number;
}

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly error: AppError; readonly ok: false };
