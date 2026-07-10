import { render, screen } from "@testing-library/react";
import { DataTable } from "../data-table";

const columns = [{ id: "strain_name", label: "Strain Name", visible: true }];

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("DataTable empty state", () => {
  it("shows 'No results' when data is empty and no errorMessage", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={0}
        resource="strain"
      />
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("shows errorMessage in table body instead of 'No results'", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={0}
        resource="strain"
        errorMessage="Error: Failed to fetch metadata (500 Internal Server Error)"
      />
    );
    expect(screen.getByText(/Failed to fetch metadata/)).toBeInTheDocument();
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
  });

  it("keeps Download and Columns buttons visible when errorMessage is set", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={0}
        resource="strain"
        errorMessage="Error: Failed to fetch metadata (500 Internal Server Error)"
      />
    );
    expect(screen.getByRole("button", { name: /Download \(CSV\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Columns/i })).toBeInTheDocument();
  });
});
