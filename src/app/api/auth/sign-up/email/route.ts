import { NextRequest } from "next/server";
import { authAdmin } from "@/lib/auth/server/instance";
import { withErrorHandling } from "@/lib/auth/server/errors";
import { respondWithSession } from "@/lib/auth/server/respond";
import type { SignupCredentials } from "@/lib/auth/types";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = (await request.json().catch(() => ({}))) as SignupCredentials;
  return respondWithSession(await authAdmin.signUp(body));
});
