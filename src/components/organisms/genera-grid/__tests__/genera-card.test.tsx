import { render, screen } from "@testing-library/react";

import { GeneraCard } from "../genera-card";

describe("GeneraCard", () => {
  it("renders a deterministic avatar, genome count, and internal genome link", () => {
    const href = "/genome?rql=eq(genus,Escherichia)";
    render(<GeneraCard name="Escherichia" count={128450} href={href} />);

    expect(screen.getByText("Escherichia")).toBeInTheDocument();
    expect(screen.getByText("128,450 genomes")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Escherichia genomes" }),
    ).toHaveAttribute("href", "/genome?rql=eq(genus,Escherichia)");
  });

  it("renders blank genus labels as Unspecified with genome route", () => {
    const href = "/genome?rql=eq(genus,)";
    render(<GeneraCard name="" count={18550} href={href} />);

    expect(screen.getByText("Unspecified")).toBeInTheDocument();
    expect(screen.getByText("18,550 genomes")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Unspecified genomes" }),
    ).toHaveAttribute("href", "/genome?rql=eq(genus,)");
  });

  it("renders without count as a featured card (no genome count line)", () => {
    const href = "/taxonomy/561";
    render(<GeneraCard name="Escherichia" href={href} viewLabel="overview" />);

    expect(screen.getByText("Escherichia")).toBeInTheDocument();
    expect(screen.queryByText(/genomes/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Escherichia overview" }),
    ).toHaveAttribute("href", "/taxonomy/561");
  });

  it("defaults the aria-label suffix to genomes when viewLabel is omitted", () => {
    render(<GeneraCard name="Escherichia" href="/genome?rql=eq(genus,Escherichia)" />);

    expect(
      screen.getByRole("link", { name: "View Escherichia genomes" }),
    ).toHaveAttribute("href", "/genome?rql=eq(genus,Escherichia)");
  });
});
