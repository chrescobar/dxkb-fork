import { render, screen } from "@testing-library/react";

import { OrganismLandingShell } from "../landing-shell";
import type { OrganismLandingConfig, OrganismLandingView } from "@/components/organisms/types";

function Overview() {
  return <div>Overview content</div>;
}

function Genomes() {
  return <div>Genomes content</div>;
}

const config: OrganismLandingConfig = {
  displayName: "Bacteria",
  taxonId: 2,
  pubmedTerm: "Bacteria",
  accent: "bacteria",
  externalTools: [],
  metadataFields: [],
  defaultView: "overview",
};

const views: OrganismLandingView[] = [
  { key: "overview", label: "Overview", icon: <span />, Component: Overview },
  { key: "genomes", label: "Genomes", icon: <span />, Component: Genomes },
];

describe("OrganismLandingShell", () => {
  it("renders the configured default view", () => {
    render(<OrganismLandingShell config={config} views={views} />);

    expect(screen.getByRole("heading", { level: 1, name: "Bacteria" })).toBeInTheDocument();
    expect(screen.getByText("Overview content")).toBeInTheDocument();
  });

  it("renders the view selected by URL state", () => {
    render(<OrganismLandingShell config={config} views={views} activeViewKey="genomes" />);

    expect(screen.getByText("Genomes content")).toBeInTheDocument();
  });
});
