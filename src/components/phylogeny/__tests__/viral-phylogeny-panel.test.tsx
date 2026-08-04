const { useNextstrainInventory, useViralFamily, useViralTreeXml } = vi.hoisted(
  () => ({
    useNextstrainInventory: vi.fn(),
    useViralFamily: vi.fn(),
    useViralTreeXml: vi.fn(),
  }),
);

vi.mock("../use-phylogeny-data", () => ({
  useNextstrainInventory,
  useViralFamily,
  useViralTreeXml,
}));
vi.mock("../archaeopteryx-phylogeny", () => ({
  ArchaeopteryxPhylogeny: ({ title }: { title: string }) => (
    <div>Archaeopteryx: {title}</div>
  ),
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ViralPhylogenyPanel } from "../viral-phylogeny-panel";

const family = {
  groups: [
    {
      key: "h3n2",
      title: "H3N2",
      archaeopteryx: [{ name: "XML HA", path: "/tree.xml" }],
      nextstrain: [
        { name: "Auspice HA", path: "Influenza-A-Virus/H3N2/HA" },
        { name: "Missing NA", path: "Influenza-A-Virus/H3N2/NA" },
      ],
    },
  ],
};

beforeEach(() => {
  useViralFamily.mockReturnValue({ data: family, isPending: false, isError: false });
  useNextstrainInventory.mockReturnValue({
    data: new Set(["Influenza-A-Virus/H3N2/HA"]),
    isPending: false,
    isError: false,
  });
  useViralTreeXml.mockReturnValue({
    data: "<phyloxml />",
    isPending: false,
    isError: false,
  });
});

describe("ViralPhylogenyPanel", () => {
  it("enables exact available Auspice cards and keeps missing cards disabled", () => {
    render(<ViralPhylogenyPanel taxonId={2955291} taxonName="Influenza A virus" />);

    const availableCard = screen.getByText("Auspice HA").closest("[data-slot=card]");
    const missingCard = screen.getByText("Missing NA").closest("[data-slot=card]");
    expect(availableCard).toHaveAttribute("role", "button");
    expect(missingCard).toHaveAttribute("role", "button");
    expect(missingCard).toHaveAttribute("aria-disabled", "true");
    expect(missingCard).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("Auspice dataset unavailable")).toBeInTheDocument();
  });

  it("renders an isolated Auspice iframe without fetching XML", () => {
    render(<ViralPhylogenyPanel taxonId={2955291} taxonName="Influenza A virus" />);

    fireEvent.click(screen.getByText("Auspice HA"));

    expect(useViralTreeXml).toHaveBeenLastCalledWith(null);
    expect(screen.getByTitle("Auspice phylogeny viewer for Auspice HA")).toHaveAttribute(
      "src",
      "/nextstrain-viewer/Influenza-A-Virus/H3N2/HA",
    );
    expect(screen.getByTitle("Auspice phylogeny viewer for Auspice HA")).toHaveClass(
      "min-h-[600px]",
    );
  });

  it("returns focus to the selected card and preserves the Archaeopteryx path", async () => {
    render(<ViralPhylogenyPanel taxonId={2955291} taxonName="Influenza A virus" />);

    fireEvent.click(screen.getByText("Auspice HA"));
    fireEvent.click(screen.getByRole("button", { name: /back to trees/i }));
    expect(screen.queryByTitle(/Auspice phylogeny viewer/)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Auspice HA").closest("[data-slot=card]")).toHaveFocus();
    });

    fireEvent.click(screen.getByText("XML HA"));
    expect(useViralTreeXml).toHaveBeenLastCalledWith("https://www.bv-brc.org/tree.xml");
    expect(screen.getByText("Archaeopteryx: XML HA")).toBeInTheDocument();
  });

  it("shows a defensive error for an invalid inventoried identifier", () => {
    useViralFamily.mockReturnValue({
      data: {
        groups: [{
          key: "invalid",
          title: "Invalid",
          nextstrain: [{ name: "Invalid dataset", path: "//example.org/tree" }],
        }],
      },
      isPending: false,
      isError: false,
    });
    useNextstrainInventory.mockReturnValue({
      data: new Set(["//example.org/tree"]),
      isPending: false,
      isError: false,
    });

    render(<ViralPhylogenyPanel taxonId={2955291} taxonName="Influenza A virus" />);

    expect(screen.getByText("Invalid dataset").closest("[data-slot=card]")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.queryByTitle(/Auspice phylogeny viewer/)).not.toBeInTheDocument();
  });

  it("renders family loading, error, and empty states", () => {
    useViralFamily.mockReturnValue({ isPending: true, isError: false });
    const { rerender } = render(
      <ViralPhylogenyPanel taxonId={2955291} taxonName="Influenza A virus" />,
    );
    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();

    useViralFamily.mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error("family failed"),
    });
    rerender(<ViralPhylogenyPanel taxonId={2955291} taxonName="Influenza A virus" />);
    expect(screen.getByText("Viral trees unavailable")).toBeInTheDocument();

    useViralFamily.mockReturnValue({
      isPending: false,
      isError: false,
      data: { groups: [] },
    });
    rerender(<ViralPhylogenyPanel taxonId={2955291} taxonName="Influenza A virus" />);
    expect(screen.getByText("No published trees")).toBeInTheDocument();
  });

  it("fails closed while inventory is unavailable", () => {
    useNextstrainInventory.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    });

    render(<ViralPhylogenyPanel taxonId={2955291} taxonName="Influenza A virus" />);

    expect(screen.getByText("Auspice HA").closest("[data-slot=card]")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("XML HA").closest("[data-slot=card]")).toHaveAttribute(
      "role",
      "button",
    );
  });
});
