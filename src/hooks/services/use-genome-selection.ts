"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCachedGenomeGroupLoader } from "@/hooks/services/use-cached-genome-group-loader";
import type { GenomeSummary } from "@/lib/services/genome";
import type { WorkspaceObject } from "@/lib/services/workspace/types";

interface FormSync {
  // setFieldValue expects DeepKeys<T> not string; rest params bypass the strict generic constraint
  form: { setFieldValue: (...args: any[]) => void };
  genomeIdsFieldName: string;
  genomeGroupPathFieldName: string;
}

interface UseGenomeSelectionOptions {
  maxGenomes: number;
  sync?: FormSync;
  onSelectionChange?: (genomes: GenomeSummary[]) => void;
}

interface UseGenomeSelectionReturn {
  selectedGenomes: GenomeSummary[];
  selectedGenomeIds: string[];
  lastSelectedGroup: string | null;
  isLoadingGroup: boolean;
  addGenome: (genome: GenomeSummary) => void;
  removeGenome: (genomeId: string) => void;
  addGenomeGroup: (object: WorkspaceObject) => Promise<void>;
  reset: () => void;
}

export function useGenomeSelection({
  maxGenomes,
  sync,
  onSelectionChange,
}: UseGenomeSelectionOptions): UseGenomeSelectionReturn {
  const [selectedGenomes, setSelectedGenomes] = useState<GenomeSummary[]>([]);
  const [lastSelectedGroup, setLastSelectedGroup] = useState<string | null>(null);

  const genomeLoader = useCachedGenomeGroupLoader();

  const selectedGenomeIds = useMemo(
    () => selectedGenomes.map((g) => g.genome_id),
    [selectedGenomes],
  );

  useEffect(() => {
    if (!sync) return;
    sync.form.setFieldValue(sync.genomeIdsFieldName, selectedGenomeIds);
  }, [selectedGenomeIds, sync]);

  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedGenomes);
  }, [selectedGenomes, onSelectionChange]);

  const addGenome = useCallback(
    (genome: GenomeSummary) => {
      setSelectedGenomes((previous) => {
        if (previous.length >= maxGenomes) {
          toast.error(`You can add up to ${maxGenomes} genomes`);
          return previous;
        }

        if (previous.some((item) => item.genome_id === genome.genome_id)) {
          toast.error("Genome already added", {
            description: `${genome.genome_name} (${genome.genome_id}) is already in the selection`,
          });
          return previous;
        }

        return [...previous, genome];
      });
    },
    [maxGenomes],
  );

  const removeGenome = useCallback((genomeId: string) => {
    setSelectedGenomes((previous) =>
      previous.filter((genome) => genome.genome_id !== genomeId),
    );
  }, []);

  const addGenomeGroup = useCallback(
    async (object: WorkspaceObject) => {
      if (!object?.path) {
        toast.error("Invalid genome group selection");
        return;
      }

      try {
        const genomes = await genomeLoader.load(object.path);

        if (!genomes.length) {
          toast.error("Selected genome group is empty");
          return;
        }

        setSelectedGenomes((previous) => {
          const existingIds = new Set(previous.map((item) => item.genome_id));
          const availableSlots = maxGenomes - previous.length;
          const uniqueNewGenomes = genomes.filter(
            (genome) => !existingIds.has(genome.genome_id),
          );

          if (!uniqueNewGenomes.length) {
            toast.info("All genomes in this group are already selected");
            return previous;
          }

          if (availableSlots <= 0) {
            toast.error(`Genome selection limit reached (${maxGenomes} genomes)`);
            return previous;
          }

          const genomesToAdd = uniqueNewGenomes.slice(0, availableSlots);

          if (uniqueNewGenomes.length > genomesToAdd.length) {
            toast.warning(
              `Some genomes were not added because the selection limit is ${maxGenomes}`,
            );
          }

          toast.success(
            `Added ${genomesToAdd.length} genome${genomesToAdd.length === 1 ? "" : "s"} from ${object.name ?? "genome group"}`,
          );

          return [...previous, ...genomesToAdd];
        });

        const groupLabel = object.name || object.path;
        setLastSelectedGroup(groupLabel);

        if (sync) {
          sync.form.setFieldValue(sync.genomeGroupPathFieldName, object.path);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load genome group";
        toast.error(message);
      }
    },
    // genomeLoader.load is stable; maxGenomes and sync are primitive/ref values
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [genomeLoader.load, maxGenomes, sync],
  );

  const reset = useCallback(() => {
    setSelectedGenomes([]);
    setLastSelectedGroup(null);
  }, []);

  return {
    selectedGenomes,
    selectedGenomeIds,
    lastSelectedGroup,
    isLoadingGroup: genomeLoader.isLoading,
    addGenome,
    removeGenome,
    addGenomeGroup,
    reset,
  };
}
