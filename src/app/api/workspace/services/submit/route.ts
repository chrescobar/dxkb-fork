import { NextRequest, NextResponse } from "next/server";
import { createWorkspaceService } from "../../../../../lib/workspace-service";
import { cookies } from "next/headers";
import { safeDecodeURIComponent } from "../../../../../lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    // Get authentication token from cookies
    const cookieStore = await cookies();
    const rawToken = cookieStore.get("token")?.value;
    const token = rawToken ? safeDecodeURIComponent(rawToken) : undefined;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { app_name, app_params, context } = body;

    // Validate required fields
    if (!app_name) {
      return NextResponse.json(
        { error: "app_name is required" },
        { status: 400 },
      );
    }

    if (!app_params || typeof app_params !== "object") {
      return NextResponse.json(
        { error: "app_params must be an object" },
        { status: 400 },
      );
    }

    // Create workspace service
    const workspaceService = createWorkspaceService(token);

    // Submit the service job
    const result = await workspaceService.submitService({
      app_name,
      app_params,
      context,
    });

    return NextResponse.json({
      success: true,
      job: result,
    });
  } catch (error) {
    console.error("Error submitting service:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

