"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import {
  defaultVariationAnalysisFormValues,
  variationAnalysisFormSchema,
  type VariationLibraryItem,
} from "@/lib/forms/(genomics)/variation-analysis/variation-analysis-form-schema";
import { variationAnalysisService } from "@/lib/forms/(genomics)/variation-analysis/variation-analysis-service";
import {
  buildBaseLibraryItem,
  getPairedLibraryName,
  getSingleLibraryName,
  useTanstackLibrarySelection,
} from "@/lib/forms/tanstack-library-selection";

export function useVariationAnalysisForm() {
  const [pairedRead1, setPairedRead1] = useState<string | null>(null);
  const [pairedRead2, setPairedRead2] = useState<string | null>(null);
  const [singleRead, setSingleRead] = useState<string | null>(null);
  const [isOutputNameValid, setIsOutputNameValid] = useState(true);
  const [sraResetKey, setSraResetKey] = useState(0);

  const form = useForm({
    defaultValues: defaultVariationAnalysisFormValues,
    validators: { onChange: variationAnalysisFormSchema },
    onSubmit: async ({ value }) => {
      const hasLibrary =
        Boolean(value.paired_end_libs?.length) ||
        Boolean(value.single_end_libs?.length) ||
        Boolean(value.srr_ids?.length);
      if (!hasLibrary) {
        toast.error("At least one library must be selected");
        return;
      }
      await runtime.submitFormData(value);
    },
  });

  const selection = useTanstackLibrarySelection<VariationLibraryItem>({
    form,
    mapLibraryToItem: buildBaseLibraryItem,
    fields: {
      paired: "paired_end_libs",
      single: "single_end_libs",
      srr: "srr_ids",
    },
  });

  const runtime = useServiceRuntime({
    definition: variationAnalysisService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      syncLibraries: selection.setLibraries,
    },
  });
  const outputPath = useSelector(
    form.store,
    (state) => state.values.output_path,
  );
  const canSubmit = useSelector(form.store, (state) => state.canSubmit);

  function handleReset() {
    form.reset(defaultVariationAnalysisFormValues);
    selection.setLibraries([]);
    setPairedRead1(null);
    setPairedRead2(null);
    setSingleRead(null);
    setSraResetKey((key) => key + 1);
  }

  function handlePairedLibraryAdd() {
    selection.addPairedLibrary({
      read1: pairedRead1,
      read2: pairedRead2,
      buildLibrary: (read1, read2, id) => ({
        library: {
          id,
          name: getPairedLibraryName(read1, read2),
          type: "paired",
          files: [read1, read2],
        },
      }),
      onError: toast.error,
      onAfterAdd: () => {
        setPairedRead1(null);
        setPairedRead2(null);
      },
    });
  }

  function handleSingleLibraryAdd() {
    selection.addSingleLibrary({
      read: singleRead,
      buildLibrary: (read) => ({
        library: {
          id: read,
          name: getSingleLibraryName(read),
          type: "single",
          files: [read],
        },
      }),
      onError: toast.error,
      onAfterAdd: () => { setSingleRead(null); },
    });
  }

  return {
    form,
    runtime,
    ...selection,
    pairedRead1,
    pairedRead2,
    singleRead,
    sraResetKey,
    outputPath,
    canSubmit,
    isOutputNameValid,
    setPairedRead1,
    setPairedRead2,
    setSingleRead,
    setIsOutputNameValid,
    handlePairedLibraryAdd,
    handleSingleLibraryAdd,
    handleReset,
  };
}

export type VariationAnalysisController = ReturnType<
  typeof useVariationAnalysisForm
>;
