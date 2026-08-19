"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import {
  defaultMetagenomicReadMappingFormValues,
  metagenomicReadMappingFormSchema,
  type LibraryItem,
} from "@/lib/forms/(metagenomics)/metagenomic-read-mapping/metagenomic-read-mapping-form-schema";
import { metagenomicReadMappingService } from "@/lib/forms/(metagenomics)/metagenomic-read-mapping/metagenomic-read-mapping-service";
import {
  buildBaseLibraryItem,
  getPairedLibraryName,
  getSingleLibraryName,
  useTanstackLibrarySelection,
} from "@/lib/forms/tanstack-library-selection";

export function useMetagenomicReadMappingController() {
  const [pairedRead1, setPairedRead1] = useState<string | null>(null);
  const [pairedRead2, setPairedRead2] = useState<string | null>(null);
  const [singleRead, setSingleRead] = useState<string | null>(null);
  const [sraResetKey, setSraResetKey] = useState(0);
  const [isOutputNameValid, setIsOutputNameValid] = useState(true);

  const form = useForm({
    defaultValues: defaultMetagenomicReadMappingFormValues,
    validators: { onChange: metagenomicReadMappingFormSchema },
    onSubmit: async ({ value }) => {
      await runtime.submitFormData(value);
    },
  });

  const outputPath = useSelector(
    form.store,
    (state) => state.values.output_path,
  );
  const geneSetType = useSelector(
    form.store,
    (state) => state.values.gene_set_type,
  );
  const canSubmit = useSelector(form.store, (state) => state.canSubmit);
  const {
    selectedLibraries,
    addPairedLibrary,
    addSingleLibrary,
    removeLibrary,
    setLibraries,
  } = useTanstackLibrarySelection<LibraryItem>({
    form,
    mapLibraryToItem: buildBaseLibraryItem,
    fields: {
      paired: "paired_end_libs",
      single: "single_end_libs",
      srr: "srr_ids",
    },
  });

  function handleReset() {
    form.reset(defaultMetagenomicReadMappingFormValues);
    setLibraries([]);
    setPairedRead1(null);
    setPairedRead2(null);
    setSingleRead(null);
    setSraResetKey((key) => key + 1);
  }

  const runtime = useServiceRuntime({
    definition: metagenomicReadMappingService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      syncLibraries: setLibraries,
    },
  });

  function handlePairedLibraryAdd() {
    addPairedLibrary({
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
    addSingleLibrary({
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
      onAfterAdd: () => {
        setSingleRead(null);
      },
    });
  }

  return {
    form,
    outputPath,
    geneSetType,
    canSubmit,
    pairedRead1,
    pairedRead2,
    singleRead,
    sraResetKey,
    isOutputNameValid,
    selectedLibraries,
    setPairedRead1,
    setPairedRead2,
    setSingleRead,
    setIsOutputNameValid,
    setLibraries,
    removeLibrary,
    handlePairedLibraryAdd,
    handleSingleLibraryAdd,
    handleReset,
    isSubmitting: runtime.isSubmitting,
    jobParamsDialogProps: runtime.jobParamsDialogProps,
  };
}

export type MetagenomicReadMappingController = ReturnType<
  typeof useMetagenomicReadMappingController
>;
