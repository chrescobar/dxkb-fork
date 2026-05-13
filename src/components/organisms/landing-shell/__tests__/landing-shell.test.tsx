import { act, render, screen } from "@testing-library/react";
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

describe("OrganismLandingShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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

  it("does not overwrite the stored collapsed navigation preference before loading it", () => {
    window.localStorage.setItem("dxkb.organismLanding.navCollapsed", "true");
    let animationFrameCallback: FrameRequestCallback | undefined;
    const requestAnimationFrame = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        animationFrameCallback = callback;
        return 1;
      });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(
      () => undefined,
    );

    render(<OrganismLandingShell config={config} views={views} />);

    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(
      window.localStorage.getItem("dxkb.organismLanding.navCollapsed"),
    ).toBe("true");

    act(() => {
      animationFrameCallback?.(0);
    });

    expect(screen.queryByText("Views")).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem("dxkb.organismLanding.navCollapsed"),
    ).toBe("true");
  });
});
