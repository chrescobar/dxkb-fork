import { NextResponse } from "next/server";
import type { AuthUser, Result } from "@/lib/auth/types";
import { statusToErrorCode } from "@/lib/api/types";
import { statusFor } from "./errors";

export interface SessionEnvelope {
  user: AuthUser | null;
  session: { token: ""; expiresAt: string } | null;
}

export function buildEnvelope(
  user: AuthUser | null,
  expiresAt?: number,
): SessionEnvelope {
  if (user && expiresAt === undefined) {
    throw new Error("expiresAt is required for a session response");
  }
  return {
    user,
    session: user
      ? { token: "", expiresAt: new Date(expiresAt as number).toISOString() }
      : null,
  };
}

function errorResultResponse(result: Result<unknown>): NextResponse | null {
  if (!result.error) return null;
  const status = statusFor(result.error);
  return NextResponse.json(
    { error: result.error.message, code: statusToErrorCode(status) },
    { status },
  );
}

export function respondWithSession(
  result: Result<AuthUser | null>,
  expiresAt?: number,
  options?: { sessionExpired?: boolean },
): NextResponse {
  if (result.error && options?.sessionExpired) {
    return NextResponse.json(
      { error: result.error.message, code: "session_expired" },
      { status: statusFor(result.error) },
    );
  }
  return (
    errorResultResponse(result) ??
    NextResponse.json(buildEnvelope(result.data, expiresAt))
  );
}

export function respondWithAck(
  result: Result<void>,
  options?: { sessionExpired?: boolean },
): NextResponse {
  if (result.error && options?.sessionExpired) {
    return NextResponse.json(
      { error: result.error.message, code: "session_expired" },
      { status: statusFor(result.error) },
    );
  }
  return errorResultResponse(result) ?? NextResponse.json({ success: true });
}
