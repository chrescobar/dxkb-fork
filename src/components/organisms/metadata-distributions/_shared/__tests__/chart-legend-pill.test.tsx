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
    expect(screen.getByRole("button").getAttribute("aria-label")).toBeNull();
  });

  it("uses visible children as the accessible name in row variant (WCAG 2.5.3)", () => {
    render(
      <ChartLegendPill
        label="COVID-19 UK"
        color="#abc"
        active={false}
        variant="row"
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
      >
        <span>COVID-19 UK</span>
        <span>410,373</span>
      </ChartLegendPill>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAccessibleName(/COVID-19 UK.*410,373/);
  });

  it("does not let ariaLabel shadow visible children (WCAG 2.5.3 regression)", () => {
    render(
      <ChartLegendPill
        label="COVID-19 UK"
        color="#abc"
        active={false}
        variant="row"
        ariaLabel="COVID-19 UK: 410,373"
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
      >
        <span>COVID-19 UK</span>
        <span>410,373</span>
      </ChartLegendPill>,
    );

    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBeNull();
    expect(button).toHaveTextContent("COVID-19 UK");
    expect(button).toHaveTextContent("410,373");
  });

  it("renders the swatch with a contrast-meeting border (WCAG 1.4.11)", () => {
    render(
      <ChartLegendPill
        label="Alpha"
        color="oklch(0.85 0.18 90)"
        active={false}
        onActivate={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );

    const swatch = screen
      .getByRole("button")
      .querySelector('span[aria-hidden="true"]');

    expect(swatch).not.toBeNull();
    expect(swatch?.getAttribute("style")).toMatch(/border:\s*1px solid/);
  });
});
