import { clearTestCookies, mockNextRequest, setTestSession } from "@/test-helpers/api-route-helpers";

vi.mock("@/lib/app-service", () => ({
  createAppService: vi.fn(),
}));

import { POST } from "../route";
import { createAppService } from "@/lib/app-service";

const mockCreateAppService = vi.mocked(createAppService);

const mockAppService = {
  queryTaskSummaryFiltered: vi.fn(),
};

describe("POST /api/services/app-service/jobs/task-summary", () => {
  beforeEach(() => {
    setTestSession();
    mockCreateAppService.mockReturnValue(mockAppService as never);
  });

  it("returns 401 when no auth token is available", async () => {
    clearTestCookies();

    const request = mockNextRequest({ method: "POST", body: {} });

    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(data).toEqual(
      expect.objectContaining({ error: "Authentication required" }),
    );
  });

  it("returns summary on success", async () => {
    const summaryData = { queued: 5, running: 2, completed: 20, failed: 1 };
    mockAppService.queryTaskSummaryFiltered.mockResolvedValue(summaryData);

    const request = mockNextRequest({ method: "POST", body: {} });

    const response = await POST(request, {});
    const data = (await response.json()) as { summary?: typeof summaryData };

    expect(response.status).toBe(200);
    expect(data).toEqual({ summary: summaryData });
  });

  it("passes include_archived through to the service", async () => {
    mockAppService.queryTaskSummaryFiltered.mockResolvedValue({});

    const request = mockNextRequest({
      method: "POST",
      body: { include_archived: true },
    });

    await POST(request, {});

    expect(mockAppService.queryTaskSummaryFiltered).toHaveBeenCalledWith({
      include_archived: true,
    });
  });

  it("returns 500 when an error is thrown", async () => {
    mockAppService.queryTaskSummaryFiltered.mockRejectedValue(
      new Error("Service down"),
    );

    const request = mockNextRequest({ method: "POST", body: {} });

    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(500);
    expect(data).toEqual(expect.objectContaining({ error: "Service down" }));
  });
});
