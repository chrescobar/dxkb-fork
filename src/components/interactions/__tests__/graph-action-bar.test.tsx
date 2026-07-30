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

  it("shows the human-readable layout label on the trigger, not the raw value", () => {
    // Guards the items={layoutLabels} fix: without it, base-ui's Select.Value
    // renders the raw value ("forceatlas2") instead of the mapped label.
    render(
      <GraphActionBar layout="forceatlas2" onLayoutChange={vi.fn()} onExport={vi.fn()} exportReady />,
    );

    const trigger = screen.getByRole("combobox", { name: "Layout" });
    expect(trigger).toHaveTextContent("Force Atlas 2");
    expect(trigger).not.toHaveTextContent("forceatlas2");
  });

  it("reflects the controlled layout prop on the trigger", () => {
    render(
      <GraphActionBar layout="circular" onLayoutChange={vi.fn()} onExport={vi.fn()} exportReady />,
    );

    expect(screen.getByRole("combobox", { name: "Layout" })).toHaveTextContent("Circular");
  });
});
