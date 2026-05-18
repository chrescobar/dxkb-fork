"use client";

import { useState, useCallback } from "react";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { useMetaCatsYearRanges } from "@/hooks/services/use-meta-cats-year-ranges";
import { useMetaCatsAutoGrouping } from "@/hooks/services/use-meta-cats-auto-grouping";
import { normalizeToArray } from "@/lib/rerun-utility";
import { useForm, useStore } from "@tanstack/react-form";
import { ServiceHeader } from "@/components/services/service-header";
import { Button } from "@/components/ui/button";
import {
  metaCATSInfo,
} from "@/lib/services/info/meta-cats";
import { WorkspaceObject } from "@/lib/services/workspace/types";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  metaCatsFormSchema,
  defaultMetaCatsFormValues,
  maxGroups,
  type MetaCatsFormData,
} from "@/lib/forms/(protein-tools)/meta-cats/meta-cats-form-schema";
import { metaCatsService } from "@/lib/forms/(protein-tools)/meta-cats/meta-cats-service";
import { MetaCatsParametersCard } from "./meta-cats-parameters-card";
import { MetaCatsInputCard } from "./meta-cats-input-card";

export default function MetaCATSPage() {
  const [selectedFeatureGroupObject, setSelectedFeatureGroupObject] =
    useState<WorkspaceObject | null>(null);

  const form = useForm({
    defaultValues: defaultMetaCatsFormValues as MetaCatsFormData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: { onChange: metaCatsFormSchema as any },
    onSubmit: async ({ value }) => {
      await runtime.submitFormData(value as MetaCatsFormData);
    },
  });

  const yearRanges = useMetaCatsYearRanges({
    form,
    yearRangesFieldName: "year_ranges",
  });

  const autoGrouping = useMetaCatsAutoGrouping({
    form,
    fields: {
      autoGroups: "auto_groups",
      metadataGroup: "metadata_group",
      yearRanges: "year_ranges",
    },
  });

  const handleReset = useCallback(() => {
    form.reset(defaultMetaCatsFormValues);
    setSelectedFeatureGroupObject(null);
    yearRanges.reset();
    autoGrouping.reset();
  }, [form, yearRanges, autoGrouping]);

  const canSubmit = useStore(form.store, (s) => s.canSubmit);

  const runtime = useServiceRuntime({
    definition: metaCatsService,
    form,
    onSuccess: handleReset,
    rerun: {
      onApply: (rerunData, form) => {
        if (typeof rerunData.p_value === "number") {
          form.setFieldValue("p_value", rerunData.p_value as never);
        }

        if (
          typeof rerunData.year_ranges === "string" &&
          rerunData.year_ranges.trim() !== ""
        ) {
          form.setFieldValue("year_ranges", rerunData.year_ranges as never);
          yearRanges.handleYearRangesChange(rerunData.year_ranges);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const autoGroupsRaw = normalizeToArray<any>(rerunData.auto_groups);
        if (autoGroupsRaw.length > 0) {
          const mappedAutoGroups: MetaCatsFormData["auto_groups"] =
            autoGroupsRaw.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (item: any) => ({
                id: crypto.randomUUID(),
                patric_id: item.patric_id ?? item.id ?? "",
                metadata: item.metadata ?? "",
                group: item.group ?? item.grp ?? "",
                genome_id: item.genome_id ?? item.g_id ?? "",
                strain: item.strain ?? "",
                genbank_accessions: item.genbank_accessions ?? "",
              }),
            );
          form.setFieldValue("auto_groups", mappedAutoGroups as never);
        }

        const groupsRaw = normalizeToArray<string>(rerunData.groups);
        if (groupsRaw.length > 0) {
          form.setFieldValue("groups", groupsRaw as never);
        }

        if (
          typeof rerunData.alignment_file === "string" &&
          rerunData.alignment_file.trim() !== ""
        ) {
          form.setFieldValue(
            "alignment_file",
            rerunData.alignment_file as never,
          );
        }
        if (
          typeof rerunData.group_file === "string" &&
          rerunData.group_file.trim() !== ""
        ) {
          form.setFieldValue("group_file", rerunData.group_file as never);
        }
      },
    },
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  const handleSelectAllRows = useCallback(
    (checked: boolean) => {
      const autoGroups = form.state.values.auto_groups || [];
      if (checked) {
        autoGrouping.setSelectedGridRows(
          new Set(autoGroups.map((item) => item.id)),
        );
      } else {
        autoGrouping.setSelectedGridRows(new Set());
      }
    },
    [form, autoGrouping],
  );

  const handleRowSelect = useCallback(
    (id: string) => {
      autoGrouping.setSelectedGridRows((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    },
    [autoGrouping],
  );

  const handleAddFeatureGroup = useCallback(() => {
    if (!selectedFeatureGroupObject?.path) return;

    const path = selectedFeatureGroupObject.path;
    const currentFeatureGroups = form.state.values.groups || [];

    if (currentFeatureGroups.includes(path)) return;
    if (currentFeatureGroups.length >= maxGroups) return;

    form.setFieldValue("groups", [...currentFeatureGroups, path]);
    setSelectedFeatureGroupObject(null);
  }, [selectedFeatureGroupObject, form]);

  const handleRemoveFeatureGroup = useCallback(
    (path: string) => {
      const currentFeatureGroups = form.state.values.groups || [];
      form.setFieldValue(
        "groups",
        currentFeatureGroups.filter((g) => g !== path),
      );
    },
    [form],
  );

  return (
    <section>
      <ServiceHeader
        title="Metadata-driven Comparative Analysis Tool (Meta-CATS)"
        description="The Meta-CATS tool looks for positions that significantly differ between user-defined groups of sequences.
          However, biological biases due to covariation, codon biases, and differences in genotype, geography, time of isolation,
          or others may affect the robustness of the underlying statistical assumptions."
        infoPopupTitle={metaCATSInfo.title}
        infoPopupDescription={metaCATSInfo.description}
        quickReferenceGuide="https://www.bv-brc.org/docs/quick_references/services/metacats.html"
        tutorial="https://www.bv-brc.org/docs/tutorial/metacats/metacats.html"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <MetaCatsParametersCard form={form} />

        <MetaCatsInputCard
          form={form}
          yearRanges={yearRanges}
          autoGrouping={autoGrouping}
          selectedFeatureGroupObject={selectedFeatureGroupObject}
          setSelectedFeatureGroupObject={setSelectedFeatureGroupObject}

          onSelectAllRows={handleSelectAllRows}
          onRowSelect={handleRowSelect}
          onAddFeatureGroup={handleAddFeatureGroup}
          onRemoveFeatureGroup={handleRemoveFeatureGroup}
        />

        <div className="service-form-controls">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? <Spinner /> : null}
            Submit
          </Button>
        </div>
      </form>

      <JobParamsDialog {...jobParamsDialogProps} />
    </section>
  );
}
