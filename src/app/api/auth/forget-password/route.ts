import { NextRequest } from "next/server";
import { authAdmin } from "@/lib/auth/server/instance";
import { respondWithAck } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  const identifier = body?.usernameOrEmail || body?.email;
  return respondWithAck(await authAdmin.requestPasswordReset(identifier ?? ""));
});
