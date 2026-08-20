import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { SessionIdentity } from "@/lib/auth/types";
import { errorResponse } from "./errors";
import { getCurrentUser } from "./actions";
import { readSession } from "./session";
import { requestTimeoutMs, serverUserAgent } from "./user-agent";

export type AuthRouteHandler<TCtx = object> = (
  request: NextRequest,
  context: TCtx & SessionIdentity,
) => Promise<NextResponse>;

function sessionExpiredResponse(): NextResponse {
  return NextResponse.json(
    { error: "Authentication required", code: "session_expired" },
    { status: 401 },
  );
}

export async function readAuthSession(): Promise<SessionIdentity | null> {
  return readSession();
}

export async function requireAuthSession(): Promise<SessionIdentity> {
  const session = await readSession();
  if (!session) throw new Error("Authentication required");
  return session;
}

export async function requireAuthSessionOrRedirect(
  redirectTo: string,
): Promise<SessionIdentity> {
  const session = await readSession();
  if (!session) redirect(`/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
  return session;
}

export function withAuth<TCtx = object>(
  handler: AuthRouteHandler<TCtx>,
): (request: NextRequest, context: TCtx) => Promise<NextResponse> {
  return async (request, context) => {
    const session = await readSession();
    if (!session) return sessionExpiredResponse();
    try {
      return await handler(request, { ...context, ...session });
    } catch (error) {
      if (error instanceof Response) return error as NextResponse;
      console.error("Route handler error:", error);
      return errorResponse(error);
    }
  };
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const session = await requireAuthSession();
  const headers = new Headers(
    input instanceof Request ? input.headers : undefined,
  );
  new Headers(init.headers).forEach((value, name) => {
    headers.set(name, value);
  });
  if (!headers.has("User-Agent")) headers.set("User-Agent", serverUserAgent);
  headers.set("Authorization", session.token);
  const timeoutSignal = AbortSignal.timeout(requestTimeoutMs);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  return fetch(input, { ...init, headers, signal });
}

export async function requireUser(redirectTo?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo ?? "/sign-in");
  return user;
}
