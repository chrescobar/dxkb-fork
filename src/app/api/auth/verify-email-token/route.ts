import { NextRequest } from "next/server";
import { verifyEmailToken } from "@/lib/auth/server/actions";
import { respondWithAck } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  return respondWithAck(
    await verifyEmailToken(
      searchParams.get("token") ?? "",
      searchParams.get("username") ?? "",
    ),
  );
});
