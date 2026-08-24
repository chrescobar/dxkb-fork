import { sendVerificationEmail } from "@/lib/auth/server/actions";
import { respondWithAck } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

export const POST = withErrorHandling(async () => {
  const result = await sendVerificationEmail();
  return respondWithAck(result, {
    sessionExpired: result.error?.code === "unauthorized",
  });
});
