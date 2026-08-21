import { NextRequest } from "next/server";
import { signUp } from "@/lib/auth/server/actions";
import { parseJsonBody, withErrorHandling } from "@/lib/auth/server/errors";
import { respondWithSessionMutation } from "@/lib/auth/server/respond";
import type { SignupCredentials } from "@/lib/auth/types";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody<SignupCredentials>(request);
  return respondWithSessionMutation(await signUp(body));
});
