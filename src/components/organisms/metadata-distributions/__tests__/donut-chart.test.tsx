import { fireEvent, render, screen } from "@testing-library/react";

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

  it("renders blank labels as Unspecified", () => {
    render(<DonutChart title="Host" data={[{ label: "", value: 76420 }]} />);

    expect(screen.getByText("Unspecified")).toBeInTheDocument();
    expect(screen.getByLabelText("Unspecified: 76,420")).toBeInTheDocument();
  });

  it("renders an empty state", () => {
    render(<DonutChart title="Country" data={[]} />);

    expect(
      screen.getByText("No distribution data was returned."),
    ).toBeInTheDocument();
  });
});
