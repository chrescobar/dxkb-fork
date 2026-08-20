import { NextRequest } from "next/server";
import { signUp } from "@/lib/auth/server/actions";
import { parseJsonBody, withErrorHandling } from "@/lib/auth/server/errors";
import { respondWithSession } from "@/lib/auth/server/respond";
import type { SignupCredentials } from "@/lib/auth/types";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody<SignupCredentials>(request);
  const result = await signUp(body);
  return result.error
    ? respondWithSession(result)
    : respondWithSession(
        { data: result.data.user, error: null },
        result.data.expiresAt,
      );
});
