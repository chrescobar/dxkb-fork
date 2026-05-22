import { render, screen, waitFor } from "@testing-library/react";
import FastqUtilitiesPage from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

describe("FastqUtilitiesPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("renders the page heading", async () => {
    render(<FastqUtilitiesPage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /FastQ Utilities/i }),
      ).toBeInTheDocument();
    });
  });

  it("target genome selector is disabled initially (no Align action selected)", async () => {
    render(<FastqUtilitiesPage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(
        screen.getByText(/Add the Align action to enable genome selection/i),
      ).toBeInTheDocument();
    });
  });
});
