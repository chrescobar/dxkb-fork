import { render, screen, waitFor } from "@testing-library/react";
import MetagenomicReadMappingPage from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

describe("MetagenomicReadMappingPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("renders page heading", async () => {
    render(<MetagenomicReadMappingPage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Metagenomic Read Mapping/i }),
      ).toBeInTheDocument();
    });
  });

  it("predefined_list gene_set_type is selected by default and shows gene-set-name select", async () => {
    render(<MetagenomicReadMappingPage />, { wrapper: ServicePageProviders });

    // The default gene_set_type is predefined_list, so the label should be visible immediately
    await waitFor(() => {
      expect(
        screen.getByText(/Predefined Gene Set Name/i),
      ).toBeInTheDocument();
    });
  });
});
