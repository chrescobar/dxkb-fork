"use client";

import { useEffect, useRef } from "react";

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
  const listRef = useRef<HTMLDivElement | null>(null);

  // cmdk's own `data-selected` cursor follows the pointer, which visually
  // competed with the app selection and highlighted whatever was last hovered
  // rather than the node clicked on the graph. We disable pointer selection so
  // that phantom highlight can't wander, and style `aria-current` (the app
  // selection) ourselves below. On a graph→list selection change, scroll the
  // selected row into view so the two stay in sync.
  useEffect(() => {
    if (!selectedId) return;
    const el = listRef.current?.querySelector('[aria-current="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <Command
      // cmdk defaults to its own fuzzy filter over each item's `value`; we set
      // value to gene + id so both are searchable.
      label="Interaction network nodes"
      className="h-full bg-transparent"
      disablePointerSelection
    >
      <CommandInput placeholder="Search proteins…" />
      <CommandList ref={listRef} className="max-h-none flex-1">
        <CommandEmpty>No proteins match.</CommandEmpty>
        {nodes.map((node) => {
          const isSelected = node.id === selectedId;
          return (
            <CommandItem
              key={node.id}
              value={`${node.gene ?? ""} ${node.id}`}
              onSelect={() => { onSelectNode(node); }}
              aria-current={isSelected}
              // cmdk keeps its own `data-selected` cursor (mount first-item,
              // keyboard, click) independent of the app selection, which showed
              // as a competing highlight on the wrong row. Neutralise it and let
              // the app selection (`aria-current`, driven equally by canvas
              // clicks and this list) be the single amber highlight — forced to
              // win when a row is both cmdk-focused and app-selected.
              className="gap-2 aria-[current=true]:bg-secondary/25! aria-[current=true]:font-medium data-[selected=true]:bg-transparent"
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: isSelected
                    ? colors.selected
                    : node.kind === "host"
                      ? colors.host
                      : colors.microbial,
                }}
              />
              <span className="truncate">{node.gene || node.id}</span>
            </CommandItem>
          );
        })}
      </CommandList>
    </Command>
  );
}
