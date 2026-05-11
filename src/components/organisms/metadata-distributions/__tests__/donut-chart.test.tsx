import { fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { DonutChart } from "../donut-chart";

beforeAll(() => {
  const svgElementPrototype = SVGElement.prototype as SVGElement & {
    getComputedTextLength?: () => number;
  };

  if (!svgElementPrototype.getComputedTextLength) {
    Object.defineProperty(svgElementPrototype, "getComputedTextLength", {
      configurable: true,
      value() {
        return (this.textContent ?? "").length * 8;
      },
    });
  }
});

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

function connectorEndDirection(path: SVGPathElement) {
  const points = [
    ...(path.getAttribute("d") ?? "").matchAll(
      /[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
    ),
  ].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
  }));

  const start = points[0];
  const end = points.at(-1);

  if (!start || !end) {
    throw new Error("Connector path did not include start and end points");
  }

  return end.x >= start.x ? "right" : "left";
}

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
    expect(screen.getByLabelText("Others: 11")).toBeInTheDocument(); // E (6) + F (5)
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
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  it("balances five annotation labels across both sides", () => {
    render(
      <DonutChart
        title="Host"
        data={[
          { label: "Others", value: 229915 },
          { label: "Lab", value: 203257 },
          { label: "Avian", value: 556736 },
          { label: "Nonhuman Mammal", value: 702930 },
          { label: "Human", value: 12245319 },
        ]}
      />,
    );

    const connectorDirections = [
      ...document.querySelectorAll<SVGPathElement>(
        ".visx-annotation-connector",
      ),
    ].map(connectorEndDirection);

    expect(connectorDirections).toHaveLength(5);
    expect(
      connectorDirections.filter((direction) => direction === "left"),
    ).toHaveLength(2);
    expect(
      connectorDirections.filter((direction) => direction === "right"),
    ).toHaveLength(3);
  });

  it("shows tooltip content on hover", () => {
    render(
      <DonutChart title="Host" data={[{ label: "Homo sapiens", value: 12 }]} />,
    );

    fireEvent.mouseMove(screen.getByLabelText("Homo sapiens: 12"), {
      clientX: 10,
      clientY: 10,
    });

    expect(screen.getByRole("status")).toHaveTextContent("Homo sapiens: 12");
  });

  it("shows tooltip content on focus and positions it near the arc", () => {
    render(
      <DonutChart title="Host" data={[{ label: "Homo sapiens", value: 12 }]} />,
    );

    const arc = screen.getByLabelText("Homo sapiens: 12");
    vi.spyOn(arc, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 200,
      right: 150,
      bottom: 250,
      width: 50,
      height: 50,
      x: 100,
      y: 200,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.focus(arc);

    const tooltip = screen.getByRole("status");
    expect(tooltip).toHaveTextContent("Homo sapiens: 12");
    expect(tooltip).toHaveStyle({ left: "125px", top: "225px" });
  });

  it("renders blank labels as Unspecified", () => {
    render(<DonutChart title="Host" data={[{ label: "", value: 76420 }]} />);

    expect(screen.getByText("Unspecified")).toBeInTheDocument();
    expect(screen.getByLabelText("Unspecified: 76,420")).toBeInTheDocument();
  });

  it("server-renders annotation titles as text", () => {
    const markup = renderToString(
      <DonutChart
        title="Genus"
        data={[{ label: "Salmonella", value: 48185 }]}
      />,
    );

    expect(markup).toContain("<title>Salmonella: 48,185</title>");
  });

  it("hydrates long wrapped labels without changing server text nodes", async () => {
    const data = [{ label: "Human, Homo sapiens", value: 12 }];
    const originalDocument = globalThis.document;

    vi.stubGlobal("document", undefined);
    let markup: string;
    try {
      markup = renderToString(<DonutChart title="Host" data={data} />);
    } finally {
      vi.stubGlobal("document", originalDocument);
    }

    const container = originalDocument.createElement("div");
    container.innerHTML = markup;

    vi.mocked(console.error).mockClear();
    const root = hydrateRoot(
      container,
      <DonutChart title="Host" data={data} />,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    const hydrationErrors = vi
      .mocked(console.error)
      .mock.calls.flat()
      .filter((message) => String(message).includes("Hydration failed"));

    expect(hydrationErrors).toHaveLength(0);
    root.unmount();
  });

  it("renders an empty state", () => {
    render(<DonutChart title="Country" data={[]} />);

    expect(
      screen.getByText("No distribution data was returned."),
    ).toBeInTheDocument();
  });
});
