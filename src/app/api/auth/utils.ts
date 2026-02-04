import { cookies } from "next/headers";
import { safeDecodeURIComponent } from "@/lib/auth";

// Cookie configuration for BV-BRC authentication
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

const SESSION_MAX_AGE = 3600 * 4; // 4 hours

// Helper function to fetch user profile metadata from BV-BRC
export async function getProfileMetadata(
  token: string,
  username: string,
): Promise<any | null> {
  try {
    const userResponse = await fetch(
      `https://user.bv-brc.org/user/${username}`,
      {
        headers: {
          Authorization: token,
          Accept: "application/json",
        },
      },
    );

    if (userResponse.ok) {
      return await userResponse.json();
    }

    console.warn(
      `Failed to fetch user profile for ${username}:`,
      userResponse.status,
    );
    return null;
  } catch (error) {
    console.warn("Failed to fetch user profile metadata:", error);
    return null;
  }
}

// Helper function to fetch user email by username for password reset
export async function getUserEmailByUsername(
  username: string,
): Promise<string | null> {
  try {
    const userResponse = await fetch(
      `https://user.bv-brc.org/user/${username}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (userResponse.ok) {
      const userData = await userResponse.json();
      return userData.email || null;
    }

    console.warn(
      `Failed to fetch user email for ${username}:`,
      userResponse.status,
    );
    return null;
  } catch (error) {
    console.warn("Failed to fetch user email by username:", error);
    return null;
  }
}

// Helper function to set BV-BRC authentication cookies
export async function setBvbrcAuthCookies(
  token: string,
  username: string,
  realm?: string,
  userProfile?: any,
) {
  const cookieStore = await cookies();

  // Set BV-BRC token cookie (renamed from 'token' to avoid conflicts with better-auth)
  cookieStore.set("bvbrc_token", token, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE,
  });

  // Set realm if provided
  if (realm) {
    cookieStore.set("bvbrc_realm", realm, {
      ...COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE,
    });
  }

  // Set user profile cookie if we have user data
  if (userProfile) {
    cookieStore.set("bvbrc_user_profile", JSON.stringify(userProfile), {
      ...COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE,
    });
  }

  // Set user ID
  const userId = userProfile?.id || username.match(/[A-Za-z\W0-9]+(?=[@])/)?.[0] || username;
  cookieStore.set("bvbrc_user_id", userId, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE,
  });
}

// Helper function to clear all BV-BRC authentication cookies
export async function clearBvbrcAuthCookies() {
  const cookieStore = await cookies();

  const cookiesToClear = [
    "bvbrc_token",
    "bvbrc_realm",
    "bvbrc_user_profile",
    "bvbrc_user_id",
    // Legacy cookie names (for cleanup during migration)
    "token",
    "auth",
    "refresh_token",
    "user_id",
    "realm",
    "user_profile",
  ];

  for (const name of cookiesToClear) {
    cookieStore.set(name, "", {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });
  }
}

// Helper function to get BV-BRC auth data from cookies
export async function getBvbrcAuthData() {
  const cookieStore = await cookies();

  const rawToken = cookieStore.get("bvbrc_token")?.value;
  const token = rawToken ? safeDecodeURIComponent(rawToken) : undefined;
  const userId = cookieStore.get("bvbrc_user_id")?.value;
  const realm = cookieStore.get("bvbrc_realm")?.value;
  const userProfileCookie = cookieStore.get("bvbrc_user_profile")?.value;

  let userProfile = null;
  if (userProfileCookie) {
    try {
      userProfile = JSON.parse(userProfileCookie);
    } catch {
      // Ignore parse errors
    }
  }

  return { token, userId, realm, userProfile };
}

export function extractRealmFromToken(token: string): string | undefined {
  const unMatch = token.match(/un=([^|]+)/);
  if (unMatch) {
    const unValue = unMatch[1];
    const atIndex = unValue.indexOf("@");
    if (atIndex !== -1) {
      return unValue.substring(atIndex + 1);
    }
  }
  return undefined;
}

