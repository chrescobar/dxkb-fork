import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  createSession,
  createSuBackup,
  extractRealmFromToken,
} from "@/lib/auth/session";
import { getRequiredEnv } from "@/lib/env";
import { allowAdminToAdminImpersonation } from "@/lib/auth/su";

export async function POST(request: NextRequest) {
  try {
    const { targetUser, password } = await request.json();

    if (!targetUser || !password) {
      return NextResponse.json(
        { message: "Target user and password are required" },
        { status: 400 },
      );
    }

    // Verify current user is authenticated
    const { token, userId, realm } = await getSession();
    if (!token || !userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    // Re-verify admin role from upstream
    const userUrl = getRequiredEnv("USER_URL");
    const adminProfileResponse = await fetch(`${userUrl}/${userId}`, {
      headers: { Authorization: token, Accept: "application/json" },
    });

    if (!adminProfileResponse.ok) {
      return NextResponse.json(
        { message: "Failed to verify admin status" },
        { status: 403 },
      );
    }

    const adminProfile = (await adminProfileResponse.json()) as {
      roles?: string[];
    };

    if (!adminProfile.roles?.includes("admin")) {
      return NextResponse.json(
        { message: "Admin role required" },
        { status: 403 },
      );
    }

    // Call BV-BRC sulogin endpoint
    const authUrl = getRequiredEnv("USER_AUTH_URL");
    const suResponse = await fetch(`${authUrl}/sulogin`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        targetUser,
        password,
        username: userId,
      }),
    });

    if (!suResponse.ok) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const targetToken = (await suResponse.text()).trim();
    if (!targetToken) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Optionally block admin-to-admin impersonation
    if (!allowAdminToAdminImpersonation) {
      const targetCheckResponse = await fetch(
        `${userUrl}/${targetUser}`,
        {
          headers: { Authorization: targetToken, Accept: "application/json" },
        },
      );

      if (targetCheckResponse.ok) {
        const targetCheck = (await targetCheckResponse.json()) as {
          roles?: string[];
        };
        if (targetCheck.roles?.includes("admin")) {
          return NextResponse.json(
            { message: "Cannot impersonate another admin" },
            { status: 403 },
          );
        }
      }
    }

    // Backup current admin session
    await createSuBackup(token, userId, realm);

    // Set target user's session
    const targetRealm = extractRealmFromToken(targetToken);
    await createSession(targetToken, targetUser, targetRealm);

    // Fetch target user profile
    const targetProfileResponse = await fetch(`${userUrl}/${targetUser}`, {
      headers: { Authorization: targetToken, Accept: "application/json" },
    });

    const targetProfile = targetProfileResponse.ok
      ? ((await targetProfileResponse.json()) as Record<string, unknown>)
      : null;

    return NextResponse.json({
      user: {
        id: (targetProfile?.id as string) || targetUser,
        username: targetUser,
        email: (targetProfile?.email as string) || "",
        first_name: (targetProfile?.first_name as string) || "",
        last_name: (targetProfile?.last_name as string) || "",
        email_verified: (targetProfile?.email_verified as boolean) || false,
        realm: targetRealm,
        roles: (targetProfile?.roles as string[]) || [],
        isImpersonating: true,
        originalUsername: userId,
      },
      session: {
        token: "",
        expiresAt: new Date(Date.now() + 3600 * 4 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("SU login error:", error);
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 },
    );
  }
}
