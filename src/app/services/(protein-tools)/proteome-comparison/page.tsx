"use client";

import { useState, useCallback, useMemo } from "react";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { useForm, useStore } from "@tanstack/react-form";
import { ServiceHeader } from "@/components/services/service-header";
import { Button } from "@/components/ui/button";
import {
  proteomeComparisonInfo,
} from "@/lib/services/info/proteome-comparison";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  getGenomeIdsFromGroup,
  fetchGenomesByIds,
} from "@/lib/services/genome";
import {
  proteomeComparisonFormSchema,
  defaultProteomeComparisonFormValues,
  maxComparisonGenomes,
  type ProteomeComparisonFormData,
} from "@/lib/forms/(protein-tools)/proteome-comparison/proteome-comparison-form-schema";
import {
  createGenomeComparisonItem,
  createFastaComparisonItem,
  createFeatureGroupComparisonItem,
  createGenomeGroupComparisonItem,
  isDuplicateComparisonItem,
  countTotalComparisonGenomes,
  removeComparisonItemById,
  validateGenomeGroupAddition,
} from "@/lib/forms/(protein-tools)/proteome-comparison/proteome-comparison-form-utils";
import { proteomeComparisonService } from "@/lib/forms/(protein-tools)/proteome-comparison/proteome-comparison-service";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import { ProteomeComparisonParametersCard } from "./proteome-comparison-parameters-card";
import { ProteomeComparisonReferenceGenomeCard } from "./proteome-comparison-reference-genome-card";
import { ProteomeComparisonComparisonGenomesCard } from "./proteome-comparison-comparison-genomes-card";

export default function ProteomeComparisonPage() {
  const [selectedCompGenomeId, setSelectedCompGenomeId] = useState<string>("");
  const [selectedCompFasta, setSelectedCompFasta] =
    useState<WorkspaceObject | null>(null);
  const [selectedCompFeatureGroup, setSelectedCompFeatureGroup] =
    useState<WorkspaceObject | null>(null);
  const [selectedCompGenomeGroup, setSelectedCompGenomeGroup] =
    useState<WorkspaceObject | null>(null);
  const [isLoadingGenomeGroup, setIsLoadingGenomeGroup] = useState(false);
  const [isLoadingCompGenome, setIsLoadingCompGenome] = useState(false);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);

  const form = useForm({
    defaultValues:
      defaultProteomeComparisonFormValues as ProteomeComparisonFormData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: { onChange: proteomeComparisonFormSchema as any },
    onSubmit: async ({ value }) => {
      await runtime.submitFormData(value as ProteomeComparisonFormData);
    },
  });

  const handleReset = useCallback(() => {
    form.reset(defaultProteomeComparisonFormValues);
    setSelectedCompGenomeId("");
    setSelectedCompFasta(null);
    setSelectedCompFeatureGroup(null);
    setSelectedCompGenomeGroup(null);
    setShowAdvancedParams(false);
  }, [form]);

  const runtime = useServiceRuntime({
    definition: proteomeComparisonService,
    form,
    onSuccess: handleReset,
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  const rawComparisonItems = useStore(
    form.store,
    (s) => s.values.comparison_items,
  );
  const comparisonItems = useMemo(
    () => rawComparisonItems || [],
    [rawComparisonItems],
  );
  const canSubmit = useStore(form.store, (s) => s.canSubmit);
  const totalGenomeCount = countTotalComparisonGenomes(comparisonItems);

  // Cross-field reference type change: sets ref_source_type and clears sibling fields
  const handleReferenceTypeChange = useCallback(
    (type: "genome" | "fasta" | "feature_group", value: string) => {
      form.setFieldValue("ref_source_type", type as never);
      if (type === "genome") {
        form.setFieldValue("ref_fasta_file", "" as never);
        form.setFieldValue("ref_feature_group", "" as never);
      } else if (type === "fasta") {
        form.setFieldValue("ref_genome_id", "" as never);
        form.setFieldValue("ref_genome_name", "" as never);
        form.setFieldValue("ref_feature_group", "" as never);
      } else {
        form.setFieldValue("ref_genome_id", "" as never);
        form.setFieldValue("ref_genome_name", "" as never);
        form.setFieldValue("ref_fasta_file", "" as never);
      }
      void value; // value used by caller (field.handleChange already called)
    },
    [form],
  );

  const handleAddCompGenome = useCallback(async () => {
    if (!selectedCompGenomeId || selectedCompGenomeId.trim() === "") {
      toast.error("No genome selected", {
        description: "Please select a genome before adding.",
        closeButton: true,
      });
      return;
    }

    if (totalGenomeCount >= maxComparisonGenomes) {
      toast.error("Maximum genomes reached", {
        description: `Maximum of ${maxComparisonGenomes} comparison genomes allowed.`,
        closeButton: true,
      });
      return;
    }

    const currentItems = form.state.values.comparison_items || [];

    if (isDuplicateComparisonItem(currentItems, { genome_id: selectedCompGenomeId })) {
      toast.error("Duplicate genome", {
        description: "This genome is already in the comparison list.",
        closeButton: true,
      });
      return;
    }

    setIsLoadingCompGenome(true);
    try {
      const genomes = await fetchGenomesByIds([selectedCompGenomeId]);
      const genomeName =
        genomes.length > 0 ? genomes[0].genome_name : selectedCompGenomeId;
      const newItem = createGenomeComparisonItem(selectedCompGenomeId, genomeName);
      form.setFieldValue("comparison_items", [...currentItems, newItem]);
      setSelectedCompGenomeId("");
    } catch {
      const newItem = createGenomeComparisonItem(selectedCompGenomeId, selectedCompGenomeId);
      form.setFieldValue("comparison_items", [...currentItems, newItem]);
      setSelectedCompGenomeId("");
    } finally {
      setIsLoadingCompGenome(false);
    }
  }, [selectedCompGenomeId, totalGenomeCount, form]);

  const handleAddCompFasta = useCallback(() => {
    if (!selectedCompFasta?.path) {
      toast.error("No FASTA file selected", {
        description: "Please select a protein FASTA file before adding.",
        closeButton: true,
      });
      return;
    }

    if (totalGenomeCount >= maxComparisonGenomes) {
      toast.error("Maximum genomes reached", {
        description: `Maximum of ${maxComparisonGenomes} comparison genomes allowed.`,
        closeButton: true,
      });
      return;
    }

    const currentItems = form.state.values.comparison_items || [];
    const newItem = createFastaComparisonItem(selectedCompFasta.path);

    if (isDuplicateComparisonItem(currentItems, newItem)) {
      toast.error("Duplicate file", {
        description: "This FASTA file is already in the comparison list.",
        closeButton: true,
      });
      return;
    }

    form.setFieldValue("comparison_items", [...currentItems, newItem]);
    setSelectedCompFasta(null);
  }, [selectedCompFasta, totalGenomeCount, form]);

  const handleAddCompFeatureGroup = useCallback(() => {
    if (!selectedCompFeatureGroup?.path) {
      toast.error("No feature group selected", {
        description: "Please select a feature group before adding.",
        closeButton: true,
      });
      return;
    }

    if (totalGenomeCount >= maxComparisonGenomes) {
      toast.error("Maximum genomes reached", {
        description: `Maximum of ${maxComparisonGenomes} comparison genomes allowed.`,
        closeButton: true,
      });
      return;
    }

    const currentItems = form.state.values.comparison_items || [];
    const newItem = createFeatureGroupComparisonItem(selectedCompFeatureGroup.path);

    if (isDuplicateComparisonItem(currentItems, newItem)) {
      toast.error("Duplicate feature group", {
        description: "This feature group is already in the comparison list.",
        closeButton: true,
      });
      return;
    }

    form.setFieldValue("comparison_items", [...currentItems, newItem]);
    setSelectedCompFeatureGroup(null);
  }, [selectedCompFeatureGroup, totalGenomeCount, form]);

  const handleAddCompGenomeGroup = useCallback(async () => {
    if (!selectedCompGenomeGroup?.path) {
      toast.error("No genome group selected", {
        description: "Please select a genome group before adding.",
        closeButton: true,
      });
      return;
    }

    setIsLoadingGenomeGroup(true);
    try {
      const genomeIds = await getGenomeIdsFromGroup(selectedCompGenomeGroup.path);

      if (genomeIds.length === 0) {
        toast.error("Empty genome group", {
          description: "The selected genome group has no genomes.",
          closeButton: true,
        });
        return;
      }

      const currentItems = form.state.values.comparison_items || [];
      const validation = validateGenomeGroupAddition(currentItems, genomeIds, maxComparisonGenomes);

      if (!validation.valid) {
        toast.error("Cannot add genome group", {
          description: validation.message,
          closeButton: true,
        });
        return;
      }

      const newItem = createGenomeGroupComparisonItem(selectedCompGenomeGroup.path, genomeIds);

      if (isDuplicateComparisonItem(currentItems, newItem)) {
        toast.error("Duplicate genome group", {
          description: "This genome group is already in the comparison list.",
          closeButton: true,
        });
        return;
      }

      form.setFieldValue("comparison_items", [...currentItems, newItem]);
      setSelectedCompGenomeGroup(null);
      toast.success(`Added genome group with ${genomeIds.length} genome(s)`, {
        closeButton: true,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add genome group";
      toast.error("Failed to add genome group", {
        description: errorMessage,
        closeButton: true,
      });
    } finally {
      setIsLoadingGenomeGroup(false);
    }
  }, [selectedCompGenomeGroup, form]);

  const handleRemoveComparisonItem = useCallback(
    (itemId: string) => {
      const currentItems = form.state.values.comparison_items || [];
      form.setFieldValue(
        "comparison_items",
        removeComparisonItemById(currentItems, itemId),
      );
    },
    [form],
  );

  return (
    <section>
      <ServiceHeader
        title="Proteome Comparison"
        description="The Proteome Comparison Service performs protein sequence-based genome
          comparison using bidirectional BLASTP. This service allows users to
          select genomes and compare them to a reference genome."
        infoPopupTitle={proteomeComparisonInfo.title}
        infoPopupDescription={proteomeComparisonInfo.description}
        quickReferenceGuide="https://www.bv-brc.org/docs/quick_references/services/proteome_comparison_service.html"
        tutorial="https://www.bv-brc.org/docs/tutorial/proteome_comparison/proteome_comparison.html"
        instructionalVideo="https://www.youtube.com/watch?v=UJak-ifQ9FE"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ProteomeComparisonParametersCard
              form={form}
              showAdvancedParams={showAdvancedParams}
              onShowAdvancedChange={setShowAdvancedParams}
            />

            <ProteomeComparisonReferenceGenomeCard
              form={form}
              onReferenceTypeChange={handleReferenceTypeChange}
            />
          </div>

          <ProteomeComparisonComparisonGenomesCard
            form={form}
            selectedCompGenomeId={selectedCompGenomeId}
            setSelectedCompGenomeId={setSelectedCompGenomeId}
            selectedCompFasta={selectedCompFasta}
            setSelectedCompFasta={setSelectedCompFasta}
            selectedCompFeatureGroup={selectedCompFeatureGroup}
            setSelectedCompFeatureGroup={setSelectedCompFeatureGroup}
            selectedCompGenomeGroup={selectedCompGenomeGroup}
            setSelectedCompGenomeGroup={setSelectedCompGenomeGroup}
            isLoadingGenomeGroup={isLoadingGenomeGroup}
            isLoadingCompGenome={isLoadingCompGenome}
            comparisonItems={comparisonItems}
            totalGenomeCount={totalGenomeCount}
            onAddCompGenome={handleAddCompGenome}
            onAddCompFasta={handleAddCompFasta}
            onAddCompFeatureGroup={handleAddCompFeatureGroup}
            onAddCompGenomeGroup={handleAddCompGenomeGroup}
            onRemoveComparisonItem={handleRemoveComparisonItem}
          />
        </div>

        <div className="service-form-controls">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Submit
          </Button>
        </div>
      </form>

      <JobParamsDialog {...jobParamsDialogProps} />
    </section>
  );
}
