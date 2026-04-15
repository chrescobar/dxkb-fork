import { getRequiredEnv } from "@/lib/env";
import type { UserProfile } from "@/lib/auth/types";

export async function fetchUserProfile(
  username: string,
  token?: string,
): Promise<UserProfile | null> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = token;

  try {
    const response = await fetch(
      `${getRequiredEnv("USER_URL")}/${encodeURIComponent(username)}`,
      { headers },
    );

    if (response.ok) return await response.json();

    console.warn(`Failed to fetch user profile for ${username}:`, response.status);
    return null;
  } catch (error) {
    console.warn("Failed to fetch user profile:", error);
    return null;
  }
}
