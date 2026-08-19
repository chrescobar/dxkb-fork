import type { ComponentProps, ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import { GenomeShell } from "../genome-shell";

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
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

describe("GenomeShell details panel sizing", () => {
  it("opens the details panel at 15% and allows shrinking it to 10%", () => {
    render(
      <GenomeShell
        hasSidePanel
        actionBar={<span>Actions</span>}
        sidePanel={<span>Details</span>}
      >
        <span>Table</span>
      </GenomeShell>,
    );

    const detailsPanel = screen.getByTestId("details-panel");
    expect(detailsPanel).toHaveAttribute("data-default-size", "15%");
    expect(detailsPanel).toHaveAttribute("data-min-size", "10%");
    expect(detailsPanel).toHaveAttribute("data-max-size", "60%");
  });
});
