import { render, screen, waitFor } from "@testing-library/react";
import GenomeAnnotationContent from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

vi.mock("@/components/taxonomy/taxon-name-selector", () => ({
  TaxonNameSelector: ({ onChange }: { onChange: (item: { taxon_id: number; taxon_name: string } | null) => void; placeholder?: string }) => (
    <button
      data-testid="taxon-name-selector"
      onClick={() => onChange({ taxon_id: 1234, taxon_name: "Bacillus cereus" })}
    >
      Select Taxon
    </button>
  ),
}));

vi.mock("@/components/taxonomy/tax-id-selector", () => ({
  TaxIDSelector: () => <input data-testid="tax-id-selector" readOnly />,
}));

describe("GenomeAnnotationContent page", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("renders the page without crashing", async () => {
    render(<GenomeAnnotationContent />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Genome Annotation/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders the taxon name selector", async () => {
    render(<GenomeAnnotationContent />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(screen.getByTestId("taxon-name-selector")).toBeInTheDocument();
    });
  });
});
