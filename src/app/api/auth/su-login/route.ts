import { NextRequest } from "next/server";
import { startImpersonation } from "@/lib/auth/server/actions";
import { respondWithSession } from "@/lib/auth/server/respond";
import { parseJsonBody, withErrorHandling } from "@/lib/auth/server/errors";

interface SuLoginBody {
  targetUser?: unknown;
  password?: unknown;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody<SuLoginBody>(request);
  const result = await startImpersonation(
    typeof body.targetUser === "string" ? body.targetUser : "",
    typeof body.password === "string" ? body.password : "",
  );
  return result.error
    ? respondWithSession(result, undefined, {
        sessionExpired: result.error.sessionExpired,
      })
    : respondWithSession(
        { data: result.data.user, error: null },
        result.data.expiresAt,
      );
});
