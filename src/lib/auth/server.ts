import "server-only";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { fetchUserProfile } from "@/lib/auth/profile";
import type { AuthUser } from "@/lib/auth/types";

export async function getServerAuth(): Promise<AuthUser | null> {
  const { token, userId, realm } = await getSession();
  if (!token || !userId) return null;

  const profile = await fetchUserProfile(userId, token).catch(() => null);

  return {
    id: profile?.id ?? userId,
    username: userId,
    email: profile?.email ?? "",
    token,
    realm,
    first_name: profile?.first_name,
    last_name: profile?.last_name,
    email_verified: profile?.email_verified ?? false,
    roles: profile?.roles,
  };
}

export async function requireServerAuth(
  redirectTo = "/sign-in",
): Promise<AuthUser> {
  const user = await getServerAuth();
  if (!user) redirect(redirectTo);
  return user;
}
