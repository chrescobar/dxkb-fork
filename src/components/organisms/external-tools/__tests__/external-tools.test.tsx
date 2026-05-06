import { render, screen } from "@testing-library/react";

import { ExternalTools } from "../external-tools";

describe("ExternalTools", () => {
  it("renders configured resource links", () => {
    render(
      <ExternalTools
        resources={[
          {
            label: "BEI Resources",
            href: "https://www.beiresources.org/",
            description: "Reference materials",
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /BEI Resources/ })).toHaveAttribute(
      "href",
      "https://www.beiresources.org/",
    );
    expect(screen.getByText("Reference materials")).toBeInTheDocument();
  });
});
