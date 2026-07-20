import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { DataTable } from "../data-table";
import { server } from "@/test-helpers/msw-server";

const columns = [{ id: "strain_name", label: "Strain Name", visible: true }];

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
});

// Regression: "Showing 1-0 of N" appeared during page-data loading because end was
// computed from data.length (= 0) even when isLoading=true. The fix uses the expected
// page range (pageIndex * pageSize + pageSize) while loading, so the display is
// meaningful from the moment totalItems resolves.
describe("DataTable Showing display during loading", () => {
  it("shows expected page range when isLoading=true and data is empty", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={5000}
        resource="strain"
        isLoading={true}
        pageIndex={0}
        pageSize={200}
      />
    );
    expect(screen.getByText(/Showing 1-200 of 5000 results/)).toBeInTheDocument();
  });

  it("shows expected range for page 2 while loading (not '201-200')", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={5000}
        resource="strain"
        isLoading={true}
        pageIndex={1}
        pageSize={200}
      />
    );
    expect(screen.getByText(/Showing 201-400 of 5000 results/)).toBeInTheDocument();
  });

  it("uses target page range while loading even when placeholder rows exist", () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({ strain_name: `Previous Strain ${String(i)}` }));

    render(
      <DataTable
        id="test"
        data={rows}
        columns={columns}
        totalItems={5000}
        resource="strain"
        isLoading={true}
        pageIndex={1}
        pageSize={200}
      />
    );

    expect(screen.getByText(/Showing 201-400 of 5000 results/)).toBeInTheDocument();
    expect(screen.queryByText(/Showing 201-203 of 5000 results/)).not.toBeInTheDocument();
  });

  it("shows 1-0 when data is genuinely empty and not loading", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={5000}
        resource="strain"
        isLoading={false}
        pageIndex={0}
        pageSize={200}
      />
    );
    expect(screen.getByText(/Showing 1-0 of 5000 results/)).toBeInTheDocument();
  });

  it("shows actual row count range when data is loaded", () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({ strain_name: `Strain ${String(i)}` }));
    render(
      <DataTable
        id="test"
        data={rows}
        columns={columns}
        totalItems={5000}
        resource="strain"
        isLoading={false}
        pageIndex={0}
        pageSize={200}
      />
    );
    expect(screen.getByText(/Showing 1-3 of 5000 results/)).toBeInTheDocument();
  });

  it("caps end at totalItems when last page is partial", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ strain_name: `Strain ${String(i)}` }));
    render(
      <DataTable
        id="test"
        data={rows}
        columns={columns}
        totalItems={210}
        resource="strain"
        isLoading={true}
        pageIndex={1}
        pageSize={200}
      />
    );
    // expected end: min(201 + 200 - 1, 210) = 210, not 400
    expect(screen.getByText(/Showing 201-210 of 210 results/)).toBeInTheDocument();
  });
});

describe("DataTable empty state", () => {
  it("shows 'No results' when data is empty and no errorMessage", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={0}
        resource="strain"
      />
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("shows errorMessage in table body instead of 'No results'", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={0}
        resource="strain"
        errorMessage="Error: Failed to fetch metadata (500 Internal Server Error)"
      />
    );
    expect(screen.getByText(/Failed to fetch metadata/)).toBeInTheDocument();
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
  });

  it("keeps Download and Columns buttons visible when errorMessage is set", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={0}
        resource="strain"
        errorMessage="Error: Failed to fetch metadata (500 Internal Server Error)"
      />
    );
    expect(screen.getByRole("button", { name: /Download \(CSV\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Columns/i })).toBeInTheDocument();
  });
});

// ─── Download Selected: POST regression ──────────────────────────────────────
// Regression: download-selected used a GET request with the RQL query in the URL.
// With 200 selected rows the URL exceeded browser/server limits → net::ERR_FAILED.
// Fix: POST with query in body (Content-type: application/rqlquery+x-www-form-urlencoded).

describe("DataTable download selected: POST regression", () => {
  const DATA_API = "https://data.test";

  const dlColumns = [
    { id: "source", label: "Source", visible: true },
    { id: "product", label: "Product", visible: true },
  ];

  const twoRows = [
    { id: "aaaa-0001", source: "PRINTS", product: "polyprotein" },
    { id: "aaaa-0002", source: "Pfam", product: "capsid" },
  ];

  beforeAll(() => {
    process.env.NEXT_PUBLIC_DATA_API = DATA_API;
    global.ResizeObserver = class ResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };
    // jsdom doesn't implement URL.createObjectURL; downloadFile() calls it.
    global.URL.createObjectURL = vi.fn(() => "blob:mock");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_DATA_API;
  });

  it("uses POST not GET when downloading selected rows", async () => {
    const user = userEvent.setup();
    let requestMethod = "";
    server.use(
      http.post(`${DATA_API}/protein_feature/`, ({ request }) => {
        requestMethod = request.method;
        return HttpResponse.json(twoRows);
      }),
    );

    render(
      <DataTable
        id="dl-method"
        data={twoRows}
        columns={dlColumns}
        totalItems={2}
        resource="protein_feature"
        selectedIds={["aaaa-0001", "aaaa-0002"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Download Selected \(CSV\)/i }));
    await waitFor(() => { expect(requestMethod).toBe("POST"); });
  });

  it("sends RQL query in POST body, not in URL query string", async () => {
    const user = userEvent.setup();
    let capturedUrl = "";
    let capturedBody = "";
    server.use(
      http.post(`${DATA_API}/protein_feature/`, async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = await request.text();
        return HttpResponse.json(twoRows);
      }),
    );

    render(
      <DataTable
        id="dl-body"
        data={twoRows}
        columns={dlColumns}
        totalItems={2}
        resource="protein_feature"
        selectedIds={["aaaa-0001", "aaaa-0002"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Download Selected \(CSV\)/i }));
    await waitFor(() => { expect(capturedBody).toBeTruthy(); });

    expect(capturedBody).toBe("or(eq(id,aaaa-0001),eq(id,aaaa-0002))");
    expect(capturedUrl).not.toContain("or(eq(id,");
  });

  it("Range header matches selected count", async () => {
    const user = userEvent.setup();
    let rangeHeader = "";
    server.use(
      http.post(`${DATA_API}/protein_feature/`, ({ request }) => {
        rangeHeader = request.headers.get("Range") ?? "";
        return HttpResponse.json(twoRows);
      }),
    );

    render(
      <DataTable
        id="dl-range"
        data={twoRows}
        columns={dlColumns}
        totalItems={2}
        resource="protein_feature"
        selectedIds={["aaaa-0001", "aaaa-0002"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Download Selected \(CSV\)/i }));
    await waitFor(() => { expect(rangeHeader).toBeTruthy(); });
    expect(rangeHeader).toBe("items=0-2");
  });

  it("uses correct id field per resource: genome_id for genome", async () => {
    const user = userEvent.setup();
    let capturedBody = "";
    server.use(
      http.post(`${DATA_API}/genome/`, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json([]);
      }),
    );

    render(
      <DataTable
        id="dl-genome"
        data={[{ genome_id: "1234.1", source: "ref", product: "genome" }]}
        columns={[{ id: "source", label: "Source", visible: true }]}
        totalItems={1}
        resource="genome"
        selectedIds={["1234.1"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Download Selected \(CSV\)/i }));
    await waitFor(() => { expect(capturedBody).toBeTruthy(); });
    expect(capturedBody).toBe("or(eq(genome_id,1234.1))");
  });

  it("regression: 200 selected IDs fit in POST body (GET URL would have caused ERR_FAILED)", async () => {
    const user = userEvent.setup();
    const ids = Array.from({ length: 200 }, (_, i) => `id-${String(i).padStart(4, "0")}`);
    const rows = ids.map((id) => ({ id, source: "Pfam", product: "poly" }));
    let capturedBody = "";

    server.use(
      http.post(`${DATA_API}/protein_feature/`, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json(rows);
      }),
    );

    render(
      <DataTable
        id="dl-200"
        data={rows.slice(0, 5)}
        columns={dlColumns}
        totalItems={200}
        resource="protein_feature"
        selectedIds={ids}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Download Selected \(CSV\)/i }));
    await waitFor(() => { expect(capturedBody).toBeTruthy(); }, { timeout: 5000 });

    expect(capturedBody).toMatch(/^or\(/);
    // First and last IDs present — a GET URL would have hit length limits and lost some
    expect(capturedBody).toContain("id-0000");
    expect(capturedBody).toContain("id-0199");
  });

  it("Download Selected button absent when selectedIds is empty", () => {
    render(
      <DataTable
        id="dl-empty"
        data={twoRows}
        columns={dlColumns}
        totalItems={2}
        resource="protein_feature"
        selectedIds={[]}
      />,
    );
    expect(screen.queryByRole("button", { name: /Download Selected/i })).not.toBeInTheDocument();
  });

  it("triggers anchor click (file download) after successful POST", async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { /* no-op */ });

    server.use(
      http.post(`${DATA_API}/protein_feature/`, () =>
        HttpResponse.json([{ id: "aaaa-0001", source: "PRINTS", product: "polyprotein" }]),
      ),
    );

    render(
      <DataTable
        id="dl-file"
        data={twoRows}
        columns={dlColumns}
        totalItems={2}
        resource="protein_feature"
        selectedIds={["aaaa-0001"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Download Selected \(CSV\)/i }));
    await waitFor(() => { expect(clickSpy).toHaveBeenCalled(); });
    clickSpy.mockRestore();
  });

  it("logs error and does not crash when POST returns 500", async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => { /* no-op */ });

    server.use(
      http.post(`${DATA_API}/protein_feature/`, () => new HttpResponse(null, { status: 500 })),
    );

    render(
      <DataTable
        id="dl-500"
        data={twoRows}
        columns={dlColumns}
        totalItems={2}
        resource="protein_feature"
        selectedIds={["aaaa-0001"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Download Selected \(CSV\)/i }));
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("Download selected failed:", expect.any(Error));
    });
    errorSpy.mockRestore();
  });

  it("handles {items:[...]} response envelope and still downloads", async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { /* no-op */ });

    server.use(
      http.post(`${DATA_API}/protein_feature/`, () =>
        HttpResponse.json({ items: [{ id: "aaaa-0001", source: "PRINTS", product: "poly" }] }),
      ),
    );

    render(
      <DataTable
        id="dl-envelope"
        data={twoRows}
        columns={dlColumns}
        totalItems={2}
        resource="protein_feature"
        selectedIds={["aaaa-0001"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Download Selected \(CSV\)/i }));
    await waitFor(() => { expect(clickSpy).toHaveBeenCalled(); });
    clickSpy.mockRestore();
  });
});
