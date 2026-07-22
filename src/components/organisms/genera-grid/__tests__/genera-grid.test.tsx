import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { vi } from "vitest";

vi.mock("@/lib/services/organisms/genera", () => ({
  fetchOrganismGenera: vi.fn(),
}));

import { GeneraGrid } from "../genera-grid";
import { fetchOrganismGenera } from "@/lib/services/organisms/genera";

async function renderServer(node: Promise<React.ReactElement>) {
  const resolved = await node;
  return render(<Suspense fallback={null}>{resolved}</Suspense>);
}

describe("GeneraGrid", () => {
  it("renders fetched genus cards", async () => {
    vi.mocked(fetchOrganismGenera).mockResolvedValueOnce([
      { name: "Escherichia", count: 20 },
      { name: "Klebsiella", count: 10 },
    ]);

    await renderServer(GeneraGrid({ taxonId: 2, limit: 24 }));

    expect(screen.getByText("Top Genera")).toBeInTheDocument();
    expect(screen.getByText("Escherichia")).toBeInTheDocument();
    expect(screen.getByText("Klebsiella")).toBeInTheDocument();
  });
});
