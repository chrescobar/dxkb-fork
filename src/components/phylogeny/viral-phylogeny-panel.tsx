"use client";

import { ArrowLeft, Network } from "lucide-react";
import { useState } from "react";

import { SectionError } from "@/components/organisms/shared/section-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { viewerUrl } from "@/lib/phylogeny/nextstrain-dataset";
import { choiceKey, type ViralTreeChoice } from "@/lib/phylogeny/viral-facets";
import { resolvePhylogenyUrl } from "@/lib/services/organisms/phylogeny";

import { ArchaeopteryxPhylogeny } from "./archaeopteryx-phylogeny";
import {
  useNextstrainInventory,
  useViralFamily,
  useViralTreeXml,
} from "./use-phylogeny-data";
import { ViralTreePicker } from "./viral-tree-picker";

export function ViralPhylogenyPanel({
  taxonId,
  taxonName,
}: {
  taxonId: number;
  taxonName: string;
}) {
  const family = useViralFamily(taxonId);
  const advertisedDatasetIds =
    family.data?.groups.flatMap((group) =>
      (group.nextstrain ?? []).map((ref) => ref.path),
    ) ?? [];
  const inventory = useNextstrainInventory(advertisedDatasetIds);
  const [choice, setChoice] = useState<ViralTreeChoice | null>(null);
  const [lastChoiceKey, setLastChoiceKey] = useState<string>();
  const isNextstrain = choice?.viewer === "nextstrain";
  const xmlUrl =
    choice?.viewer === "archaeopteryx"
      ? resolvePhylogenyUrl(choice.ref.path)
      : null;
  const auspiceUrl = isNextstrain ? viewerUrl(choice.ref.path) : null;
  const tree = useViralTreeXml(xmlUrl);

  if (family.isPending) return <Skeleton className="m-4 h-[calc(100%-2rem)]" />;
  if (family.isError) {
    return (
      <div className="p-4">
        <SectionError
          title="Viral trees unavailable"
          message={family.error.message}
        />
      </div>
    );
  }
  if (family.data.groups.length === 0) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div>
          <Network className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No published trees</h2>
        </div>
      </div>
    );
  }
  if (!choice) {
    return (
      <ViralTreePicker
        block={family.data}
        nextstrainInventory={
          inventory.isPending
            ? { status: "pending" }
            : inventory.isError
              ? { status: "error", message: inventory.error.message }
              : { status: "ready", ids: inventory.data }
        }
        focusChoiceKey={lastChoiceKey}
        onOpen={(nextChoice) => {
          setLastChoiceKey(choiceKey(nextChoice));
          setChoice(nextChoice);
        }}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b bg-background px-3 py-2">
        <Button
          size="sm"
          onClick={() => {
            setChoice(null);
          }}
        >
          <ArrowLeft /> Back to trees
        </Button>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {choice.ref.name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {taxonName} / {choice.groupTitle}
          </div>
        </div>
      </div>
      <TreeViewer
        choice={choice}
        auspiceUrl={auspiceUrl}
        xmlUrl={xmlUrl}
        tree={tree}
      />
    </div>
  );
}

function TreeViewer({
  choice,
  auspiceUrl,
  xmlUrl,
  tree,
}: {
  choice: ViralTreeChoice;
  auspiceUrl: string | null;
  xmlUrl: string | null;
  tree: ReturnType<typeof useViralTreeXml>;
}) {
  if (choice.viewer === "nextstrain") {
    if (auspiceUrl === null) {
      return (
        <TreeError message="The tree reference contains an invalid dataset identifier." />
      );
    }
    return (
      <iframe
        key={auspiceUrl}
        src={auspiceUrl}
        title={`Auspice phylogeny viewer for ${choice.ref.name}`}
        sandbox="allow-scripts"
        className="min-h-150 w-full min-w-0 flex-1 border-0"
      />
    );
  }
  if (xmlUrl === null) {
    return <TreeError message="The tree reference contains an invalid URL." />;
  }
  if (tree.isPending) return <Skeleton className="m-4 h-[calc(100%-2rem)]" />;
  if (tree.isError) return <TreeError message={tree.error.message} />;
  return (
    <ArchaeopteryxPhylogeny
      key={xmlUrl}
      xml={tree.data}
      title={choice.ref.name}
    />
  );
}

function TreeError({ message }: { message: string }) {
  return (
    <div className="p-4">
      <SectionError title="Tree unavailable" message={message} />
    </div>
  );
}
