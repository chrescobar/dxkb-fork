import { submitServiceJob } from "../service-utils";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  vi.resetAllMocks();
});

describe("submitServiceJob", () => {
  const appName = "GenomeAssembly2";
  const appParams = { genome_id: "123.4", output_path: "/my/output" };

  it("returns { success: true, job } on successful submit", async () => {
    const job = [{ id: "job-abc-123", app: appName, status: "queued" }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ job }),
    });

    const result = await submitServiceJob(appName, appParams);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/services/app-service/submit",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_name: appName, app_params: appParams }),
      }),
    );
    expect(result).toEqual({ success: true, job });
  });

  it("extracts error message from JSON body on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: "Invalid parameters" }),
      text: async () => "should not be used",
    });

    const result = await submitServiceJob(appName, appParams);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "Invalid parameters",
      }),
    );
  });

  it("falls back to response text when JSON parsing fails on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
      text: async () => "Internal Server Error",
    });

    const result = await submitServiceJob(appName, appParams);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "Internal Server Error",
      }),
    );
  });

  it("returns { success: false } with error message on network error", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await submitServiceJob(appName, appParams);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "Failed to fetch",
      }),
    );
  });
});
