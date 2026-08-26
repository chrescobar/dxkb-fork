import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { server } from "@/test-helpers/msw-server";
import { CsvViewer } from "../csv-viewer";

vi.mock("../../file-viewer-registry", () => ({
  getProxyUrl: vi.fn(() => "/api/csv-preview"),
  previewMaxBytes: 10 * 1024 * 1024,
}));

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        start: index * estimateSize(),
        end: (index + 1) * estimateSize(),
        size: estimateSize(),
        key: index,
        lane: 0,
      })),
    getTotalSize: () => count * estimateSize(),
    measureElement: vi.fn(),
  }),
}));

function renderedNames(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .filter((row) => row.hasAttribute("data-index"))
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent ?? "");
}

describe("CsvViewer", () => {
  it("refreshes virtual rows for ascending and descending client sorting", async () => {
    server.use(
      http.get("/api/csv-preview", () =>
        HttpResponse.text("name,value\nsample_12,2\nsample_2,1\nsample_1,3\n"),
      ),
    );
    const user = userEvent.setup();

    render(<CsvViewer filePath="/workspace/samples.csv" fileName="samples.csv" />);

    await waitFor(() => {
      expect(renderedNames()).toEqual(["sample_12", "sample_2", "sample_1"]);
    });

    await user.click(screen.getByRole("button", { name: "Sort by name" }));
    expect(renderedNames()).toEqual(["sample_1", "sample_2", "sample_12"]);

    await user.click(screen.getByRole("button", { name: "Sort by name" }));
    expect(renderedNames()).toEqual(["sample_12", "sample_2", "sample_1"]);
  });
});
