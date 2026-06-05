import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { vi } from "vitest";

vi.mock("@/lib/services/organisms/metadata-facets", () => ({
  fetchOrganismMetadataFacets: vi.fn(),
}));

vi.mock("@/lib/services/organisms/serotype-distribution", () => ({
  fetchSerotypeDistribution: vi.fn(),
}));

vi.mock("../serotype-distribution-chart", () => ({
  SerotypeDistributionChart: () => <div data-testid="serotype-chart" />,
}));

import { MetadataDistributions } from "../metadata-distributions";
import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";
import { fetchSerotypeDistribution } from "@/lib/services/organisms/serotype-distribution";

async function renderServer(node: Promise<React.ReactElement>) {
  const resolved = await node;
  return render(<Suspense fallback={null}>{resolved}</Suspense>);
}

describe("MetadataDistributions", () => {
  it("renders configured donut charts", async () => {
    vi.mocked(fetchOrganismMetadataFacets).mockResolvedValueOnce({
      genus: [{ name: "Escherichia", count: 20 }],
      host_name: [{ name: "Homo sapiens", count: 12 }],
    });
    vi.mocked(fetchSerotypeDistribution).mockResolvedValueOnce({ years: [], serovars: [] });

    await renderServer(
      MetadataDistributions({ taxonId: 2, fields: ["genus", "host_name"] }),
    );

    expect(screen.getByRole("img", { name: "Genus distribution" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Host Name distribution" })).toBeInTheDocument();
    expect(screen.getByTestId("serotype-chart")).toBeInTheDocument();
  });
});
