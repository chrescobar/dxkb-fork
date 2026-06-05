"use client";

import { useRef, useState } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ReferenceGenome } from "@/lib/services/organisms/reference-genomes";

const badgeVariantForType: Record<string, "default" | "secondary" | "outline"> = {
  Reference: "default",
  Representative: "secondary",
};

const rowHeight = 32; // h-8

function GenomeTable({ genomes }: { genomes: ReferenceGenome[] }) {
  "use no memo";
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const sorted =
    sortDir === null
      ? genomes
      : [...genomes].sort((a, b) => {
          const cmp = a.genome_name.localeCompare(b.genome_name);
          return sortDir === "asc" ? cmp : -cmp;
        });

  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 15,
  });

  const SortIcon =
    sortDir === "asc" ? ArrowUp : sortDir === "desc" ? ArrowDown : ArrowUpDown;
  const ariaSort =
    sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : "none";

  // Cycle null → asc → desc → null so the user can return to insertion order.
  function cycleSort() {
    setSortDir((d) => (d === null ? "asc" : d === "asc" ? "desc" : null));
  }

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems[0]?.start ?? 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0;

  return (
    <div
      ref={parentRef}
      className="h-80 overflow-auto rounded-t-lg xl:min-h-0 xl:flex-1 scrollbar-thin"
    >
      <Table disableScrollWrapper className="table-fixed">
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow className="h-8">
            <TableHead className="w-36 border-r py-1 px-3 text-xs text-center">Type</TableHead>
            <TableHead
              aria-sort={ariaSort}
              className="overflow-hidden p-0 text-xs"
            >
              <button
                type="button"
                onClick={cycleSort}
                aria-label={`Sort by genome name (${ariaSort})`}
                className="flex w-full cursor-pointer select-none items-center gap-1 px-3 py-1 text-left"
              >
                Genome Name
                <SortIcon className="size-3 shrink-0" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-muted-foreground py-4 text-center text-sm">
                No genomes in this category.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {paddingTop > 0 && <tr style={{ height: paddingTop }} />}
              {virtualItems.map((virtualItem) => {
                const g = sorted[virtualItem.index];
                return (
                  <TableRow
                    key={g.genome_id}
                    className={cn("h-8", virtualItem.index % 2 === 1 && "bg-muted/20")}
                  >
                    <TableCell className="w-36 border-r py-1 px-3">
                      <div className="flex items-center justify-center">
                        <Badge
                          variant={badgeVariantForType[g.reference_genome] ?? "outline"}
                          className="text-[11px]"
                        >
                          {g.reference_genome}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="overflow-hidden py-1 px-3">
                      <Link
                        href={`https://www.bv-brc.org/view/Genome/${g.genome_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm block truncate"
                        title={g.genome_name}
                      >
                        {g.genome_name}
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paddingBottom > 0 && <tr style={{ height: paddingBottom }} />}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function ReferenceGenomesClient({ genomes }: { genomes: ReferenceGenome[] }) {
  const types = Array.from(new Set(genomes.map((g) => g.reference_genome))).sort();
  const byType = Object.fromEntries(
    types.map((t) => [t, genomes.filter((g) => g.reference_genome === t)]),
  );

  return (
    <Card className="rounded-lg xl:flex-1 xl:min-h-0" size="sm">
      <Tabs defaultValue="all" className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
        <CardHeader className="pb-0">
          <CardTitle className="text-base!">Reference &amp; Representative Genomes</CardTitle>
          <TabsList className="mt-2 w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">
              All ({genomes.length})
            </TabsTrigger>
            {types.map((type) => (
              <TabsTrigger key={type} value={type} className="flex-1 text-xs">
                {type} ({byType[type].length})
              </TabsTrigger>
            ))}
          </TabsList>
        </CardHeader>

        <CardContent className="p-0 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
          <TabsContent value="all" className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col mt-0">
            <GenomeTable genomes={genomes} />
          </TabsContent>

          {types.map((type) => (
            <TabsContent key={type} value={type} className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col mt-0">
              <GenomeTable genomes={byType[type]} />
            </TabsContent>
          ))}
        </CardContent>
      </Tabs>
    </Card>
  );
}
