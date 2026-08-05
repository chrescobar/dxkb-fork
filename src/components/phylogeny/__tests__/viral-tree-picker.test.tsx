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

// Two strains where H5N1 is Archaeopteryx-only and PB2-only, so every facet has
// at least one dead-end option to disable.
const mixedBlock: PhyloFamilyBlock = {
  groups: [
    {
      key: "h3n2",
      title: "H3N2",
      archaeopteryx: [{ name: "XML HA (HA)", path: "/h3n2-ha.xml" }],
      nextstrain: [{ name: "Auspice NA (NA)", path: "/Influenza-A-Virus/H3N2/NA/" }],
    },
    {
      key: "h5n1",
      title: "H5N1",
      archaeopteryx: [{ name: "XML PB2 (PB2)", path: "/h5n1-pb2.xml" }],
      nextstrain: [],
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

  it("disables viewer and segment options that have no trees for the chosen strain", async () => {
    const user = userEvent.setup();
    render(
      <ViralTreePicker
        block={mixedBlock}
        availableNextstrainIds={new Set(["Influenza-A-Virus/H3N2/NA"])}
        onOpen={vi.fn()}
      />,
    );

    // Base UI renders these as <span role="radio"> with aria-disabled, not a
    // natively disabled input, so assert on the ARIA state.
    const auspice = screen.getByRole("radio", { name: /Auspice/ });
    expect(auspice).not.toHaveAttribute("aria-disabled", "true");

    await user.click(screen.getByRole("radio", { name: /H5N1/ }));
    // H5N1 has no Auspice trees, and only PB2 among the segments.
    expect(auspice).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("radio", { name: /Archaeopteryx/ })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("checkbox", { name: /PB2/ })).not.toHaveAttribute("aria-disabled", "true");
    for (const segment of ["HA", "NA"]) {
      expect(screen.getByRole("checkbox", { name: new RegExp(`^${segment}`) }))
        .toHaveAttribute("aria-disabled", "true");
    }

    // A disabled option must also be inert, not merely styled.
    await user.click(auspice);
    expect(auspice).toHaveAttribute("aria-checked", "false");

    // Strain is never disabled, so the cascade can relax the viewer rather
    // than locking the user into a dead end.
    await user.click(screen.getByRole("radio", { name: /All strains/ }));
    await user.click(screen.getByRole("radio", { name: /Auspice/ }));
    expect(screen.getByRole("radio", { name: /H5N1/ })).not.toHaveAttribute("aria-disabled", "true");
  });

  it("re-enables options and keeps the segment list stable as filters change", async () => {
    const user = userEvent.setup();
    render(<ViralTreePicker block={mixedBlock} availableNextstrainIds={new Set()} onOpen={vi.fn()} />);

    // Trailing count is a separate span; drop it to compare the labels alone.
    const segmentNames = () =>
      screen.getAllByRole("checkbox").map(box =>
        [...(box.parentElement?.childNodes ?? [])]
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent?.trim())
          .join(""),
      );
    const before = segmentNames();
    expect(before).toEqual(["PB2", "HA", "NA"]);

    // Options are disabled, never removed — the list must not reflow under the
    // cursor when a filter narrows the results.
    await user.click(screen.getByRole("radio", { name: /H5N1/ }));
    expect(segmentNames()).toEqual(before);

    // And clearing the filter brings them back enabled.
    await user.click(screen.getByRole("radio", { name: /All strains/ }));
    for (const box of screen.getAllByRole("checkbox")) {
      expect(box).not.toHaveAttribute("aria-disabled", "true");
    }
    expect(screen.getByRole("radio", { name: /Auspice/ })).not.toHaveAttribute("aria-disabled", "true");
  });

  it("does not disable a checked segment when another filter narrows the set", async () => {
    const user = userEvent.setup();
    render(<ViralTreePicker block={mixedBlock} availableNextstrainIds={new Set()} onOpen={vi.fn()} />);

    // Segments are a union, so counting one must ignore the others; checking HA
    // must not zero out NA and strand the user on a single segment.
    await user.click(screen.getByRole("checkbox", { name: /^HA/ }));
    const na = screen.getByRole("checkbox", { name: /^NA/ });
    expect(na).not.toHaveAttribute("aria-disabled", "true");

    await user.click(na);
    expect(screen.getByRole("checkbox", { name: /^HA/ })).toHaveAttribute("aria-checked", "true");
    expect(na).toHaveAttribute("aria-checked", "true");
  });

  it("leaves a disabled segment checkbox inert", async () => {
    const user = userEvent.setup();
    render(<ViralTreePicker block={mixedBlock} availableNextstrainIds={new Set()} onOpen={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: /H5N1/ }));
    const ha = screen.getByRole("checkbox", { name: /^HA/ });
    expect(ha).toHaveAttribute("aria-disabled", "true");

    await user.click(ha);
    expect(ha).toHaveAttribute("aria-checked", "false");
    // Card list unchanged: the dead-end click did nothing.
    expect(screen.getByText("XML PB2 (PB2)")).toBeInTheDocument();
  });

  it("hides the viewer filter entirely when only one viewer exists", () => {
    render(
      <ViralTreePicker
        block={{ groups: [{ key: "xml", title: "XML", archaeopteryx: [{ name: "A (HA)", path: "/a.xml" }, { name: "B (NA)", path: "/b.xml" }] }] }}
        availableNextstrainIds={new Set()}
        onOpen={vi.fn()}
      />,
    );

    // A single-viewer block has nothing to disable — the fieldset is dropped
    // rather than rendered with one permanently-zero option.
    expect(screen.queryByRole("radio", { name: /Archaeopteryx/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /All viewers/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("scrolls the sidebar and grid independently at lg so filters stay pinned", () => {
    const { container } = render(
      <ViralTreePicker block={block} availableNextstrainIds={new Set()} onOpen={vi.fn()} />,
    );

    // jsdom has no layout, so assert the class contract instead of geometry;
    // e2e/tests/organisms/auspice.spec.ts measures the real scroll behaviour.
    const grid = container.querySelector("div.grid.lg\\:grid-cols-\\[260px_1fr\\]");
    const aside = container.querySelector("aside");
    const main = container.querySelector("main");

    expect(grid).toHaveClass("lg:overflow-hidden");
    for (const column of [aside, main]) {
      expect(column).toHaveClass("lg:min-h-0", "lg:overflow-y-auto");
    }
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
