import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBvbrcAuthData, clearBvbrcAuthCookies } from "../utils";

/** BV-BRC user shape from profile cookie or /user API */
interface SessionUserInfo {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  email_verified?: boolean;
}

/**
 * Get current session (better-auth style endpoint)
 * GET /api/auth/get-session
 */
export async function GET() {
  try {
    const { token, userId, realm, userProfile } = await getBvbrcAuthData();

    if (!token || !userId) {
      return NextResponse.json({
        user: null,
        session: null,
      });
    }

    // Validate token against BV-BRC
    let userInfo: SessionUserInfo | null = userProfile as SessionUserInfo | null;
    let isValid = !!userProfile;

    try {
      const response = await fetch(
        `https://user.patricbrc.org/user/${userId}`,
        {
          headers: {
            Authorization: token,
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        userInfo = (await response.json()) as SessionUserInfo;
        isValid = true;

        // Update user_profile cookie with fresh data
        if (userInfo) {
          const cookieStore = await cookies();
          cookieStore.set("bvbrc_user_profile", JSON.stringify(userInfo), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3600 * 4, // 4 hours
            path: "/",
          });
        }
      }
    } catch (error) {
      console.error("Session validation failed:", error);
      isValid = false;
    }

    if (!isValid) {
      // Clear invalid cookies
      await clearBvbrcAuthCookies();

      return NextResponse.json({
        user: null,
        session: null,
      });
    }

    // Return better-auth style response
    return NextResponse.json({
      user: {
        id: userInfo?.id || userId,
        username: userId,
        email: userInfo?.email || "",
        first_name: userInfo?.first_name || "",
        last_name: userInfo?.last_name || "",
        email_verified: userInfo?.email_verified || false,
        realm,
        token: "", // Token is in HTTP-only cookie, not exposed to client
      },
      session: {
        expiresAt: new Date(Date.now() + 3600 * 4 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      {
        user: null,
        session: null,
      },
      { status: 500 },
    );
  }
}
