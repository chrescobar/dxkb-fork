import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { vi } from "vitest";

vi.mock("@/lib/services/organisms/metadata-facets", () => ({
  fetchOrganismMetadataFacets: vi.fn(),
}));

vi.mock("@/lib/services/organisms/serotype-distribution", () => ({
  fetchSerotypeDistribution: vi.fn(),
}));

vi.mock("@/lib/services/organisms/taxonomic-distribution", () => ({
  fetchTaxonomicDistribution: vi.fn(),
}));

vi.mock("@/lib/services/organisms/cgmlst-distribution", () => ({
  fetchCgmlstHcDistribution: vi.fn(),
  hcLevels: ["hc0", "hc2", "hc5", "hc10", "hc20", "hc50", "hc100"],
}));

vi.mock("@/lib/services/organisms/amr-distribution", () => ({
  fetchAmrPhenotypeDistribution: vi.fn(),
}));

const barStackSpy = vi.fn();

vi.mock("../bar-stack-chart", () => ({
  BarStackChart: (props: { title: string; data: unknown }) => {
    barStackSpy(props);
    return <div data-testid="serotype-chart" data-title={props.title} />;
  },
}));

const amrSpy = vi.fn();

vi.mock("../amr-bar-stack-chart", () => ({
  AmrBarStackChart: (props: { title: string; data: unknown }) => {
    amrSpy(props);
    return <div data-testid="amr-chart" data-title={props.title} />;
  },
}));

import { MetadataDistributions } from "../metadata-distributions";
import { fetchOrganismMetadataFacets } from "@/lib/services/organisms/metadata-facets";
import { fetchSerotypeDistribution } from "@/lib/services/organisms/serotype-distribution";
import { fetchTaxonomicDistribution } from "@/lib/services/organisms/taxonomic-distribution";
import { fetchCgmlstHcDistribution } from "@/lib/services/organisms/cgmlst-distribution";
import { fetchAmrPhenotypeDistribution } from "@/lib/services/organisms/amr-distribution";

const emptyTaxonomic = { genus: [], species: [] };
const emptyCgmlst = {
  hc0: [], hc2: [], hc5: [], hc10: [], hc20: [], hc50: [], hc100: [],
};

beforeEach(() => {
  vi.mocked(fetchTaxonomicDistribution).mockResolvedValue(emptyTaxonomic);
  vi.mocked(fetchCgmlstHcDistribution).mockResolvedValue(emptyCgmlst);
});

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

  it("still renders facet charts when the serotype fetch fails and propagates the error message", async () => {
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
      expect.objectContaining({
        data: { years: [], serovars: [] },
        errorMessage: "boom",
      }),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
    warnSpy.mockRestore();
  });

  it("renders Taxonomic Distribution and cgMLST HC Distribution charts", async () => {
    vi.mocked(fetchOrganismMetadataFacets).mockResolvedValueOnce({});
    vi.mocked(fetchTaxonomicDistribution).mockResolvedValueOnce({
      genus: [{ name: "Brucella", count: 100 }],
      species: [{ name: "Brucella abortus", count: 50 }],
    });
    vi.mocked(fetchCgmlstHcDistribution).mockResolvedValueOnce({
      hc0: [{ name: "1", count: 200 }],
      hc2: [], hc5: [], hc10: [], hc20: [], hc50: [], hc100: [],
    });

    await renderServer(MetadataDistributions({ taxonId: 234, fields: [] }));

    expect(fetchTaxonomicDistribution).toHaveBeenCalledWith(234);
    expect(fetchCgmlstHcDistribution).toHaveBeenCalledWith(234);
    expect(screen.getByText("Taxonomic Distribution")).toBeInTheDocument();
    expect(screen.getByText("cgMLST HC Distribution")).toBeInTheDocument();
  });

  it("still renders when the taxonomic distribution fetch fails and shows an inline error", async () => {
    vi.mocked(fetchOrganismMetadataFacets).mockResolvedValueOnce({
      genus: [{ name: "Brucella", count: 100 }],
    });
    vi.mocked(fetchTaxonomicDistribution).mockRejectedValueOnce(new Error("taxonomic boom"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await renderServer(MetadataDistributions({ taxonId: 234, fields: ["genus"] }));

    expect(screen.getByRole("img", { name: "Genus distribution" })).toBeInTheDocument();
    expect(screen.getByText("Taxonomic Distribution")).toBeInTheDocument();
    expect(screen.getByText(/Could not load: taxonomic boom/)).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("taxonomic boom"),
    );
    warnSpy.mockRestore();
  });

  it("shows an inline error in the cgMLST card when its fetch fails", async () => {
    vi.mocked(fetchOrganismMetadataFacets).mockResolvedValueOnce({});
    vi.mocked(fetchCgmlstHcDistribution).mockReset();
    vi.mocked(fetchCgmlstHcDistribution).mockRejectedValueOnce(new Error("cgmlst boom"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await renderServer(MetadataDistributions({ taxonId: 234, fields: [] }));

    expect(screen.getByText("cgMLST HC Distribution")).toBeInTheDocument();
    expect(screen.getByText(/Could not load: cgmlst boom/)).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("cgmlst boom"));
    warnSpy.mockRestore();
  });

  it("does not fetch or render the AMR chart by default", async () => {
    vi.mocked(fetchOrganismMetadataFacets).mockResolvedValueOnce({});
    amrSpy.mockClear();

    await renderServer(MetadataDistributions({ taxonId: 1, fields: [] }));

    expect(fetchAmrPhenotypeDistribution).not.toHaveBeenCalled();
    expect(amrSpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId("amr-chart")).not.toBeInTheDocument();
  });

  it("fetches and renders the AMR chart when showAmr is enabled", async () => {
    const amrData = {
      antibiotics: [
        {
          antibiotic: "ciprofloxacin",
          Resistant: 1,
          Susceptible: 2,
          Intermediate: 0,
          total: 3,
        },
      ],
    };
    vi.mocked(fetchOrganismMetadataFacets).mockResolvedValueOnce({});
    vi.mocked(fetchAmrPhenotypeDistribution).mockResolvedValueOnce(amrData);
    amrSpy.mockClear();

    await renderServer(
      MetadataDistributions({ taxonId: 197, fields: [], showAmr: true }),
    );

    expect(fetchAmrPhenotypeDistribution).toHaveBeenCalledWith(197);
    expect(screen.getByTestId("amr-chart")).toBeInTheDocument();
    expect(amrSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Antimicrobial Resistance Profile",
        data: amrData,
      }),
    );
  });

  it("falls back to empty AMR data when the AMR fetch fails and surfaces the error", async () => {
    vi.mocked(fetchOrganismMetadataFacets).mockResolvedValueOnce({});
    vi.mocked(fetchAmrPhenotypeDistribution).mockRejectedValueOnce(
      new Error("amr boom"),
    );
    amrSpy.mockClear();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await renderServer(
      MetadataDistributions({ taxonId: 197, fields: [], showAmr: true }),
    );

    expect(screen.getByTestId("amr-chart")).toBeInTheDocument();
    expect(amrSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { antibiotics: [] },
        errorMessage: "amr boom",
      }),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("amr boom"),
    );
    warnSpy.mockRestore();
  });
});
