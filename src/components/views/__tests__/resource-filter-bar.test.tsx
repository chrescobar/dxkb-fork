import { act, fireEvent, render, screen } from "@testing-library/react";
import { ResourceFilterBar } from "../resource-filter-bar";

const facets = {
  genome_status: [
    { value: "Complete", count: 10 },
    { value: "WGS", count: 20 },
  ],
};
const definitions = [
  { field: "genome_status", label: "Genome Status", initiallyVisible: true },
];

describe("ResourceFilterBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces keyword commits", () => {
    const onChange = vi.fn();
    render(
      <ResourceFilterBar
        filters={{}}
        facets={facets}
        definitions={definitions}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "influenza" },
    });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onChange).toHaveBeenCalledWith({
      keyword: "influenza",
      filters: {},
    });
  });

  it("adds multiple facet values and removes selected chips", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ResourceFilterBar
        filters={{ genome_status: ["Complete"] }}
        facets={facets}
        definitions={definitions}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show Filters" }));
    fireEvent.click(screen.getByRole("button", { name: "WGS (20)" }));
    expect(onChange).toHaveBeenCalledWith({
      keyword: undefined,
      filters: { genome_status: ["Complete", "WGS"] },
      clearRql: false,
    });

    rerender(
      <ResourceFilterBar
        filters={{ genome_status: ["Complete", "WGS"] }}
        facets={facets}
        definitions={definitions}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove genome_status: Complete filter",
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      keyword: undefined,
      filters: { genome_status: ["WGS"] },
    });
  });
});
