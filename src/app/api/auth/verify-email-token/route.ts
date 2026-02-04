import { NextRequest, NextResponse } from "next/server";

/**
 * Verify email via URL link (better-auth style endpoint)
 * GET /api/auth/verify-email-token?token=xxx&username=xxx
 *
 * This is used when users click verification links in emails
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verificationToken = searchParams.get("token");
    const verificationUsername = searchParams.get("username");

    if (!verificationToken || !verificationUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification token and username are required",
        },
        { status: 400 },
      );
    }

    // Verify the email with BV-BRC
    const response = await fetch("https://user.patricbrc.org/verify/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        token: verificationToken,
        username: verificationUsername,
      }),
    });

    if (response.ok) {
      const result = await response.json();

      return NextResponse.json({
        success: true,
        message: "Email verified successfully",
        data: result,
      });
    } else {
      const errorData = await response.json().catch(() => ({}));

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || "Email verification failed",
          error: errorData,
        },
        { status: response.status },
      );
    }
  } catch (error) {
    console.error("Email verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during email verification",
      },
      { status: 500 },
    );
  }
}
