import { loadArchaeopteryx } from "../archaeopteryx";

describe("loadArchaeopteryx", () => {
  let restoreTestEnvironment: (() => void) | undefined;

  afterEach(() => {
    restoreTestEnvironment?.();
    restoreTestEnvironment = undefined;
  });

  it("initializes the complete legacy runtime on one jQuery instance", async () => {
    const { archaeopteryx, forester } = await loadArchaeopteryx();
    const jquery = (window as Window & { jQuery?: { widget?: unknown } })
      .jQuery;

    expect(jquery?.widget).toBeTypeOf("function");
    expect(typeof archaeopteryx.parsePhyloXML).toBe("function");
    expect(typeof archaeopteryx.launch).toBe("function");
    expect(typeof forester.collectPropertyRefs).toBe("function");
  });

  it("retries after a transient dependency-load failure instead of caching the rejection", async () => {
    vi.resetModules();
    const actualD3 = await vi.importActual<Record<string, unknown>>("d3");
    let attempt = 0;
    vi.doMock("d3", () => {
      attempt += 1;
      if (attempt === 1) {
        throw new Error("transient dependency failure");
      }
      return actualD3;
    });

    const fresh = await import("../archaeopteryx");
    await expect(fresh.loadArchaeopteryx()).rejects.toThrow();

    const { archaeopteryx } = await fresh.loadArchaeopteryx();
    expect(typeof archaeopteryx.parsePhyloXML).toBe("function");

    vi.doUnmock("d3");
  });

  it("escapes node labels and removes its wheel handlers when destroyed", async () => {
    const bodyHtml = document.body.innerHTML;
    restoreTestEnvironment = () => {
      document.body.innerHTML = bodyHtml;
    };
    document.body.innerHTML = `
      <div id="tree"></div>
      <div id="controls-primary"></div>
      <div id="controls-secondary"></div>
    `;
    const { archaeopteryx } = await loadArchaeopteryx();
    const jquery = (window as unknown as { jQuery: unknown }).jQuery as {
      expr: { pseudos: Record<string, () => boolean> };
      _data(
        target: Document,
        key: "events",
      ): Record<string, { namespace: string }[]> | undefined;
    };
    const pseudoDescriptors = Object.fromEntries(
      ["hover", "link", "visited"].map((pseudo) => [
        pseudo,
        Object.getOwnPropertyDescriptor(jquery.expr.pseudos, pseudo),
      ]),
    );
    const transformDescriptor = Object.getOwnPropertyDescriptor(
      SVGElement.prototype,
      "transform",
    );
    restoreTestEnvironment = () => {
      document.body.innerHTML = bodyHtml;
      for (const pseudo of ["hover", "link", "visited"]) {
        const descriptor = pseudoDescriptors[pseudo];
        if (descriptor) {
          Object.defineProperty(jquery.expr.pseudos, pseudo, descriptor);
        } else {
          delete jquery.expr.pseudos[pseudo];
        }
      }
      if (transformDescriptor) {
        Object.defineProperty(
          SVGElement.prototype,
          "transform",
          transformDescriptor,
        );
      } else {
        delete (SVGElement.prototype as { transform?: unknown }).transform;
      }
    };
    for (const pseudo of ["hover", "link", "visited"]) {
      jquery.expr.pseudos[pseudo] = () => false;
    }
    Object.defineProperty(SVGElement.prototype, "transform", {
      configurable: true,
      value: { baseVal: { consolidate: () => null } },
    });
    const wheelHandlerCount = () => {
      const events = jquery._data(document, "events");
      return ["mousewheel", "DOMMouseScroll"].reduce(
        (count, eventName) =>
          count +
          (events?.[eventName] ?? []).filter(
            ({ namespace }) => namespace === "archaeopteryx",
          ).length,
        0,
      );
    };

    const maliciousLabel = '<img src=x onerror="window.__treeXss = true">';
    const maliciousTooltip = 'tooltip" onmouseover="window.__treeXss = true';
    archaeopteryx.launch(
      "#tree",
      { children: [{ name: maliciousLabel }, { name: "two" }] },
      {},
      {
        controls0: "controls-primary",
        controls1: "controls-secondary",
        enableDynamicSizing: false,
      },
      {},
      {
        customLabel: {
          label: "Custom label",
          propertyRef: "custom:label",
          description: maliciousTooltip,
          showButton: true,
        },
      },
    );

    const customLabel = document.querySelector('label[for="customLabel__cb"]');
    expect(customLabel).toHaveAttribute("title", maliciousTooltip);
    expect(customLabel).not.toHaveAttribute("onmouseover");

    const maliciousNode = Array.from(
      document.querySelectorAll<SVGCircleElement>(".nodeCircleOptions"),
    ).find(
      (circle) =>
        (circle as SVGCircleElement & { __data__?: { name?: string } }).__data__
          ?.name === maliciousLabel,
    );
    maliciousNode?.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true }),
    );
    const tooltip = document.querySelector(".node_mouseover_tooltip");

    expect(maliciousNode).toBeDefined();
    expect(tooltip?.querySelector("img")).toBeNull();
    expect(tooltip?.textContent).toContain(maliciousLabel);
    expect(wheelHandlerCount()).toBe(2);
    archaeopteryx.destroy();
    expect(wheelHandlerCount()).toBe(0);
  });
});
