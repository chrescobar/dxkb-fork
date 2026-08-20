import { NextRequest, NextResponse } from "next/server";
import {
  getProfile,
  updateProfile,
} from "@/lib/auth/server/adapters/bvbrc-identity";
import { withAuth } from "@/lib/auth/server/route";
import { clearCurrentSession } from "@/lib/auth/server/session";
import { statusFor } from "@/lib/auth/server/errors";
import { statusToErrorCode } from "@/lib/api/types";
import { respondWithAck } from "@/lib/auth/server/respond";
import type { ProfilePatch, Result } from "@/lib/auth/types";

async function clearRejectedSession(result: Result<unknown>): Promise<boolean> {
  if (result.error?.code !== "unauthorized") return false;
  await clearCurrentSession();
  return true;
}

const stringPatchPaths = new Set([
  "/email",
  "/first_name",
  "/middle_name",
  "/last_name",
  "/affiliation",
  "/organisms",
  "/interests",
]);

function isProfilePatch(value: unknown): value is ProfilePatch {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const patch = value as Record<string, unknown>;
  if (
    Object.keys(patch).length !== 3 ||
    !("op" in patch) ||
    !("path" in patch) ||
    !("value" in patch)
  ) {
    return false;
  }

  if (
    patch.op === "replace" &&
    typeof patch.path === "string" &&
    stringPatchPaths.has(patch.path)
  ) {
    return typeof patch.value === "string";
  }

  if (
    (patch.op === "add" || patch.op === "replace") &&
    patch.path === "/settings" &&
    patch.value !== null &&
    typeof patch.value === "object" &&
    !Array.isArray(patch.value)
  ) {
    const settings = patch.value as Record<string, unknown>;
    return (
      Object.keys(settings).every((key) => key === "default_job_folder") &&
      (settings.default_job_folder === undefined ||
        typeof settings.default_job_folder === "string")
    );
  }

  return false;
}

export const GET = withAuth(async (_request, { token, userId }) => {
  const result = await getProfile(userId, token);
  if (result.error) {
    const sessionExpired = await clearRejectedSession(result);
    const status = statusFor(result.error);
    return NextResponse.json(
      {
        error: result.error.message,
        code: sessionExpired ? "session_expired" : statusToErrorCode(status),
      },
      { status },
    );
  }

  return NextResponse.json(result.data);
});

export const POST = withAuth(
  async (request: NextRequest, { token, userId }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON", code: "validation" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body) || !body.every(isProfilePatch)) {
      return NextResponse.json(
        { error: "Invalid profile patch", code: "validation" },
        { status: 400 },
      );
    }

    const patches: ProfilePatch[] = body;
    const result = await updateProfile(userId, token, patches);
    if (result.error && (await clearRejectedSession(result))) {
      return NextResponse.json(
        { error: result.error.message, code: "session_expired" },
        { status: statusFor(result.error) },
      );
    }
    return respondWithAck(result);
  },
);
