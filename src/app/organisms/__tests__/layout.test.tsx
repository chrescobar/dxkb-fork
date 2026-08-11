import { render, screen } from "@testing-library/react";

vi.mock("@/components/navbars/navbar", () => ({
  default: () => <nav>Navbar</nav>,
}));

import OrganismsLayout from "../layout";

describe("OrganismsLayout", () => {
  it("keeps the navbar and content but omits the global footer", () => {
    render(
      <OrganismsLayout>
        <div>Organism content</div>
      </OrganismsLayout>,
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("Organism content")).toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
    expect(screen.getByText("Organism content").parentElement?.parentElement).toHaveClass(
      "h-screen",
      "overflow-hidden",
    );
    expect(screen.getByRole("main")).toHaveClass("min-h-0", "grow", "pt-4");
    expect(screen.getByRole("main")).not.toHaveClass("pb-4", "py-4");
  });
});
