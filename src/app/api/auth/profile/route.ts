import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server/instance";
import { getRequiredEnv } from "@/lib/env";
import { statusToErrorCode } from "@/lib/api/types";
import { respondWithAck } from "@/lib/auth/server/respond";

export const GET = auth.route(async (_request, { userId }) => {
  const response = await auth.fetch(
    `${getRequiredEnv("USER_URL")}/${encodeURIComponent(userId)}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch profile", code: statusToErrorCode(response.status) },
      { status: response.status },
    );
  }

  return NextResponse.json(await response.json());
});

export const POST = auth.route(async (request: NextRequest, { userId }) => {
  const body = await request.text();

  const response = await auth.fetch(
    `${getRequiredEnv("USER_URL")}/${encodeURIComponent(userId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json-patch+json",
        Accept: "application/json",
      },
      body,
    },
  );

  if (!response.ok) {
    const text = (await response.text()) || "Failed to update profile";
    return NextResponse.json(
      { error: text, code: statusToErrorCode(response.status) },
      { status: response.status },
    );
  }

  return respondWithAck({ data: undefined, error: null });
});
