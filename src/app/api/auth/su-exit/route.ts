import { exitImpersonation } from "@/lib/auth/server/actions";
import { respondWithSession } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

export const POST = withErrorHandling(async () => {
  const result = await exitImpersonation();
  return result.error
    ? respondWithSession(result)
    : respondWithSession(
        { data: result.data.user, error: null },
        result.data.expiresAt,
      );
});
