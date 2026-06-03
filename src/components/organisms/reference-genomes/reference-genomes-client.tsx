"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
        <TableCell colSpan={2} className="text-muted-foreground text-center py-4 text-sm">
          No genomes in this category.
        </TableCell>
      </TableRow>
    );
  }
  return genomes.map((g) => (
    <TableRow key={g.genome_id} className="h-8">
      <TableCell className="w-32 py-1 px-3">
        <Badge
          variant={badgeVariantForType[g.reference_genome] ?? "outline"}
          className="text-[11px]"
        >
          {g.reference_genome}
        </Badge>
      </TableCell>
      <TableCell className="py-1 px-3">
        <Link
          href={`https://www.bv-brc.org/view/Genome/${g.genome_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-sm"
        >
          {g.genome_name}
        </Link>
      </TableCell>
    </TableRow>
  ));
}

function GenomeTable({ genomes }: { genomes: ReferenceGenome[] }) {
  return (
    <ScrollArea className="h-56 rounded-md border">
      <Table disableScrollWrapper>
        <TableHeader>
          <TableRow className="h-8">
            <TableHead className="w-32 py-1 px-3 text-xs">Type</TableHead>
            <TableHead className="py-1 px-3 text-xs">Genome Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <GenomeRows genomes={genomes} />
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
    <Tabs defaultValue="all">
      <TabsList className="h-7">
        <TabsTrigger value="all" className="text-xs px-2">
          All ({genomes.length})
        </TabsTrigger>
        {types.map((type) => (
          <TabsTrigger key={type} value={type} className="text-xs px-2">
            {type} ({byType[type].length})
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="all">
        <GenomeTable genomes={genomes} />
      </TabsContent>

      {types.map((type) => (
        <TabsContent key={type} value={type}>
          <GenomeTable genomes={byType[type]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
