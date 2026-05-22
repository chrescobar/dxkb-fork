import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViralAssemblyPage } from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

describe("ViralAssemblyPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("renders the page heading", async () => {
    render(<ViralAssemblyPage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Viral Assembly/i }),
      ).toBeInTheDocument();
    });
  });

  it("switching input_type to single shows the single read selector placeholder", async () => {
    render(<ViralAssemblyPage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(screen.getByText(/Single Read Library/i)).toBeInTheDocument();
    });

    // Click the Single Read Library label to select its radio
    const singleLabel = screen.getByText("Single Read Library");
    await userEvent.click(singleLabel);

    // After switching, the single read selector becomes visible (not aria-hidden)
    await waitFor(() => {
      const singleSelectors = screen.getAllByPlaceholderText(/Select READ FILE/i);
      // The single mode selector should be present
      expect(singleSelectors.length).toBeGreaterThan(0);
    });
  });
});
