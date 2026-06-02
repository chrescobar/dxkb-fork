import { render, screen } from "@testing-library/react";

import { SectionError } from "../section-error";

describe("SectionError", () => {
  it("renders the original error message verbatim", () => {
    render(<SectionError message={"BV-BRC overloaded\ntry again"} />);

    expect(screen.getByText("Section unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("section-error-message")).toHaveTextContent(
      "BV-BRC overloaded\ntry again",
      { normalizeWhitespace: false },
    );
  });
});
