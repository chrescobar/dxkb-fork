import { render, screen, waitFor } from "@testing-library/react";
import GenomeAlignmentServicePage from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

vi.mock("@/lib/services/genome", () => ({
  fetchGenomesByIds: vi.fn().mockResolvedValue([]),
}));

describe("GenomeAlignmentServicePage — submit gating", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("Submit is disabled when hasMinimumGenomes is false (no genomes selected)", async () => {
    render(<GenomeAlignmentServicePage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

  it("shows the minimum genomes helper text when no genomes are selected", async () => {
    render(<GenomeAlignmentServicePage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(
        screen.getByText(/Select at least two genomes to enable submission/i),
      ).toBeInTheDocument();
    });
  });
});
