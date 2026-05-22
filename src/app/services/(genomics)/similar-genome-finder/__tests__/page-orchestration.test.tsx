import { render, screen, waitFor } from "@testing-library/react";
import SimilarGenomeFinderServicePage from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

vi.mock(
  "@/app/services/(genomics)/similar-genome-finder/actions",
  () => ({
    submitSimilarGenomes: vi.fn().mockResolvedValue({ success: true, rows: [] }),
  }),
);

describe("SimilarGenomeFinderServicePage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("renders the page heading", async () => {
    render(<SimilarGenomeFinderServicePage />, {
      wrapper: ServicePageProviders,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Similar Genome Finder/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders the genome selector and the Results section", async () => {
    render(<SimilarGenomeFinderServicePage />, {
      wrapper: ServicePageProviders,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Search by Genome Name or Genome ID/i),
      ).toBeInTheDocument();
    });

    // Results card header is always visible
    expect(screen.getAllByText(/Results/i).length).toBeGreaterThan(0);
    // Search button is present
    expect(
      screen.getByRole("button", { name: /search/i }),
    ).toBeInTheDocument();
  });
});
