import { render, screen } from "@testing-library/react";
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
      />,
    );

    const exportButton = screen.getByRole("button", { name: "Export" });
    expect(exportButton).toBeEnabled();

    await user.click(exportButton);
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
