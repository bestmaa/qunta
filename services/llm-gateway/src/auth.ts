import type { IncomingMessage } from "node:http";

export interface GatewayAuth {
  readonly accountId: string;
  readonly tokenHash: string;
}

export function authenticateGatewayRequest(request: IncomingMessage): GatewayAuth | undefined {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;

  const token = header.slice("Bearer ".length);
  if (!token.startsWith("qgt_")) return undefined;

  return {
    accountId: request.headers["x-qunta-account-id"]?.toString() ?? "acct_dev",
    tokenHash: maskToken(token)
  };
}

function maskToken(token: string): string {
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
