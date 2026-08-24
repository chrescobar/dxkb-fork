import { exitImpersonation } from "@/lib/auth/server/actions";
import { respondWithSessionMutation } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

export const POST = withErrorHandling(async () => {
  return respondWithSessionMutation(await exitImpersonation());
});
