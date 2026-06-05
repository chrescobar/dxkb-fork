import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { vi } from "vitest";

vi.mock("@/lib/services/organisms/metadata-facets", () => ({
  fetchOrganismMetadataFacets: vi.fn(),
}));

vi.mock("@/lib/services/organisms/serotype-distribution", () => ({
  fetchSerotypeDistribution: vi.fn(),
}));

const barStackSpy = vi.fn();

vi.mock("../bar-stack-chart", () => ({
  BarStackChart: (props: { title: string; data: unknown }) => {
    barStackSpy(props);
    return <div data-testid="serotype-chart" data-title={props.title} />;
  },
}));

import { MetadataDistributions } from "../metadata-distributions";
import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";
import { fetchSerotypeDistribution } from "@/lib/services/organisms/serotype-distribution";

async function renderServer(node: Promise<React.ReactElement>) {
  const resolved = await node;
  return render(<Suspense fallback={null}>{resolved}</Suspense>);
}

describe("MetadataDistributions", () => {
  it("renders configured donut charts and omits the serotype chart by default", async () => {
    vi.mocked(fetchOrganismMetadataFacets).mockResolvedValueOnce({
      genus: [{ name: "Escherichia", count: 20 }],
      host_name: [{ name: "Homo sapiens", count: 12 }],
    });

    await renderServer(
      MetadataDistributions({ taxonId: 2, fields: ["genus", "host_name"] }),
    );

    expect(screen.getByRole("img", { name: "Genus distribution" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Host Name distribution" })).toBeInTheDocument();
    expect(screen.queryByTestId("serotype-chart")).not.toBeInTheDocument();
    expect(fetchSerotypeDistribution).not.toHaveBeenCalled();
  });

  it("fetches and renders the serotype chart when showSerotype is enabled", async () => {
    const serotypeData = {
      years: [{ year: 2020, Typhi: 5 }],
      serovars: ["Typhi"],
    };
    vi.mocked(fetchOrganismMetadataFacets).mockResolvedValueOnce({
      genus: [{ name: "Salmonella", count: 99 }],
    });
    vi.mocked(fetchSerotypeDistribution).mockResolvedValueOnce(serotypeData);
    barStackSpy.mockClear();

    await renderServer(
      MetadataDistributions({ taxonId: 590, fields: ["genus"], showSerotype: true }),
    );

    expect(fetchSerotypeDistribution).toHaveBeenCalledWith(590);
    expect(screen.getByTestId("serotype-chart")).toBeInTheDocument();
    expect(barStackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Serotype Distribution (Last 10 Years)",
        data: serotypeData,
      }),
    );
  });

  it("still renders facet charts when the serotype fetch fails", async () => {
    vi.mocked(fetchOrganismMetadataFacets).mockResolvedValueOnce({
      genus: [{ name: "Salmonella", count: 99 }],
    });
    vi.mocked(fetchSerotypeDistribution).mockRejectedValueOnce(new Error("boom"));
    barStackSpy.mockClear();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await renderServer(
      MetadataDistributions({ taxonId: 590, fields: ["genus"], showSerotype: true }),
    );

    expect(screen.getByRole("img", { name: "Genus distribution" })).toBeInTheDocument();
    expect(screen.getByTestId("serotype-chart")).toBeInTheDocument();
    expect(barStackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ data: { years: [], serovars: [] } }),
    );
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
