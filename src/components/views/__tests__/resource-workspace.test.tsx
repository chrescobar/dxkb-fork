import type { ComponentProps, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ResourceWorkspace } from "../resource-workspace";

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: ReactNode }) => (
    <div data-testid="panel-group">{children}</div>
  ),
  ResizableHandle: () => <div data-testid="resize-handle" />,
  ResizablePanel: ({
    children,
    defaultSize,
    minSize,
    maxSize,
  }: {
    children: ReactNode;
    defaultSize?: number | string;
    minSize?: number | string;
    maxSize?: number | string;
  }) => (
    <div
      data-testid={defaultSize ? "details-panel" : "main-panel"}
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
}));

function mockViewport(narrow: boolean) {
  const listeners = new Set<() => void>();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches: narrow,
      media: "(max-width: 47.999rem)",
      onchange: null,
      addEventListener: (_event: string, listener: () => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_event: string, listener: () => void) => {
        listeners.delete(listener);
      },
      dispatchEvent: () => true,
    })),
  });
}

function renderWorkspace() {
  return render(
    <ResourceWorkspace
      hasSidePanel
      actionBar={<span>Actions</span>}
      sidePanel={<span>Details</span>}
    >
      <span>Table</span>
    </ResourceWorkspace>,
  );
}

describe("ResourceWorkspace", () => {
  it("opens the desktop details panel at 15% and allows shrinking it to 10%", () => {
    mockViewport(false);
    renderWorkspace();

    expect(screen.getByText("Table").closest("[data-layout]")).toHaveAttribute(
      "data-layout",
      "resizable",
    );
    const detailsPanel = screen.getByTestId("details-panel");
    expect(detailsPanel).toHaveAttribute("data-default-size", "15%");
    expect(detailsPanel).toHaveAttribute("data-min-size", "10%");
    expect(detailsPanel).toHaveAttribute("data-max-size", "60%");
  });

  it("stacks details below the content on narrow screens without resizable panels", () => {
    mockViewport(true);
    renderWorkspace();

    expect(screen.queryByTestId("panel-group")).not.toBeInTheDocument();
    const workspace = screen.getByText("Table").closest("[data-layout]");
    expect(workspace).toHaveAttribute("data-layout", "stacked");
    expect(workspace).toHaveTextContent("Details");

    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByText("Details")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("removes the details region when the side panel is no longer available", () => {
    mockViewport(false);
    const { rerender } = renderWorkspace();

    rerender(
      <ResourceWorkspace
        hasSidePanel={false}
        actionBar={<span>Actions</span>}
        sidePanel={<span>Details</span>}
      >
        <span>Table</span>
      </ResourceWorkspace>,
    );

    expect(screen.queryByTestId("details-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("resize-handle")).not.toBeInTheDocument();
  });
});
