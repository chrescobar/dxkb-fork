import { NextRequest, NextResponse } from "next/server";
import { getProfile, updateProfile } from "@/lib/auth/server/adapters/bvbrc-identity";
import { withAuth } from "@/lib/auth/server/route";
import { clearCurrentSession } from "@/lib/auth/server/session";
import { parseJsonBody, statusFor } from "@/lib/auth/server/errors";
import { statusToErrorCode } from "@/lib/api/types";
import { respondWithAck } from "@/lib/auth/server/respond";
import type { Result } from "@/lib/auth/types";

async function clearRejectedSession(result: Result<unknown>): Promise<boolean> {
  if (result.error?.code !== "unauthorized") return false;
  await clearCurrentSession();
  return true;
}

export const GET = withAuth(async (_request, { token, userId }) => {
  const result = await getProfile(userId, token);
  if (result.error) {
    const sessionExpired = await clearRejectedSession(result);
    const status = statusFor(result.error);
    return NextResponse.json(
      {
        error: result.error.message,
        code: sessionExpired ? "session_expired" : statusToErrorCode(status),
      },
      { status },
    );
  }

  return NextResponse.json(result.data);
});

export const POST = withAuth(async (request: NextRequest, { token, userId }) => {
  const patches = await parseJsonBody<unknown>(request);
  const result = await updateProfile(userId, token, patches);
  if (result.error && (await clearRejectedSession(result))) {
    return NextResponse.json(
      { error: result.error.message, code: "session_expired" },
      { status: statusFor(result.error) },
    );
  }
  return respondWithAck(result);
});
