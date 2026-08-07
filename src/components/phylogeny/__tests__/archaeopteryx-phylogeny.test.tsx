import { render, screen } from "@testing-library/react";

import { loadArchaeopteryx } from "@/lib/phylogeny/archaeopteryx";

import { ArchaeopteryxPhylogeny } from "../archaeopteryx-phylogeny";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@/lib/phylogeny/archaeopteryx", () => ({
  loadArchaeopteryx: vi.fn(),
}));

class ResizeObserverStub {
  static instances: ResizeObserverStub[] = [];

  observe = vi.fn();
  disconnect = vi.fn();

  constructor() {
    ResizeObserverStub.instances.push(this);
  }
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

describe("ArchaeopteryxPhylogeny", () => {
  beforeEach(() => {
    ResizeObserverStub.instances = [];
  });

  it("tears down the renderer lifecycle when rendering fails", async () => {
    const renderer = {
      destroy: vi.fn(),
      getSelectedNodes: vi.fn(() => []),
      launch: vi.fn(() => {
        throw new Error("renderer failed to launch");
      }),
      parsePhyloXML: vi.fn(() => ({})),
    };
    vi.mocked(loadArchaeopteryx).mockResolvedValue({
      archaeopteryx: renderer,
      forester: { collectPropertyRefs: vi.fn(() => new Set<string>()) },
    });
    const removeEventListener = vi.spyOn(document, "removeEventListener");

    render(
      <ArchaeopteryxPhylogeny
        xml="<phyloxml />"
        title="Test tree"
        selectable
      />,
    );

    expect(
      await screen.findByText("renderer failed to launch"),
    ).toBeInTheDocument();
    expect(ResizeObserverStub.instances[0]?.disconnect).toHaveBeenCalledOnce();
    expect(removeEventListener).toHaveBeenCalledWith(
      "selected_nodes_changed_event",
      expect.any(Function),
    );
    expect(renderer.destroy).toHaveBeenCalledOnce();
  });

  it("does not rethrow a loader failure when the error view unmounts", async () => {
    vi.mocked(loadArchaeopteryx).mockRejectedValue(
      new Error("renderer failed to load"),
    );

    const { unmount } = render(
      <ArchaeopteryxPhylogeny xml="<phyloxml />" title="Test tree" />,
    );

    expect(await screen.findByText("renderer failed to load")).toBeInTheDocument();

    unmount();
    await Promise.resolve();
  });
});
