import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { ChartLegendPill } from "../chart-legend-pill";

describe("ChartLegendPill", () => {
  it("renders the label and exposes it via aria-label by default", () => {
    render(
      <ChartLegendPill
        label="Sv1"
        color="red"
        active={false}
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Sv1" })).toBeInTheDocument();
  });

  it("uses the custom ariaLabel when provided", () => {
    render(
      <ChartLegendPill
        label="Sv1"
        color="red"
        active={false}
        ariaLabel="Sv1: 42"
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Sv1: 42" })).toBeInTheDocument();
  });

  it("marks active state with data-active", () => {
    render(
      <ChartLegendPill
        label="Sv1"
        color="red"
        active
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("data-active", "true");
  });

  it("calls onActivate on hover", () => {
    const onActivate = vi.fn();
    render(
      <ChartLegendPill
        label="Sv1"
        color="red"
        active={false}
        onActivate={onActivate}
        onDeactivate={vi.fn()}
      />,
    );
    fireEvent.mouseEnter(screen.getByRole("button"));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("calls onDeactivate on mouseleave and blur", () => {
    const onDeactivate = vi.fn();
    render(
      <ChartLegendPill
        label="Sv1"
        color="red"
        active={false}
        onActivate={vi.fn()}
        onDeactivate={onDeactivate}
      />,
    );
    fireEvent.mouseLeave(screen.getByRole("button"));
    fireEvent.blur(screen.getByRole("button"));
    expect(onDeactivate).toHaveBeenCalledTimes(2);
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <ChartLegendPill
        label="Sv1"
        color="red"
        active={false}
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("forwards aria-pressed when provided (locked state semantics)", () => {
    render(
      <ChartLegendPill
        label="Sv1"
        color="red"
        active
        ariaPressed
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("renders children instead of the label when provided", () => {
    render(
      <ChartLegendPill
        label="Sv1"
        color="red"
        active={false}
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
      >
        <span>Custom content</span>
      </ChartLegendPill>,
    );
    expect(screen.getByText("Custom content")).toBeInTheDocument();
  });
});
