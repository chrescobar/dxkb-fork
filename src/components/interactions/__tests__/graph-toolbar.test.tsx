import { fireEvent, render, screen } from "@testing-library/react";

import { GraphToolbar } from "../graph-toolbar";

describe("GraphToolbar", () => {
  it("renders the keyword search box and reports changes via onFilterChange", () => {
    const onFilterChange = vi.fn();

    render(<GraphToolbar filterValue="" onFilterChange={onFilterChange} />);

    const keywordInput = screen.getByPlaceholderText("Search interaction results...");
    fireEvent.change(keywordInput, { target: { value: "groEL" } });

    expect(onFilterChange).toHaveBeenLastCalledWith("groEL");
  });

  it("reflects the current filterValue back into the keyword input", () => {
    render(<GraphToolbar filterValue="groEL" onFilterChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("Search interaction results...")).toHaveValue("groEL");
  });
});
