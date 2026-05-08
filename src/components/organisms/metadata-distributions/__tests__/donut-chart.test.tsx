import { fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { DonutChart } from "../donut-chart";

describe("DonutChart", () => {
  it("renders top five slices and an Others bucket", () => {
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
    expect(screen.getByText("5")).toBeInTheDocument();
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
    expect(screen.getByText("5")).toBeInTheDocument();
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
