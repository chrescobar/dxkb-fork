import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GraphToolbar } from "../graph-toolbar";
import { defaultLayout } from "@/lib/interactions/renderer-capabilities";

describe("GraphToolbar", () => {
  it("disables Export and does not invoke onExport while the canvas is not ready", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(
      <GraphToolbar
        layout={defaultLayout}
        onLayoutChange={vi.fn()}
        onExport={onExport}
        exportReady={false}
        filterValue=""
        onFilterChange={vi.fn()}
      />,
    );

    const exportButton = screen.getByRole("button", { name: "Export" });
    expect(exportButton).toBeDisabled();

    await user.click(exportButton);
    expect(onExport).not.toHaveBeenCalled();
  });

  it("enables Export and invokes onExport once the canvas is ready", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(
      <GraphToolbar
        layout={defaultLayout}
        onLayoutChange={vi.fn()}
        onExport={onExport}
        exportReady
        filterValue=""
        onFilterChange={vi.fn()}
      />,
    );

    const exportButton = screen.getByRole("button", { name: "Export" });
    expect(exportButton).toBeEnabled();

    await user.click(exportButton);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("renders the keyword search box and reports changes via onFilterChange", () => {
    const onFilterChange = vi.fn();

    render(
      <GraphToolbar
        layout={defaultLayout}
        onLayoutChange={vi.fn()}
        onExport={vi.fn()}
        exportReady
        filterValue=""
        onFilterChange={onFilterChange}
      />,
    );

    const keywordInput = screen.getByPlaceholderText("Search keywords...");
    fireEvent.change(keywordInput, { target: { value: "groEL" } });

    expect(onFilterChange).toHaveBeenLastCalledWith("groEL");
  });

  it("reflects the current filterValue back into the keyword input", () => {
    render(
      <GraphToolbar
        layout={defaultLayout}
        onLayoutChange={vi.fn()}
        onExport={vi.fn()}
        exportReady
        filterValue="groEL"
        onFilterChange={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText("Search keywords...")).toHaveValue("groEL");
  });
});
