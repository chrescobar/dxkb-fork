import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { vi } from "vitest";

vi.mock("@/lib/services/organisms/summary", () => ({
  fetchOrganismSummary: vi.fn(),
}));

import { DataSummary } from "../data-summary";
import { fetchOrganismSummary } from "@/lib/services/organisms/summary";

async function renderServer(node: Promise<React.ReactElement>) {
  const resolved = await node;
  return render(<Suspense fallback={null}>{resolved}</Suspense>);
}

describe("DataSummary", () => {
  it("renders all KPI cards with formatted values", async () => {
    vi.mocked(fetchOrganismSummary).mockResolvedValueOnce({
      count: 1337420,
      uniqueFamily: 391,
      uniqueGenus: 5432,
      uniqueSpecies: 82915,
      cds: 482001224,
      matPeptide: 23144,
      pdb: 9821,
    });

    await renderServer(DataSummary({ taxonId: 2 }));

    expect(screen.getByText("1,337,420")).toBeInTheDocument();
    expect(screen.getByText("Families")).toBeInTheDocument();
    expect(screen.getByText("482,001,224")).toBeInTheDocument();
  });
});
