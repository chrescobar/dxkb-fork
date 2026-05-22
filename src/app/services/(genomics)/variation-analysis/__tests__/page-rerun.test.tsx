import { render, screen, waitFor } from "@testing-library/react";
import VariationAnalysisPage from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe("VariationAnalysisPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("renders the page heading", async () => {
    render(<VariationAnalysisPage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Variation Analysis/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders the Input File and Parameters sections", async () => {
    render(<VariationAnalysisPage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Variation Analysis/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Input File/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Parameters/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });
});
