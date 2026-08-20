import { NextRequest } from "next/server";
import { requestPasswordReset } from "@/lib/auth/server/actions";
import { respondWithAck } from "@/lib/auth/server/respond";
import { parseJsonBody, withErrorHandling } from "@/lib/auth/server/errors";

interface ForgetPasswordBody {
  usernameOrEmail?: unknown;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody<ForgetPasswordBody>(request);
  const identifier =
    typeof body.usernameOrEmail === "string" ? body.usernameOrEmail : "";
  return respondWithAck(await requestPasswordReset(identifier));
});
