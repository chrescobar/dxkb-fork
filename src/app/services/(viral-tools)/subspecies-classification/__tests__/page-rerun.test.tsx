import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubspeciesClassificationPage from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

describe("SubspeciesClassificationPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("pre-fills virus_type from rerun data", async () => {
    const rerunKey = "test-subspecies-key";
    sessionStorage.setItem(
      rerunKey,
      JSON.stringify({
        input_source: "fasta_data",
        virus_type: "Influenza A Virus",
        output_path: "/ws/testuser",
        output_file: "my-output",
      }),
    );
    window.history.replaceState({}, "", `/?rerun_key=${rerunKey}`);

    render(<SubspeciesClassificationPage />, { wrapper: ServicePageProviders });

    await waitFor(() => {
      expect(screen.getByText("Influenza A Virus")).toBeInTheDocument();
    });
  });

  it("switching input_source to fasta_file renders the file selector", async () => {
    render(<SubspeciesClassificationPage />, { wrapper: ServicePageProviders });

    // Use the label element to find and click the fasta_file radio option
    const fastaFileLabel = screen.getByText("Select FASTA file");
    await userEvent.click(fastaFileLabel);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Select or upload FASTA file to your workspace/i),
      ).toBeInTheDocument();
    });
  });
});
