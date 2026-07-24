import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GraphNodeList } from "../graph-node-list";
import type { GNode } from "@/lib/interactions/types";

// cmdk needs two browser APIs jsdom omits: scrollIntoView (scrolls the active
// item into view on selection) and ResizeObserver (its internal sizing). Stub
// both so the keyboard flow runs.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() { return undefined; }
      unobserve() { return undefined; }
      disconnect() { return undefined; }
    },
  );
});

const nodes: GNode[] = [
  { id: "fig|1.1", gene: "dnaA", kind: "microbial" },
  { id: "fig|2.2", gene: "recA", kind: "host" },
];

describe("GraphNodeList", () => {
  it("selects a node via keyboard: type to filter, Enter to choose", async () => {
    const user = userEvent.setup();
    const onSelectNode = vi.fn();

    render(<GraphNodeList nodes={nodes} selectedId={null} onSelectNode={onSelectNode} />);

    const input = screen.getByPlaceholderText("Search proteins…");
    await user.click(input);
    await user.keyboard("recA");
    await user.keyboard("{Enter}");

    expect(onSelectNode).toHaveBeenCalledWith(nodes[1]);
  });
});
