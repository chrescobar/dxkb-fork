import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ViralGenomeTreePage from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

vi.mock("@/hooks/services/use-viral-genome-group-validation", () => ({
  useViralGenomeGroupValidation: () => ({
    validate: vi.fn().mockResolvedValue({ status: "ok", genomeIds: [] }),
    isValidating: false,
  }),
}));

describe("ViralGenomeTreePage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("renders the page heading", async () => {
    render(<ViralGenomeTreePage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Viral Genome Tree/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows the Metadata Options collapsible section", async () => {
    render(<ViralGenomeTreePage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(screen.getByText(/Metadata Options/i)).toBeInTheDocument();
    });

    const metadataToggle = screen.getByText(/Metadata Options/i);
    await userEvent.click(metadataToggle);

    await waitFor(() => {
      expect(screen.getByText(/Metadata Table Fields/i)).toBeInTheDocument();
    });
  });
});
