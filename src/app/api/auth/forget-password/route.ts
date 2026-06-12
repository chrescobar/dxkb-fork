import { NextRequest } from "next/server";
import { authAdmin } from "@/lib/auth/server/instance";
import { respondWithAck } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

interface ForgetPasswordBody {
  usernameOrEmail?: unknown;
  email?: unknown;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = (await request.json().catch(() => ({}))) as ForgetPasswordBody;
  const identifier =
    typeof body.usernameOrEmail === "string"
      ? body.usernameOrEmail
      : typeof body.email === "string"
        ? body.email
        : "";
  return respondWithAck(await authAdmin.requestPasswordReset(identifier));
});
