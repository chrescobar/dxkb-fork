import { NextRequest } from "next/server";
import { startImpersonation } from "@/lib/auth/server/actions";
import { respondWithSessionMutation } from "@/lib/auth/server/respond";
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
  return respondWithSessionMutation(result, {
    sessionExpired: result.error?.sessionExpired,
  });
});
