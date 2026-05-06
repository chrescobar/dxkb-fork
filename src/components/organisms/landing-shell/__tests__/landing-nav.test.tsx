import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Blocks, Dna } from "lucide-react";
import { vi } from "vitest";

import { LandingNav } from "../landing-nav";
import type { OrganismLandingNavItem } from "@/components/organisms/types";

const items: OrganismLandingNavItem[] = [
  { key: "overview", label: "Overview", icon: <Blocks /> },
  { key: "genomes", label: "Genomes", icon: <Dna /> },
];

describe("LandingNav", () => {
  it("renders items and marks the active view", () => {
    render(
      <LandingNav
        items={items}
        activeView="overview"
        collapsed={false}
        onChange={vi.fn()}
        onCollapseToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Overview/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /Genomes/ })).toBeInTheDocument();
  });

  it("calls onChange when an item is clicked", async () => {
    const onChange = vi.fn();
    render(
      <LandingNav
        items={items}
        activeView="overview"
        collapsed={false}
        onChange={onChange}
        onCollapseToggle={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Genomes/ }));

    expect(onChange).toHaveBeenCalledWith("genomes");
  });

  it("hides labels in collapsed mode", () => {
    render(
      <LandingNav
        items={items}
        activeView="overview"
        collapsed
        onChange={vi.fn()}
        onCollapseToggle={vi.fn()}
      />,
    );

    expect(screen.queryByText("Views")).not.toBeInTheDocument();
    expect(screen.getByTitle("Overview")).toBeInTheDocument();
  });
});
