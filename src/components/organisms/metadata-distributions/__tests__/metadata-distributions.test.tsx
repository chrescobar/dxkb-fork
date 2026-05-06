import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { vi } from "vitest";

vi.mock("@/lib/services/organisms/metadata-facets", () => ({
  fetchOrganismMetadataFacets: vi.fn(),
}));

import { MetadataDistributions } from "../metadata-distributions";
import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";

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

    await renderServer(
      MetadataDistributions({ taxonId: 2, fields: ["genus", "host_name"] }),
    );

    expect(screen.getByRole("img", { name: "Genus distribution" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Host distribution" })).toBeInTheDocument();
  });
});
