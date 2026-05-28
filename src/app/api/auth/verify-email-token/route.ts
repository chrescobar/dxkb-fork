import { NextRequest } from "next/server";
import { authAdmin } from "@/lib/auth/server/instance";
import { respondWithAck } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  return respondWithAck(
    await authAdmin.verifyEmailToken(
      searchParams.get("token") ?? "",
      searchParams.get("username") ?? "",
    ),
  );
});
