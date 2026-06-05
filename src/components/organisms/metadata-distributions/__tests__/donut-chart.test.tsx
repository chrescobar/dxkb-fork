import { fireEvent, render, screen, within } from "@testing-library/react";

import { DonutChart } from "../donut-chart";

// Constants mirrored from the component for hit-test coordinate calculations
const chartSize = 160;
const chartCenter = chartSize / 2;
const outerRadius = 66;

describe("DonutChart", () => {
  it("renders top four slices and an Others bucket", () => {
    render(
      <DonutChart
        title="Genus"
        data={[
          { label: "A", value: 10 },
          { label: "B", value: 9 },
          { label: "C", value: 8 },
          { label: "D", value: 7 },
          { label: "E", value: 6 },
          { label: "F", value: 5 },
        ]}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Genus distribution" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Others")).toBeInTheDocument();
    // Both the SVG path and the legend chip carry the same aria-label
    expect(
      within(screen.getByRole("img")).getByLabelText("Others: 11"),
    ).toBeInTheDocument();
  });

  it("uses a collision-free label for the aggregate bucket", () => {
    render(
      <DonutChart
        title="Genus"
        data={[
          { label: "Others", value: 10 },
          { label: "A", value: 9 },
          { label: "B", value: 8 },
          { label: "C", value: 7 },
          { label: "D", value: 6 },
          { label: "E", value: 5 },
        ]}
      />,
    );

    expect(screen.getByText("Others")).toBeInTheDocument();
    expect(screen.getByText("Other values")).toBeInTheDocument();
  });

  it("shows tooltip content on hover over the ring", () => {
    render(
      <DonutChart title="Host" data={[{ label: "Homo sapiens", value: 12 }]} />,
    );

    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();
    vi.spyOn(svg as SVGSVGElement, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: chartSize,
      height: chartSize,
      right: chartSize,
      bottom: chartSize,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // clientX=80,clientY=25 → svgX=0, svgY=-55 → dist=55 (inside ring: 38<55<66)
    fireEvent.mouseMove(screen.getByTestId("chart-overlay"), {
      clientX: chartCenter,
      clientY: chartCenter - outerRadius + 17,
    });

    expect(screen.getByRole("status")).toHaveTextContent("Homo sapiens");
    expect(screen.getByRole("status")).toHaveTextContent("12");
  });

  it("hides tooltip when hovering the inner hole", () => {
    render(
      <DonutChart title="Host" data={[{ label: "Homo sapiens", value: 12 }]} />,
    );

    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();
    vi.spyOn(svg as SVGSVGElement, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: chartSize,
      height: chartSize,
      right: chartSize,
      bottom: chartSize,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const overlay = screen.getByTestId("chart-overlay");

    // First hover the ring to show tooltip
    fireEvent.mouseMove(overlay, {
      clientX: chartCenter,
      clientY: chartCenter - outerRadius + 17,
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Then move into the inner hole — clientX=80, clientY=80 → dist=0 < innerRadius
    fireEvent.mouseMove(overlay, {
      clientX: chartCenter,
      clientY: chartCenter,
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders blank labels as Unspecified", () => {
    render(<DonutChart title="Host" data={[{ label: "", value: 76420 }]} />);

    expect(screen.getByText("Unspecified")).toBeInTheDocument();
    expect(
      within(screen.getByRole("img")).getByLabelText("Unspecified: 76,420"),
    ).toBeInTheDocument();
  });

  it("renders title attributes on arc paths for screen readers", () => {
    render(
      <DonutChart
        title="Genus"
        data={[{ label: "Salmonella", value: 48185 }]}
      />,
    );

    expect(
      document.querySelector("path > title"),
    ).toHaveTextContent("Salmonella: 48,185");
  });

  it("renders an empty state", () => {
    render(<DonutChart title="Country" data={[]} />);

    expect(
      screen.getByText("No distribution data was returned."),
    ).toBeInTheDocument();
  });
});
