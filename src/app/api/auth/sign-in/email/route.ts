import { NextRequest } from "next/server";
import { authAdmin } from "@/lib/auth/server/instance";
import { respondWithSession } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  return respondWithSession(await authAdmin.signIn(body));
});
