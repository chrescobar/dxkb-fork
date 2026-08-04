import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PhyloFamilyBlock } from "@/lib/services/organisms/phylogeny";
import { ViralTreePicker } from "../viral-tree-picker";

const block: PhyloFamilyBlock = {
  groups: [
    {
      key: "h3n2",
      title: "H3N2",
      archaeopteryx: [
        { name: "XML HA", path: "/ha.xml", metadata: "/ha.tar.gz" },
      ],
      nextstrain: [
        { name: "Auspice HA", path: "/Influenza-A-Virus/H3N2/HA/" },
        { name: "Missing NA", path: "Influenza-A-Virus/H3N2/NA" },
      ],
    },
  ],
};

function card(name: string): HTMLElement {
  const element = screen.getByText(name).closest<HTMLElement>("[data-slot=card]");
  if (!element) throw new Error(`card '${name}' not found`);
  return element;
}

describe("ViralTreePicker", () => {
  it.each(["Enter", " "])("opens an available canonical dataset with %j", key => {
    const onOpen = vi.fn();
    render(
      <ViralTreePicker
        block={block}
        availableNextstrainIds={new Set(["Influenza-A-Virus/H3N2/HA"])}
        onOpen={onOpen}
      />,
    );

    fireEvent.keyDown(card("Auspice HA"), { key });
    expect(onOpen).toHaveBeenCalledOnce();
    expect(onOpen.mock.calls[0]?.[0]).toMatchObject({
      viewer: "nextstrain",
      ref: { path: "/Influenza-A-Virus/H3N2/HA/" },
    });
  });

  it("keeps unavailable cards visible, untabbable, and inert", () => {
    const onOpen = vi.fn();
    render(
      <ViralTreePicker block={block} availableNextstrainIds={new Set()} onOpen={onOpen} />,
    );

    const unavailable = card("Missing NA");
    expect(unavailable).toHaveAttribute("aria-disabled", "true");
    expect(unavailable).toHaveAttribute("tabindex", "-1");
    fireEvent.click(unavailable);
    fireEvent.keyDown(unavailable, { key: "Enter" });
    fireEvent.keyDown(unavailable, { key: " " });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("uses Archaeopteryx and Auspice labels and filters mixed choices", async () => {
    const user = userEvent.setup();
    render(
      <ViralTreePicker
        block={block}
        availableNextstrainIds={new Set(["Influenza-A-Virus/H3N2/HA"])}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText("Archaeopteryx")).toBeInTheDocument();
    expect(screen.getByText("Auspice")).toBeInTheDocument();
    expect(screen.getByText("Nextstrain phylogenomic viewer")).toBeInTheDocument();

    await user.click(screen.getByText("Auspice"));
    expect(screen.queryByText("XML HA")).not.toBeInTheDocument();
    expect(screen.getByText("Auspice HA")).toBeInTheDocument();
    expect(screen.getByText("Missing NA")).toBeInTheDocument();
  });

  it("does not show a viewer filter for an Archaeopteryx-only block", () => {
    render(
      <ViralTreePicker
        block={{ groups: [{ key: "xml", title: "XML", archaeopteryx: [{ name: "Only XML", path: "/tree.xml" }] }] }}
        availableNextstrainIds={new Set()}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.queryByText("Auspice")).not.toBeInTheDocument();
    expect(screen.getByText("Only XML")).toBeInTheDocument();
  });

  it("keeps metadata downloads independent from card activation", () => {
    const onOpen = vi.fn();
    render(
      <ViralTreePicker block={block} availableNextstrainIds={new Set()} onOpen={onOpen} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Download metadata for XML HA" }));
    expect(onOpen).not.toHaveBeenCalled();
  });
});
