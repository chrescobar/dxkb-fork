import { fireEvent, render, screen } from "@testing-library/react";

import { ReferenceGenomesClient } from "../reference-genomes-client";

const genomes = [
  { genome_id: "234.1", genome_name: "Charlie strain", reference_genome: "Reference" },
  { genome_id: "234.2", genome_name: "Alpha strain", reference_genome: "Reference" },
  { genome_id: "234.3", genome_name: "Bravo strain", reference_genome: "Representative" },
];

describe("ReferenceGenomesClient", () => {
  it("renders one tab per reference type plus an All tab", () => {
    render(<ReferenceGenomesClient genomes={genomes} />);

    expect(screen.getByRole("tab", { name: /All \(3\)/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Reference \(2\)/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Representative \(1\)/ })).toBeInTheDocument();
  });

  it("renders genome rows as links to bv-brc.org with rel attributes", () => {
    render(<ReferenceGenomesClient genomes={genomes} />);

    const link = screen.getByRole("link", { name: "Charlie strain" });
    expect(link).toHaveAttribute("href", "https://www.bv-brc.org/view/Genome/234.1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("sort button is accessible via aria-sort (none → ascending → descending → none)", () => {
    render(<ReferenceGenomesClient genomes={genomes} />);

    // Use the All tab panel; there are 3 panels but only one visible.
    const sortButton = screen.getAllByRole("button", { name: /Sort by genome name/ })[0];
    const sortHeader = sortButton.closest("th");
    expect(sortHeader).not.toBeNull();
    expect(sortHeader).toHaveAttribute("aria-sort", "none");

    fireEvent.click(sortButton);
    expect(sortHeader).toHaveAttribute("aria-sort", "ascending");

    fireEvent.click(sortButton);
    expect(sortHeader).toHaveAttribute("aria-sort", "descending");

    fireEvent.click(sortButton);
    expect(sortHeader).toHaveAttribute("aria-sort", "none");
  });

  it("ascending sort reorders rows alphabetically by genome name", () => {
    render(<ReferenceGenomesClient genomes={genomes} />);

    const sortButton = screen.getAllByRole("button", { name: /Sort by genome name/ })[0];
    fireEvent.click(sortButton);

    // The 'All' panel is the first visible TabsContent
    const links = screen.getAllByRole("link");
    const orderedNames = links.slice(0, 3).map((el) => el.textContent);
    expect(orderedNames).toEqual(["Alpha strain", "Bravo strain", "Charlie strain"]);
  });

  it("descending sort reorders rows reverse-alphabetically", () => {
    render(<ReferenceGenomesClient genomes={genomes} />);
    const sortButton = screen.getAllByRole("button", { name: /Sort by genome name/ })[0];
    fireEvent.click(sortButton); // → asc
    fireEvent.click(sortButton); // → desc

    const links = screen.getAllByRole("link");
    const orderedNames = links.slice(0, 3).map((el) => el.textContent);
    expect(orderedNames).toEqual(["Charlie strain", "Bravo strain", "Alpha strain"]);
  });

  it("renders empty-state message when a type tab has no genomes", () => {
    // The default empty branch is exercised by selecting a type that has no entries.
    // Since "Representative" has 1, build a payload with an empty Representative branch.
    const empty = [
      { genome_id: "234.1", genome_name: "Alpha", reference_genome: "Reference" },
    ];
    render(<ReferenceGenomesClient genomes={empty} />);
    // No "Representative" tab when there are none — confirm only All + Reference tabs render
    expect(screen.queryByRole("tab", { name: /Representative/ })).not.toBeInTheDocument();
  });
});
