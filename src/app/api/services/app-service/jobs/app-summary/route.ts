import { NextRequest, NextResponse } from "next/server";
import { createAppService } from "@/lib/app-service";
import { withAuth } from "@/lib/auth/server/instance";

interface AppSummaryBody {
  include_archived?: boolean;
}

/**
 * Query app/service summary
 * POST /api/services/app-service/jobs/app-summary
 */
export const POST = withAuth(async (request: NextRequest, { token }) => {
  const body = (await request.json()) as AppSummaryBody;
  const { include_archived = false } = body;

  const appService = createAppService(token);

  const summary = await appService.queryAppSummaryFiltered({
    include_archived,
  });

  return NextResponse.json({ summary });
});
