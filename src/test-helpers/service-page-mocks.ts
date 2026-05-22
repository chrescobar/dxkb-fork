import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";

/**
 * Install the baseline backend mocks every service-page test needs.
 *
 * - GET /api/auth/profile → empty default_job_folder so useRerunForm's
 *   default-path logic doesn't accidentally populate output_path mid-test
 * - POST /api/services/workspace (Workspace.get) → 500, so the output-name
 *   conflict check treats every name as available
 *
 * Call from beforeEach. Individual tests can layer service-specific handlers
 * on top via server.use().
 */
export function installServicePageBaseline() {
  server.use(
    http.get("*/api/auth/profile", () =>
      HttpResponse.json({ settings: { default_job_folder: "" } }),
    ),
    http.post("*/api/services/workspace", async ({ request }) => {
      const body = (await request.json()) as { method?: string };
      if (body.method === "Workspace.get") {
        return new HttpResponse(null, { status: 500 });
      }
      return HttpResponse.json([]);
    }),
  );
}
