import { render, screen, waitFor } from "@testing-library/react";
import ProteomeComparisonPage from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

vi.mock("@/lib/services/genome", () => ({
  fetchGenomesByIds: vi.fn().mockResolvedValue([]),
  getGenomeIdsFromGroup: vi.fn().mockResolvedValue([]),
}));

describe("ProteomeComparisonPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("renders the page heading", async () => {
    render(<ProteomeComparisonPage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Proteome Comparison/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows the comparison genomes section with 0/9 count", async () => {
    render(<ProteomeComparisonPage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(screen.getByText(/0 \/ 9 genome\(s\) selected/i)).toBeInTheDocument();
    });
  });
});
