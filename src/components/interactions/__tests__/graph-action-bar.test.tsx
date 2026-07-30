import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GraphActionBar } from "../graph-action-bar";
import { defaultLayout } from "@/lib/interactions/renderer-capabilities";

describe("GraphActionBar", () => {
  it("disables Export and does not invoke onExport while the canvas is not ready", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(
      <GraphActionBar
        layout={defaultLayout}
        onLayoutChange={vi.fn()}
        onExport={onExport}
        exportReady={false}
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
      <GraphActionBar
        layout={defaultLayout}
        onLayoutChange={vi.fn()}
        onExport={onExport}
        exportReady
      />,
    );

    const exportButton = screen.getByRole("button", { name: "Export" });
    expect(exportButton).toBeEnabled();

    await user.click(exportButton);
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
