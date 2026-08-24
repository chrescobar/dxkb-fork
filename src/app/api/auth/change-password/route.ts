import { NextRequest } from "next/server";
import { changePassword } from "@/lib/auth/server/actions";
import { respondWithAck } from "@/lib/auth/server/respond";
import { parseJsonBody, withErrorHandling } from "@/lib/auth/server/errors";

interface ChangePasswordBody {
  currentPassword?: unknown;
  newPassword?: unknown;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody<ChangePasswordBody>(request);
  const result = await changePassword(
    typeof body.currentPassword === "string" ? body.currentPassword : "",
    typeof body.newPassword === "string" ? body.newPassword : "",
  );
  return respondWithAck(result, {
    sessionExpired: result.error?.code === "unauthorized",
  });
});
