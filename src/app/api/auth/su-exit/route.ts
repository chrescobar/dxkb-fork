import { NextResponse } from "next/server";
import { restoreSuBackup, sessionMaxAge } from "@/lib/auth/session";
import { fetchUserProfile } from "@/lib/auth/profile";

export async function POST() {
  try {
    const backup = await restoreSuBackup();

    if (!backup.token || !backup.userId) {
      return NextResponse.json(
        { message: "No active impersonation session" },
        { status: 400 },
      );
    }

    const profile = await fetchUserProfile(backup.userId, backup.token);

    return NextResponse.json({
      user: {
        id: profile?.id || backup.userId,
        username: backup.userId,
        email: profile?.email || "",
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        email_verified: profile?.email_verified || false,
        realm: backup.realm,
        roles: profile?.roles || [],
      },
      session: {
        token: "",
        expiresAt: new Date(Date.now() + sessionMaxAge * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("SU exit error:", error);
    return NextResponse.json(
      { message: "Failed to exit impersonation" },
      { status: 500 },
    );
  }
}
