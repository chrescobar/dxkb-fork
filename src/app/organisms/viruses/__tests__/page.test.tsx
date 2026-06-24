import { render, screen } from "@testing-library/react";

import VirusesPage from "../page";

describe("VirusesPage", () => {
  it("renders the selected stub view through the shared shell", async () => {
    const node = await VirusesPage({
      searchParams: Promise.resolve({ tab: "taxonomy" }),
    });

    render(node);

    expect(
      screen.getByRole("heading", { level: 1, name: "Viruses" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });

  it("renders legacy placeholder tabs through URL state", async () => {
    const node = await VirusesPage({
      searchParams: Promise.resolve({ tab: "features" }),
    });

    render(node);

    // Active label appears 3×: desktop nav button, mobile pill, placeholder heading.
    expect(screen.getAllByText("Features")).toHaveLength(3);
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });

  it("falls back to legacy ?view= param when ?tab= is absent", async () => {
    const node = await VirusesPage({
      searchParams: Promise.resolve({ view: "features" }),
    });

    render(node);

    // Active label appears 3×: desktop nav button, mobile pill, placeholder heading.
    expect(screen.getAllByText("Features")).toHaveLength(3);
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });

  it("prefers ?tab= over ?view= when both are present", async () => {
    const node = await VirusesPage({
      searchParams: Promise.resolve({ tab: "taxonomy", view: "features" }),
    });

    render(node);

    expect(screen.getByText(/This view is coming soon/)).toBeInTheDocument();
    // "Features" appears once (desktop nav button only) — taxonomy won, so the
    // mobile pill + placeholder heading show "Taxonomy", not "Features".
    expect(screen.queryAllByText("Features")).toHaveLength(1);
  });
});
