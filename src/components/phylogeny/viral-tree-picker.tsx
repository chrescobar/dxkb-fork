"use client";

import { Download, Filter, Globe2, Map as MapIcon, Network } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { canonicalDatasetId } from "@/lib/phylogeny/nextstrain-dataset";
import {
  filterViralTrees,
  flattenViralTrees,
  pruneViralFilters,
  sortedSegments,
  viralFacetCounts,
  type ViralFilters,
  type ViralTreeChoice,
} from "@/lib/phylogeny/viral-facets";
import { resolvePhylogenyUrl, type PhyloFamilyBlock } from "@/lib/services/organisms/phylogeny";

// Label styling for an option whose facet count is zero. Base UI renders its
// radio/checkbox as a <span role> with aria-disabled rather than a natively
// disabled control, so match on that instead of `peer-disabled:`.
const disabledOption = "has-aria-disabled:cursor-not-allowed has-aria-disabled:opacity-50";

export function ViralTreePicker({ block, availableNextstrainIds, focusChoiceKey, onOpen }: {
  block: PhyloFamilyBlock;
  availableNextstrainIds: ReadonlySet<string>;
  focusChoiceKey?: string;
  onOpen: (choice: ViralTreeChoice) => void;
}) {
  const trees = flattenViralTrees(block);
  const [filters, setFilters] = useState<ViralFilters>({ strain: null, viewer: null, segments: new Set() });
  const strains = [...new Map(trees.map(tree => [tree.groupKey, tree.groupTitle])).entries()];
  const viewers = [...new Set(trees.map(tree => tree.viewer))];
  // Full segment list so options stay put; unavailable ones are disabled below
  // rather than disappearing.
  const segments = sortedSegments(trees);
  const visible = filterViralTrees(trees, filters);
  const counts = viralFacetCounts(trees, filters);

  const update = (next: ViralFilters) => { setFilters(pruneViralFilters(trees, next)); };

  useEffect(() => {
    if (!focusChoiceKey) return;
    [...document.querySelectorAll<HTMLElement>("[data-choice-key]")]
      .find(element => element.dataset.choiceKey === focusChoiceKey)
      ?.focus();
  }, [focusChoiceKey]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/15">
      <div className="border-b bg-background px-5 py-4">
        <h2 className="text-lg font-semibold">Available phylogenetic trees</h2>
        <p className="text-sm text-muted-foreground">Choose a strain, viewer, and genome segment.</p>
      </div>
      {/* lg: each column scrolls independently so Filters stay pinned; below lg
          the stacked layout scrolls as one column. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto lg:grid-cols-[260px_1fr] lg:overflow-hidden">
        <aside className="border-b bg-background p-4 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-semibold">
              <span className="flex items-center gap-2"><Filter className="size-4" /> Filters</span>
              <Badge variant="secondary">{visible.length}</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 pt-4">
              <fieldset>
                <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Strain</legend>
                {/* grid-cols-1 pins the column to the sidebar width; without it
                    the auto column sizes to the longest strain name and pushes
                    the count out of view. */}
                <RadioGroup className="grid-cols-1" value={filters.strain ?? "all"} onValueChange={(value: unknown) => {
                  if (typeof value === "string") update({ ...filters, strain: value === "all" ? null : value });
                }}>
                  <Label><RadioGroupItem value="all" />All strains <span className="ml-auto text-xs text-muted-foreground">{counts.allStrains}</span></Label>
                  {/* Never disabled: `strains` is derived from `trees`, so every
                      row has at least one tree, and leaving strain unconstrained
                      means picking a viewer can't lock the user out of a strain. */}
                  {strains.map(([key, title]) => (
                    <Label key={key}>
                      <RadioGroupItem value={key} />
                      <span className="min-w-0 truncate" title={title}>{title}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{counts.strain(key)}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>
              {viewers.length > 1 && (
                <fieldset>
                  <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Viewer</legend>
                  <RadioGroup value={filters.viewer ?? "all"} onValueChange={(value: unknown) => {
                    if (value === "all" || value === "archaeopteryx" || value === "nextstrain") {
                      update({ ...filters, viewer: value === "all" ? null : value });
                    }
                  }}>
                    <Label><RadioGroupItem value="all" />All viewers <span className="ml-auto text-xs text-muted-foreground">{counts.allViewers}</span></Label>
                    {([["archaeopteryx", "Archaeopteryx"], ["nextstrain", "Auspice"]] as const).map(([value, title]) => {
                      const count = counts.viewer(value);
                      return (
                        <Label key={value} className={disabledOption}>
                          <RadioGroupItem value={value} disabled={count === 0} />
                          {title}
                          <span className="ml-auto text-xs text-muted-foreground">{count}</span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </fieldset>
              )}
              {segments.length > 1 && (
                <fieldset>
                  <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Segment</legend>
                  <div className="space-y-2">
                    {segments.map(segment => {
                      const count = counts.segment(segment);
                      return (
                        <Label key={segment} className={disabledOption}>
                          <Checkbox
                            checked={filters.segments.has(segment)}
                            disabled={count === 0}
                            onCheckedChange={checked => {
                              const next = new Set(filters.segments);
                              if (checked) next.add(segment); else next.delete(segment);
                              update({ ...filters, segments: next });
                            }}
                          />
                          {segment}
                          <span className="ml-auto text-xs text-muted-foreground">{count}</span>
                        </Label>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </CollapsibleContent>
          </Collapsible>
        </aside>
        <main className="p-5 lg:min-h-0 lg:overflow-y-auto">
          {visible.length === 0 ? (
            <div className="grid min-h-64 place-items-center text-center text-sm text-muted-foreground">
              No trees found for the selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {visible.map(choice => {
                const metadata = choice.ref.metadata ? resolvePhylogenyUrl(choice.ref.metadata) : null;
                const datasetId = choice.viewer === "nextstrain"
                  ? canonicalDatasetId(choice.ref.path)
                  : null;
                const unavailable = choice.viewer === "nextstrain" &&
                  (!datasetId || !availableNextstrainIds.has(datasetId));
                return (
                  <Card
                    key={`${choice.viewer}:${choice.ref.path}`}
                    data-choice-key={`${choice.viewer}:${choice.ref.path}`}
                    role="button"
                    tabIndex={unavailable ? -1 : 0}
                    aria-disabled={unavailable || undefined}
                    className="border bg-background transition-shadow hover:shadow-md aria-disabled:cursor-not-allowed aria-disabled:opacity-65 aria-disabled:hover:shadow-none"
                    onClick={() => {
                      if (!unavailable) onOpen(choice);
                    }}
                    onKeyDown={event => {
                      if (unavailable || (event.key !== "Enter" && event.key !== " ")) return;
                      event.preventDefault();
                      onOpen(choice);
                    }}
                  >
                    <div className="mx-4 grid h-24 place-items-center rounded-lg bg-linear-to-br from-primary/15 via-background to-cyan-500/10">
                      {choice.ref.region === "usa" ? <MapIcon className="size-10 text-primary/70" /> : <Globe2 className="size-10 text-primary/70" />}
                    </div>
                    <CardHeader>
                      <div className="mb-1 flex flex-wrap gap-1">
                        <Badge variant="secondary">{choice.groupTitle}</Badge>
                        {choice.segment && <Badge variant="outline">{choice.segment}</Badge>}
                      </div>
                      <CardTitle>{choice.ref.name}</CardTitle>
                      {choice.ref.definition && <CardDescription>{choice.ref.definition}</CardDescription>}
                    </CardHeader>
                    <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Network className="size-4" />
                      {unavailable
                        ? "Auspice dataset unavailable"
                        : choice.viewer === "nextstrain"
                          ? "Nextstrain phylogenomic viewer"
                          : "Interactive phylogram"}
                    </CardContent>
                    {metadata && (
                      <CardFooter>
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          render={<a href={metadata} target="_blank" rel="noopener noreferrer" aria-label={`Download metadata for ${choice.ref.name}`} />}
                          onClick={event => { event.stopPropagation(); }}
                        >
                          <Download /> Metadata
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
