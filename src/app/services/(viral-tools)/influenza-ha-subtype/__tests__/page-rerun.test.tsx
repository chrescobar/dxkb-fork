import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HASubtypeNumberingPage from "../page";
import { ServicePageProviders } from "@/test-helpers/service-page-providers";
import { installServicePageBaseline } from "@/test-helpers/service-page-mocks";

describe("HASubtypeNumberingPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    installServicePageBaseline();
  });

  it("Submit is disabled when fasta_data mode has invalid content", async () => {
    render(<HASubtypeNumberingPage />, { wrapper: ServicePageProviders });

    // The default input source is fasta_data; type invalid (non-FASTA) content
    const textarea = screen.getByPlaceholderText(
      /Enter one or more protein sequences in FASTA format/i,
    );
    await userEvent.type(textarea, "not-a-fasta-sequence");
    await userEvent.tab(); // trigger onBlur validation

    // isFastaDataInvalid should be true after blur because content is not empty but not valid FASTA
    const submitButton = screen.getByRole("button", { name: /submit/i });
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
