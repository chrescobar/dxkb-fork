import { render, screen } from "@testing-library/react";

import type { AmrDistributionData } from "@/lib/services/organisms/types";

import { AmrBarStackChart } from "../amr-bar-stack-chart";

const sampleData: AmrDistributionData = {
  antibiotics: [
    {
      antibiotic: "ciprofloxacin",
      Resistant: 5815,
      Susceptible: 12336,
      Intermediate: 0,
      total: 18151,
    },
    {
      antibiotic: "azithromycin",
      Resistant: 55,
      Susceptible: 588,
      Intermediate: 0,
      total: 643,
    },
    {
      antibiotic: "florfenicol",
      Resistant: 0,
      Susceptible: 569,
      Intermediate: 0,
      total: 569,
    },
  ],
};

describe("AmrBarStackChart", () => {
  it("renders the empty state when no antibiotics", () => {
    render(
      <AmrBarStackChart
        title="Antimicrobial Resistance Profile"
        data={{ antibiotics: [] }}
      />,
    );

    expect(
      screen.getByText("No distribution data was returned."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders the title and an SVG with the correct aria-label", () => {
    render(
      <AmrBarStackChart
        title="Antimicrobial Resistance Profile"
        data={sampleData}
      />,
    );

    expect(
      screen.getByText("Antimicrobial Resistance Profile"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Antimicrobial Resistance Profile distribution",
      }),
    ).toBeInTheDocument();
  });

  it("renders one column label per antibiotic", () => {
    render(
      <AmrBarStackChart
        title="Antimicrobial Resistance Profile"
        data={sampleData}
      />,
    );

    expect(screen.getByText("ciprofloxacin")).toBeInTheDocument();
    expect(screen.getByText("azithromycin")).toBeInTheDocument();
    expect(screen.getByText("florfenicol")).toBeInTheDocument();
  });

  it("renders one legend pill per phenotype", () => {
    render(
      <AmrBarStackChart
        title="Antimicrobial Resistance Profile"
        data={sampleData}
      />,
    );

    expect(screen.getByRole("button", { name: "Resistant" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Susceptible" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Intermediate" })).toBeInTheDocument();
  });
});
