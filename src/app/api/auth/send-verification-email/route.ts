import { authAdmin } from "@/lib/auth/server/instance";
import { respondWithAck } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

export const POST = withErrorHandling(async () => {
  return respondWithAck(await authAdmin.sendVerificationEmail());
});
