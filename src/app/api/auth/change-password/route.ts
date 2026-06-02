import { NextRequest } from "next/server";
import { authAdmin } from "@/lib/auth/server/instance";
import { respondWithAck } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  return respondWithAck(
    await authAdmin.changePassword(
      typeof body?.currentPassword === "string" ? body.currentPassword : "",
      typeof body?.newPassword === "string" ? body.newPassword : "",
    ),
  );
});
