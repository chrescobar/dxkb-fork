"use client";

import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { toast } from "sonner";
import { useCachedFeatureGroupLoader } from "@/hooks/services/use-cached-feature-group-loader";
import { useCachedGenomeGroupLoader } from "@/hooks/services/use-cached-genome-group-loader";
import type { FeatureSummary } from "@/lib/services/feature";
import type { GenomeSummary } from "@/lib/services/genome";

interface MsaReferenceOptionsFields {
  refType: string;
  featureGroupPath: string;
  genomeGroupPaths: string;
  refString: string;
}

interface UseMsaReferenceOptionsOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: { store: any };
  fields: MsaReferenceOptionsFields;
}

export interface UseMsaReferenceOptionsReturn {
  refType: string;
  featureOptions: FeatureSummary[];
  genomeOptions: Pick<GenomeSummary, "genome_id" | "genome_name">[];
  selectedFeatureId: string;
  selectedGenomeId: string;
  setSelectedFeatureId: (id: string) => void;
  setSelectedGenomeId: (id: string) => void;
  isLoadingFeatures: boolean;
  isLoadingGenomes: boolean;
  reset: () => void;
}

export function useMsaReferenceOptions({
  form,
  fields,
}: UseMsaReferenceOptionsOptions): UseMsaReferenceOptionsReturn {
  const featureLoader = useCachedFeatureGroupLoader();
  const genomeLoader = useCachedGenomeGroupLoader();

  const [featureOptions, setFeatureOptions] = useState<FeatureSummary[]>([]);
  const [genomeOptions, setGenomeOptions] = useState<
    Pick<GenomeSummary, "genome_id" | "genome_name">[]
  >([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState("");
  const [selectedGenomeId, setSelectedGenomeId] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refType = useStore(form.store, (s: any) => (s.values[fields.refType] as string) ?? "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const featureGroupPath = useStore(form.store, (s: any) => (s.values[fields.featureGroupPath] as string) ?? "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawGenomeGroupPaths = useStore(form.store, (s: any) => s.values[fields.genomeGroupPaths] as string[] | undefined);
  const genomeGroupPath = rawGenomeGroupPaths?.[0] ?? "";

  useEffect(() => {
    const shouldLoad = refType === "feature_id" && featureGroupPath.trim() !== "";

    if (!shouldLoad) {
      queueMicrotask(() => {
        setFeatureOptions([]);
        setSelectedFeatureId("");
      });
      return;
    }

    let cancelled = false;

    featureLoader.load(featureGroupPath).then((features) => {
      if (!cancelled) {
        setFeatureOptions(features);
      }
    }).catch((err: unknown) => {
      if (cancelled) return;
      setFeatureOptions([]);
      setSelectedFeatureId("");
      toast.error("Failed to load features", {
        description: err instanceof Error ? err.message : "Failed to load features from feature group",
        closeButton: true,
      });
    });

    return () => {
      cancelled = true;
      setFeatureOptions([]);
      setSelectedFeatureId("");
    };
  // featureLoader is a stable reference from the cached loader hook
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refType, featureGroupPath]);

  useEffect(() => {
    const shouldLoad = refType === "genome_id" && genomeGroupPath.trim() !== "";

    if (!shouldLoad) {
      queueMicrotask(() => {
        setGenomeOptions([]);
        setSelectedGenomeId("");
      });
      return;
    }

    let cancelled = false;

    genomeLoader.load(genomeGroupPath).then((genomes) => {
      if (!cancelled) {
        setGenomeOptions(
          genomes.map((g) => ({ genome_id: g.genome_id, genome_name: g.genome_name })),
        );
      }
    }).catch((err: unknown) => {
      if (cancelled) return;
      setGenomeOptions([]);
      setSelectedGenomeId("");
      toast.error("Failed to load genomes", {
        description: err instanceof Error ? err.message : "Failed to load genomes from genome group",
        closeButton: true,
      });
    });

    return () => {
      cancelled = true;
      setGenomeOptions([]);
      setSelectedGenomeId("");
    };
  // genomeLoader is a stable reference from the cached loader hook
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refType, genomeGroupPath]);

  function reset() {
    setFeatureOptions([]);
    setGenomeOptions([]);
    setSelectedFeatureId("");
    setSelectedGenomeId("");
  }

  return {
    refType,
    featureOptions,
    genomeOptions,
    selectedFeatureId,
    selectedGenomeId,
    setSelectedFeatureId,
    setSelectedGenomeId,
    isLoadingFeatures: featureLoader.isLoading,
    isLoadingGenomes: genomeLoader.isLoading,
    reset,
  };
}
