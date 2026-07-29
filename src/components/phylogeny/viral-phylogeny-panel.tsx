"use client";

import { ArrowLeft, Network } from "lucide-react";
import { useState } from "react";

import { SectionError } from "@/components/organisms/shared/section-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViralTreeChoice } from "@/lib/phylogeny/viral-facets";
import { resolvePhylogenyUrl } from "@/lib/services/organisms/phylogeny";

import { ArchaeopteryxPhylogeny } from "./archaeopteryx-phylogeny";
import { useViralFamily, useViralTreeXml } from "./use-phylogeny-data";
import { ViralTreePicker } from "./viral-tree-picker";

export function ViralPhylogenyPanel({ taxonId, taxonName }: { taxonId: number; taxonName: string }) {
  const family = useViralFamily(taxonId);
  const [choice, setChoice] = useState<ViralTreeChoice | null>(null);
  const url = choice?.viewer === "archaeopteryx" ? resolvePhylogenyUrl(choice.ref.path) : null;
  const tree = useViralTreeXml(url);

  if (family.isPending) return <Skeleton className="m-4 h-[calc(100%-2rem)]" />;
  if (family.isError) {
    return <div className="p-4"><SectionError title="Viral trees unavailable" message={family.error.message} /></div>;
  }
  if (family.data.groups.length === 0) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div><Network className="mx-auto mb-4 size-10 text-muted-foreground" /><h2 className="text-lg font-semibold">No published trees</h2></div>
      </div>
    );
  }
  if (!choice) return <ViralTreePicker block={family.data} onOpen={setChoice} />;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b bg-background px-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => { setChoice(null); }}><ArrowLeft /> Back to trees</Button>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{choice.ref.name}</div>
          <div className="truncate text-xs text-muted-foreground">{taxonName} / {choice.groupTitle}</div>
        </div>
      </div>
      {url === null ? (
        <div className="p-4"><SectionError title="Tree unavailable" message="The tree reference contains an invalid URL." /></div>
      ) : tree.isPending ? (
        <Skeleton className="m-4 h-[calc(100%-2rem)]" />
      ) : tree.isError ? (
        <div className="p-4"><SectionError title="Tree unavailable" message={tree.error.message} /></div>
      ) : (
        <ArchaeopteryxPhylogeny key={url} xml={tree.data} title={choice.ref.name} />
      )}
    </div>
  );
}
