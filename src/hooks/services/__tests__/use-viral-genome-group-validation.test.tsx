import { renderHook, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { useViralGenomeGroupValidation } from "@/hooks/services/use-viral-genome-group-validation";
import { server } from "@/test-helpers/msw-server";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

function workspaceGetResponse(genomeIds: string[]) {
  return {
    result: [
      [
        [
          {},
          { id_list: { genome_id: genomeIds } },
        ],
      ],
    ],
  };
}

const defaultOptions = {
  maxGenomes: 10,
  maxGenomeLength: 250000,
};

describe("useViralGenomeGroupValidation", () => {
  it("returns ok status with genomeIds when validation passes", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json(workspaceGetResponse(["v1", "v2"])),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json({
          results: [
            { genome_id: "v1", genome_name: "Virus One", superkingdom: "Viruses" },
            { genome_id: "v2", genome_name: "Virus Two", superkingdom: "Viruses" },
          ],
        }),
      ),
      http.post("/api/services/genome/validate-viral", () =>
        HttpResponse.json({
          results: [
            { genome_id: "v1", superkingdom: "Viruses", contigs: 1, genome_length: 10000 },
            { genome_id: "v2", superkingdom: "Viruses", contigs: 1, genome_length: 20000 },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useViralGenomeGroupValidation(defaultOptions));

    let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined;
    await act(async () => {
      validationResult = await result.current.validate("/user/virus-group");
    });

    expect(validationResult).toEqual({ status: "ok", genomeIds: ["v1", "v2"] });
    expect(result.current.isValidating).toBe(false);
  });

  it("returns empty status when group has no members", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json(workspaceGetResponse([])),
      ),
    );

    const { result } = renderHook(() => useViralGenomeGroupValidation(defaultOptions));

    let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined;
    await act(async () => {
      validationResult = await result.current.validate("/user/empty-group");
    });

    expect(validationResult).toEqual({ status: "empty" });
  });

  it("returns too-large status when group exceeds maxGenomes", async () => {
    const tinyOptions = { maxGenomes: 2, maxGenomeLength: 250000 };

    // Return 3 genome ids — more than maxGenomes
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json(workspaceGetResponse(["g1", "g2", "g3"])),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json({
          results: [
            { genome_id: "g1", genome_name: "Genome 1" },
            { genome_id: "g2", genome_name: "Genome 2" },
            { genome_id: "g3", genome_name: "Genome 3" },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useViralGenomeGroupValidation(tinyOptions));

    let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined;
    await act(async () => {
      validationResult = await result.current.validate("/user/large-group");
    });

    expect(validationResult).toEqual({ status: "too-large" });
  });

  it("returns invalid status when validateViralGenomes returns allValid:false", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json(workspaceGetResponse(["bad1"])),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json({
          results: [{ genome_id: "bad1", genome_name: "Bad Genome" }],
        }),
      ),
      http.post("/api/services/genome/validate-viral", () =>
        HttpResponse.json({
          results: [
            { genome_id: "bad1", superkingdom: "Bacteria", contigs: 1, genome_length: 5000 },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useViralGenomeGroupValidation(defaultOptions));

    let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined;
    await act(async () => {
      validationResult = await result.current.validate("/user/bad-group");
    });

    expect(validationResult).toMatchObject({ status: "invalid" });
  });

  it("returns error status on network failure", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useViralGenomeGroupValidation(defaultOptions));

    let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined;
    await act(async () => {
      validationResult = await result.current.validate("/user/failing-group");
    });

    expect(validationResult).toMatchObject({ status: "error" });
  });

  it("isValidating is true during call and false after", async () => {
    let resolveWorkspace!: (value: Response) => void;
    const workspacePromise = new Promise<Response>((resolve) => {
      resolveWorkspace = resolve;
    });

    server.use(
      http.post("/api/services/workspace", () => workspacePromise),
    );

    const { result } = renderHook(() => useViralGenomeGroupValidation(defaultOptions));

    expect(result.current.isValidating).toBe(false);

    let validatePromise: Promise<Awaited<ReturnType<typeof result.current.validate>>>;

    act(() => {
      validatePromise = result.current.validate("/user/slow-group");
    });

    expect(result.current.isValidating).toBe(true);

    // Resolve the workspace request with an empty group
    await act(async () => {
      resolveWorkspace(HttpResponse.json(workspaceGetResponse([])));
      if (validatePromise) await validatePromise;
    });

    expect(result.current.isValidating).toBe(false);
  });
});
