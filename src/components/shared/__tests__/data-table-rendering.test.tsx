import { render, screen } from "@testing-library/react";
import { DataTable } from "../data-table";

const columns = [{ id: "strain_name", label: "Strain Name", visible: true }];

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
});

// Regression: "Showing 1-0 of N" appeared during page-data loading because end was
// computed from data.length (= 0) even when isLoading=true. The fix uses the expected
// page range (pageIndex * pageSize + pageSize) while loading, so the display is
// meaningful from the moment totalItems resolves.
describe("DataTable Showing display during loading", () => {
  it("shows expected page range when isLoading=true and data is empty", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={5000}
        resource="strain"
        isLoading={true}
        pageIndex={0}
        pageSize={200}
      />
    );
    expect(screen.getByText(/Showing 1-200 of 5000 results/)).toBeInTheDocument();
  });

  it("shows expected range for page 2 while loading (not '201-200')", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={5000}
        resource="strain"
        isLoading={true}
        pageIndex={1}
        pageSize={200}
      />
    );
    expect(screen.getByText(/Showing 201-400 of 5000 results/)).toBeInTheDocument();
  });

  it("shows 1-0 when data is genuinely empty and not loading", () => {
    render(
      <DataTable
        id="test"
        data={[]}
        columns={columns}
        totalItems={5000}
        resource="strain"
        isLoading={false}
        pageIndex={0}
        pageSize={200}
      />
    );
    expect(screen.getByText(/Showing 1-0 of 5000 results/)).toBeInTheDocument();
  });

  it("shows actual row count range when data is loaded", () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({ strain_name: `Strain ${String(i)}` }));
    render(
      <DataTable
        id="test"
        data={rows}
        columns={columns}
        totalItems={5000}
        resource="strain"
        isLoading={false}
        pageIndex={0}
        pageSize={200}
      />
    );
    expect(screen.getByText(/Showing 1-3 of 5000 results/)).toBeInTheDocument();
  });

  it("caps end at totalItems when last page is partial", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ strain_name: `Strain ${String(i)}` }));
    render(
      <DataTable
        id="test"
        data={rows}
        columns={columns}
        totalItems={210}
        resource="strain"
        isLoading={true}
        pageIndex={1}
        pageSize={200}
      />
    );
    // expected end: min(201 + 200 - 1, 210) = 210, not 400
    expect(screen.getByText(/Showing 201-210 of 210 results/)).toBeInTheDocument();
  });
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
