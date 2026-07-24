import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { colors } from "@/lib/interactions/graph-theme";
import type { GNode } from "@/lib/interactions/types";

interface GraphNodeListProps {
  nodes: GNode[];
  selectedId: string | null;
  onSelectNode: (node: GNode) => void;
}

// Keyboard-operable equivalent of clicking a node on the WebGL canvas. Sigma
// only wires pointer events, so this list is the sole path to reach a node
// (and, via the detail panel, its edges) without a mouse. Selecting here drives
// the same selection sink as clickNode, keeping canvas and list in lockstep.
export function GraphNodeList({ nodes, selectedId, onSelectNode }: GraphNodeListProps) {
  return (
    <Command
      // cmdk defaults to its own fuzzy filter over each item's `value`; we set
      // value to gene + id so both are searchable.
      label="Interaction network nodes"
      className="h-full bg-transparent"
    >
      <CommandInput placeholder="Search proteins…" />
      <CommandList className="max-h-none flex-1">
        <CommandEmpty>No proteins match.</CommandEmpty>
        {nodes.map((node) => (
          <CommandItem
            key={node.id}
            value={`${node.gene ?? ""} ${node.id}`}
            onSelect={() => { onSelectNode(node); }}
            aria-current={node.id === selectedId}
            className="gap-2"
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: node.kind === "host" ? colors.host : colors.microbial }}
            />
            <span className="truncate">{node.gene || node.id}</span>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
