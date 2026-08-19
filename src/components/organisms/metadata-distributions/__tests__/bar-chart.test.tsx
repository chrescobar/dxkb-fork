import { fireEvent, render, screen } from "@testing-library/react";

import { BarChart } from "../bar-chart";

describe("BarChart", () => {
  it("renders a bar for each valid year, sorted chronologically", () => {
    render(
      <BarChart
        title="Collection Year"
        data={[
          { label: "2020", value: 100 },
          { label: "2018", value: 50 },
          { label: "2022", value: 200 },
        ]}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Collection Year distribution" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("2018: 50")).toBeInTheDocument();
    expect(screen.getByLabelText("2020: 100")).toBeInTheDocument();
    expect(screen.getByLabelText("2022: 200")).toBeInTheDocument();
  });

  it("filters out non-integer labels", () => {
    render(
      <BarChart
        title="Collection Year"
        data={[
          { label: "2020", value: 100 },
          { label: "unknown", value: 50 },
          { label: "", value: 10 },
        ]}
      />,
    );

    expect(screen.getByLabelText("2020: 100")).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/unknown/),
    ).not.toBeInTheDocument();
  });

  it("shows tooltip on hover", () => {
    render(
      <BarChart
        title="Collection Year"
        data={[{ label: "2021", value: 42 }]}
      />,
    );

    fireEvent.mouseMove(screen.getByTestId("chart-overlay"), {
      clientX: 10,
      clientY: 10,
    });

    expect(screen.getByRole("status")).toHaveTextContent("2021: 42");
  });

  it("renders empty state when no valid data", () => {
    render(
      <BarChart
        title="Collection Year"
        data={[{ label: "unknown", value: 5 }]}
      />,
    );

    expect(
      screen.getByText("No distribution data was returned."),
    ).toBeInTheDocument();
  });
});
