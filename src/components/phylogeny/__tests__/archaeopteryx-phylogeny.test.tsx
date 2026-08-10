import { render, screen, waitFor } from "@testing-library/react";

import { loadArchaeopteryx } from "@/lib/phylogeny/archaeopteryx";

import { ArchaeopteryxPhylogeny } from "../archaeopteryx-phylogeny";

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

class MediaQueryListStub {
  matches = false;
  private listeners = new Set<(event: MediaQueryListEvent) => void>();

  addEventListener = vi.fn(
    (_type: "change", listener: (event: MediaQueryListEvent) => void) => {
      this.listeners.add(listener);
    },
  );
  removeEventListener = vi.fn(
    (_type: "change", listener: (event: MediaQueryListEvent) => void) => {
      this.listeners.delete(listener);
    },
  );

  setMatches(matches: boolean) {
    this.matches = matches;
    for (const listener of this.listeners)
      listener({ matches } as MediaQueryListEvent);
  }
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

describe("ArchaeopteryxPhylogeny", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "dxkb-light";
    ResizeObserverStub.instances = [];
  });

  it("updates the tree layout when controls stack or unstack", async () => {
    const mediaQuery = new MediaQueryListStub();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mediaQuery),
    );
    const renderer = {
      destroy: vi.fn(),
      getSelectedNodes: vi.fn(() => []),
      launch: vi.fn((selector: string) => {
        const host = document.querySelector(selector);
        const primaryControls = host?.parentElement?.querySelector(
          '[id$="-controls-primary"]',
        );
        const secondaryControls = host?.parentElement?.querySelector(
          '[id$="-controls-secondary"]',
        );
        if (!primaryControls || !secondaryControls)
          throw new Error("Expected phylogeny controls");
        Object.defineProperties(primaryControls, {
          offsetLeft: { configurable: true, value: 10 },
          offsetWidth: { configurable: true, value: 160 },
        });
        Object.defineProperty(secondaryControls, "offsetWidth", {
          configurable: true,
          value: 192,
        });
      }),
      parsePhyloXML: vi.fn(() => ({})),
      setTheme: vi.fn(),
    };
    vi.mocked(loadArchaeopteryx).mockResolvedValue({
      archaeopteryx: renderer,
      forester: { collectPropertyRefs: vi.fn(() => new Set<string>()) },
    });

    const { container } = render(
      <ArchaeopteryxPhylogeny xml="<phyloxml />" title="Test tree" />,
    );
    const host = container.querySelector('[role="img"]') as HTMLDivElement;

    await waitFor(() => {
      expect(host.style.width).toBe("calc(100% - 204px)");
    });

    mediaQuery.setMatches(true);
    expect(host.style.width).toBe("100%");

    mediaQuery.setMatches(false);
    expect(host.style.width).toBe("calc(100% - 204px)");
  });

  it("updates theme colors without rebuilding the renderer", async () => {
    const mediaQuery = new MediaQueryListStub();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mediaQuery),
    );
    const renderer = {
      destroy: vi.fn(),
      getSelectedNodes: vi.fn(() => []),
      launch: vi.fn(),
      parsePhyloXML: vi.fn(() => ({})),
      setTheme: vi.fn(),
    };
    vi.mocked(loadArchaeopteryx).mockResolvedValue({
      archaeopteryx: renderer,
      forester: { collectPropertyRefs: vi.fn(() => new Set<string>()) },
    });

    render(<ArchaeopteryxPhylogeny xml="<phyloxml />" title="Test tree" />);
    await waitFor(() => {
      expect(renderer.launch).toHaveBeenCalledOnce();
    });

    document.documentElement.dataset.theme = "dxkb-dark";

    await waitFor(() => {
      expect(renderer.setTheme).toHaveBeenCalledOnce();
    });
    expect(renderer.launch).toHaveBeenCalledOnce();
    expect(renderer.destroy).not.toHaveBeenCalled();
  });

  it("tears down the renderer lifecycle when rendering fails", async () => {
    const renderer = {
      destroy: vi.fn(),
      getSelectedNodes: vi.fn(() => []),
      launch: vi.fn(() => {
        throw new Error("renderer failed to launch");
      }),
      parsePhyloXML: vi.fn(() => ({})),
      setTheme: vi.fn(),
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

    expect(
      await screen.findByText("renderer failed to load"),
    ).toBeInTheDocument();

    unmount();
    await Promise.resolve();
  });
});
