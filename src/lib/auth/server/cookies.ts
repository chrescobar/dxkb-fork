import type { NextRequest } from "next/server";

export const sessionMaxAgeMs = 24 * 60 * 60 * 1000;

export const sessionCookieNames = {
  token: "bvbrc_token",
  userId: "bvbrc_user_id",
  realm: "bvbrc_realm",
} as const;

export const suBackupCookieNames = {
  token: "bvbrc_su_original_token",
  userId: "bvbrc_su_original_user_id",
  realm: "bvbrc_su_original_realm",
} as const;

export function hasSessionCookies(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(sessionCookieNames.token)?.value &&
    request.cookies.get(sessionCookieNames.userId)?.value,
  );
}
