import { fireEvent, render, screen, within } from "@testing-library/react";

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

  it("renders a tooltip when the overlay receives a mousemove", () => {
    render(
      <AmrBarStackChart
        title="Antimicrobial Resistance Profile"
        data={sampleData}
      />,
    );

    const overlay = screen.getByTestId("amr-chart-overlay");
    fireEvent.mouseMove(overlay, { clientX: 50, clientY: 50 });
    expect(screen.getByRole("status")).toBeInTheDocument();

    fireEvent.mouseLeave(overlay);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders Scale and Order toolbar controls", () => {
    render(
      <AmrBarStackChart
        title="Antimicrobial Resistance Profile"
        data={sampleData}
      />,
    );

    expect(screen.getByRole("radio", { name: "Counts" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Percent" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Count" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Name" })).not.toBeChecked();
  });

  it("switches y-axis tick labels to percent (0/25/50/75/100) when Percent is selected", () => {
    render(
      <AmrBarStackChart
        title="Antimicrobial Resistance Profile"
        data={sampleData}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Percent" }));

    const svg = screen.getByRole("img");
    const tickTexts = within(svg).getAllByText(/^(0|25|50|75|100)$/);
    const tickValues = tickTexts.map((el) => el.textContent);
    expect(tickValues).toEqual(
      expect.arrayContaining(["0", "25", "50", "75", "100"]),
    );
  });

  it("sorts antibiotic labels alphabetically when Name is selected", () => {
    render(
      <AmrBarStackChart
        title="Antimicrobial Resistance Profile"
        data={sampleData}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Name" }));

    const svg = screen.getByRole("img");
    const labels = within(svg)
      .getAllByText(/^(azithromycin|ciprofloxacin|florfenicol)$/)
      .map((el) => el.textContent);
    expect(labels).toEqual(["azithromycin", "ciprofloxacin", "florfenicol"]);
  });

  it("Percent mode normalises each bar so segments sum to 100", () => {
    render(
      <AmrBarStackChart
        title="Antimicrobial Resistance Profile"
        data={sampleData}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Percent" }));

    // ciprofloxacin: Resistant=5815, Susceptible=12336, total=18151
    //   → R = 5815/18151 ≈ 32.0%, S = 12336/18151 ≈ 68.0%
    // Each rect is tagged with aria-label `${phenotype}: ${value}%` in percent mode.
    const labels = screen
      .getAllByLabelText(/^(Resistant|Susceptible|Intermediate): /, {
        selector: "rect",
      })
      .map((el) => el.getAttribute("aria-label"));
    expect(labels).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^Resistant: 32(\.\d+)?%$/),
        expect.stringMatching(/^Susceptible: 68(\.\d+)?%$/),
      ]),
    );
  });
});
