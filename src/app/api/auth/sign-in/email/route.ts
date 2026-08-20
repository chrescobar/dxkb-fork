import { NextRequest } from "next/server";
import { signIn } from "@/lib/auth/server/actions";
import { respondWithSession } from "@/lib/auth/server/respond";
import { parseJsonBody, withErrorHandling } from "@/lib/auth/server/errors";
import type { SigninCredentials } from "@/lib/auth/types";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody<SigninCredentials>(request);
  const result = await signIn(body);
  return result.error
    ? respondWithSession(result)
    : respondWithSession(
        { data: result.data.user, error: null },
        result.data.expiresAt,
      );
});
