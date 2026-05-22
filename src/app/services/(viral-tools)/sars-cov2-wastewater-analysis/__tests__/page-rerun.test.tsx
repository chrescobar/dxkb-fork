import { render, screen, waitFor } from "@testing-library/react";
import SarsCov2WastewaterAnalysisPage from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

describe("SarsCov2WastewaterAnalysisPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("renders the page heading", async () => {
    render(<SarsCov2WastewaterAnalysisPage />, {
      wrapper: ServicePageProviders,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /SARS-CoV-2 Wastewater Analysis/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders the primers section with default ARTIC selection", async () => {
    render(<SarsCov2WastewaterAnalysisPage />, {
      wrapper: ServicePageProviders,
    });

    await waitFor(() => {
      expect(screen.getByText(/Primers/i)).toBeInTheDocument();
    });

    // The default primer is ARTIC — the select trigger should show it
    expect(screen.getByText("ARTIC")).toBeInTheDocument();
  });
});
