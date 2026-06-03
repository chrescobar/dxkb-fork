"use client";

import { useState } from "react";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReferenceGenome } from "@/lib/services/organisms/reference-genomes";

const badgeVariantForType: Record<string, "default" | "secondary" | "outline"> = {
  Reference: "default",
  Representative: "secondary",
};

function GenomeRows({ genomes }: { genomes: ReferenceGenome[] }) {
  if (genomes.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={2} className="text-muted-foreground py-4 text-center text-sm">
          No genomes in this category.
        </TableCell>
      </TableRow>
    );
  }
  return genomes.map((g) => (
    <TableRow key={g.genome_id} className="h-8">
      <TableCell className="w-32 border-r py-1 px-3">
        <Badge
          variant={badgeVariantForType[g.reference_genome] ?? "outline"}
          className="text-[11px]"
        >
          {g.reference_genome}
        </Badge>
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
  ));
}

function GenomeTable({ genomes }: { genomes: ReferenceGenome[] }) {
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);

  const sorted =
    sortDir === null
      ? genomes
      : [...genomes].sort((a, b) => {
          const cmp = a.genome_name.localeCompare(b.genome_name);
          return sortDir === "asc" ? cmp : -cmp;
        });

  const SortIcon =
    sortDir === "asc" ? ArrowUp : sortDir === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <ScrollArea className="h-80 overflow-hidden rounded-t-lg xl:min-h-0 xl:flex-1 **:data-[slot=scroll-area-scrollbar]:z-20 **:data-[slot=scroll-area-thumb]:bg-foreground/25">
      <Table disableScrollWrapper className="table-fixed">
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow className="h-8">
            <TableHead className="w-28 border-r py-1 px-3 text-xs">Type</TableHead>
            <TableHead
              className="cursor-pointer select-none overflow-hidden py-1 px-3 text-xs"
              onClick={() =>
                setSortDir((d) => (d === "asc" ? "desc" : "asc"))
              }
            >
              <span className="flex items-center gap-1">
                Genome Name
                <SortIcon className="size-3 shrink-0" />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:nth-child(even)]:bg-muted/20">
          <GenomeRows genomes={sorted} />
        </TableBody>
      </Table>
    </ScrollArea>
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
