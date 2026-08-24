import { clearTestCookies, mockNextRequest, setTestSession } from "@/test-helpers/api-route-helpers";

vi.mock("@/lib/app-service", () => ({
  createAppService: vi.fn(),
}));

import { POST } from "../route";
import { createAppService } from "@/lib/app-service";

const mockCreateAppService = vi.mocked(createAppService);

const mockAppService = {
  queryTaskSummaryFiltered: vi.fn(),
  queryAppSummaryFiltered: vi.fn(),
};

describe("POST /api/services/app-service/jobs/summary", () => {
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

  it("returns both task and app summaries on success", async () => {
    const taskData = { queued: 2, completed: 10 };
    const appData = { GenomeAssembly2: 5, BLAST: 7 };
    mockAppService.queryTaskSummaryFiltered.mockResolvedValue(taskData);
    mockAppService.queryAppSummaryFiltered.mockResolvedValue(appData);

    const request = mockNextRequest({ method: "POST", body: {} });

    const response = await POST(request, {});
    const data = (await response.json()) as {
      taskSummary?: typeof taskData;
      appSummary?: typeof appData;
    };

    expect(response.status).toBe(200);
    expect(data).toEqual({ taskSummary: taskData, appSummary: appData });
  });

  it("passes include_archived=true when specified", async () => {
    mockAppService.queryTaskSummaryFiltered.mockResolvedValue({});
    mockAppService.queryAppSummaryFiltered.mockResolvedValue({});

    const request = mockNextRequest({
      method: "POST",
      body: { include_archived: true },
    });

    await POST(request, {});

    expect(mockAppService.queryTaskSummaryFiltered).toHaveBeenCalledWith({
      include_archived: true,
    });
    expect(mockAppService.queryAppSummaryFiltered).toHaveBeenCalledWith({
      include_archived: true,
    });
  });

  it("defaults include_archived to false", async () => {
    mockAppService.queryTaskSummaryFiltered.mockResolvedValue({});
    mockAppService.queryAppSummaryFiltered.mockResolvedValue({});

    const request = mockNextRequest({ method: "POST", body: {} });

    await POST(request, {});

    expect(mockAppService.queryTaskSummaryFiltered).toHaveBeenCalledWith({
      include_archived: false,
    });
    expect(mockAppService.queryAppSummaryFiltered).toHaveBeenCalledWith({
      include_archived: false,
    });
  });

  it("returns 500 when an error is thrown", async () => {
    mockAppService.queryTaskSummaryFiltered.mockRejectedValue(
      new Error("DB connection lost"),
    );

    const request = mockNextRequest({ method: "POST", body: {} });

    const response = await POST(request, {});
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(500);
    expect(data).toEqual(
      expect.objectContaining({ error: "DB connection lost" }),
    );
  });
});
