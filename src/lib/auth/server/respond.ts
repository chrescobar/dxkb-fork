import { NextResponse } from "next/server";
import type { Result } from "@/lib/auth/port";
import type { AuthUser } from "@/lib/auth/types";
import { statusFor } from "./errors";
import { buildEnvelope } from "./envelope";
import { statusToErrorCode } from "@/lib/api/types";

export function respondWithSession(
  result: Result<AuthUser | null>,
): NextResponse {
  if (result.error) {
    const status = statusFor(result.error);
    return NextResponse.json(
      { error: result.error.message, code: statusToErrorCode(status) },
      { status },
    );
  }
  return NextResponse.json(buildEnvelope(result.data));
}

export function respondWithAck(result: Result<void>): NextResponse {
  if (result.error) {
    const status = statusFor(result.error);
    return NextResponse.json(
      { error: result.error.message, code: statusToErrorCode(status) },
      { status },
    );
  }
  return NextResponse.json({ success: true });
}
