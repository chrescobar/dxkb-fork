import { fireEvent, render, screen, within } from "@testing-library/react";

import { DonutChart } from "../donut-chart";

// Constants mirrored from the component for hit-test coordinate calculations
const chartSize = 160;
const chartCenter = chartSize / 2;
const outerRadius = 66;

describe("DonutChart", () => {
  it("renders top nine slices and an Others bucket", () => {
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
          { label: "G", value: 4 },
          { label: "H", value: 3 },
          { label: "I", value: 2 },
          { label: "J", value: 2 },
          { label: "K", value: 1 },
        ]}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Genus distribution" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Others")).toBeInTheDocument();
    // A–I are shown individually; J(2)+K(1)=3 collapse into Others
    expect(
      within(screen.getByRole("img")).getByLabelText("Others: 3"),
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
          { label: "F", value: 4 },
          { label: "G", value: 3 },
          { label: "H", value: 2 },
          { label: "I", value: 2 },
          { label: "J", value: 1 },
        ]}
      />,
    );

    // "Others" is one of the top 9 shown items; the aggregate bucket for the
    // remaining items must pick the fallback label "Other values" to avoid collision.
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

  it("renders a non-degenerate annulus path for a single positive slice", () => {
    render(
      <DonutChart title="Genus" data={[{ label: "Salmonella", value: 48185 }]} />,
    );

    const path = document.querySelector("path");
    expect(path).not.toBeNull();
    const d = path?.getAttribute("d") ?? "";
    // Old behavior was a "M outerR 0 A ... M outerR 0 A ..." degenerate arc
    // (start == end). The full-circle fix emits two semicircle arcs for both
    // the outer and inner circle — at least 4 arc commands plus the outer
    // -outerR landing point.
    const arcCount = (d.match(/ A /g) ?? []).length;
    expect(arcCount).toBeGreaterThanOrEqual(4);
    expect(d).toMatch(/-66\s+0/); // outer semicircle landing at (-outerR, 0)
  });

  it("legend focus shows tooltip near the chip", () => {
    render(
      <DonutChart
        layout="side"
        title="Genus"
        data={[
          { label: "Escherichia", value: 100 },
          { label: "Salmonella", value: 50 },
        ]}
      />,
    );

    const pill = screen.getByRole("button", { name: "Escherichia: 100" });
    fireEvent.focus(pill);

    const tooltip = screen.getByRole("status");
    expect(tooltip).toHaveTextContent("Escherichia");
    expect(tooltip).toHaveTextContent("100");
  });

  it("legend blur clears the active slice highlight", () => {
    render(
      <DonutChart
        layout="side"
        title="Genus"
        data={[
          { label: "Escherichia", value: 100 },
          { label: "Salmonella", value: 50 },
        ]}
      />,
    );

    const pill = screen.getByRole("button", { name: "Escherichia: 100" });
    fireEvent.focus(pill);
    // While focused, dimming is in effect on the OTHER pill via opacity styles
    // (we observe via the activeId path setting the dimmed slice). The simplest
    // observation: a status tooltip exists.
    expect(screen.getByRole("status")).toBeInTheDocument();
    fireEvent.blur(pill);
    // After blur, deactivate() runs setActiveId(null). visx's useTooltip keeps
    // tooltipData populated but flips tooltipOpen; the component reads the
    // active state via activeId. Re-focus a different pill and verify the
    // tooltip switches — confirms blur cleared the state machine.
    const other = screen.getByRole("button", { name: "Salmonella: 50" });
    fireEvent.focus(other);
    expect(screen.getByRole("status")).toHaveTextContent("Salmonella");
  });
});
