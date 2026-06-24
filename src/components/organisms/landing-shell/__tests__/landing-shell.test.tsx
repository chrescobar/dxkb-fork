import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import { OrganismLandingShell } from "../landing-shell";
import type {
  OrganismLandingConfig,
  OrganismLandingView,
} from "@/components/organisms/types";

function Overview() {
  return <div>Overview content</div>;
}

function Genomes() {
  return <div>Genomes content</div>;
}

const config: OrganismLandingConfig = {
  displayName: "Bacteria",
  taxonId: 2,
  accent: "bacteria",
  metadataFields: [],
  defaultView: "overview",
};

const views: OrganismLandingView[] = [
  { key: "overview", label: "Overview", icon: <span />, Component: Overview },
  { key: "genomes", label: "Genomes", icon: <span />, Component: Genomes },
];

describe("OrganismLandingShell — gate-aware tab resolution", () => {
  function view(key: string, enabled = true) {
    return {
      key,
      label: key,
      icon: null,
      enabled,
      disabledReason: enabled ? undefined : "nope",
      Component: () => <div data-testid={`view-${key}`}>{key} view</div>,
    } as never;
  }

  it("falls back to the default view when ?tab points at a disabled tab", () => {
    render(
      <OrganismLandingShell
        config={{ displayName: "T", taxonId: 1, accent: "all", metadataFields: [], defaultView: "overview" }}
        views={[view("overview"), view("amr-phenotypes", false)]}
        activeViewKey="amr-phenotypes"
      />,
    );
    // The disabled tab must NOT become the active rendered view.
    expect(screen.queryByTestId("view-amr-phenotypes")).not.toBeInTheDocument();
    expect(screen.getByTestId("view-overview")).toBeInTheDocument();
  });

  it("opens an enabled tab named by ?tab", () => {
    render(
      <OrganismLandingShell
        config={{ displayName: "T", taxonId: 1, accent: "all", metadataFields: [], defaultView: "overview" }}
        views={[view("overview"), view("genomes", true)]}
        activeViewKey="genomes"
      />,
    );
    expect(screen.getByTestId("view-genomes")).toBeInTheDocument();
  });
});

describe("OrganismLandingShell", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the configured default view", () => {
    render(<OrganismLandingShell config={config} views={views} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Bacteria" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Overview content")).toBeInTheDocument();
  });

  it("renders the view selected by URL state", () => {
    render(
      <OrganismLandingShell
        config={config}
        views={views}
        activeViewKey="genomes"
      />,
    );

    expect(screen.getByText("Genomes content")).toBeInTheDocument();
  });

  it("defaults to expanded navigation", () => {
    render(<OrganismLandingShell config={config} views={views} />);

    const desktopNav = screen.getByRole("navigation", { name: "Organism views" });
    expect(within(desktopNav).getByText("Views")).toBeInTheDocument();
  });
});
