import { NextRequest } from "next/server";
import { authAdmin } from "@/lib/auth/server/instance";
import { respondWithSession } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

interface SuLoginBody {
  targetUser?: unknown;
  password?: unknown;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = (await request.json().catch(() => ({}))) as SuLoginBody;
  return respondWithSession(
    await authAdmin.impersonate(
      typeof body.targetUser === "string" ? body.targetUser : "",
      typeof body.password === "string" ? body.password : "",
    ),
  );
});
