"use client";

import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";
import { useServicePageState } from "../../use-service-page-state";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import {
  defaultMetagenomicBinningFormValues,
  metagenomicBinningFormSchema,
  type LibraryItem,
} from "@/lib/forms/(metagenomics)/metagenomic-binning/metagenomic-binning-form-schema";
import { metagenomicBinningService } from "@/lib/forms/(metagenomics)/metagenomic-binning/metagenomic-binning-service";
import {
  buildBaseLibraryItem,
  getPairedLibraryName,
  getSingleLibraryName,
  useTanstackLibrarySelection,
} from "@/lib/forms/tanstack-library-selection";

export function useMetagenomicBinningController() {
  const [state, setState] = useServicePageState({
    showAdvanced: false,
    isOutputNameValid: true,
    pairedRead1: null as string | null,
    pairedRead2: null as string | null,
    singleRead: null as string | null,
    sraResetKey: 0,
  });
  const form = useForm({
    defaultValues: defaultMetagenomicBinningFormValues,
    validators: { onChange: metagenomicBinningFormSchema },
    onSubmit: async ({ value }) => runtime.submitFormData(value),
  });
  const outputPath = useSelector(
    form.store,
    (value) => value.values.output_path,
  );
  const startWith = useSelector(form.store, (value) => value.values.start_with);
  const assembler = useSelector(form.store, (value) => value.values.assembler);
  const canSubmit = useSelector(form.store, (value) => value.canSubmit);
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
    form.reset(defaultMetagenomicBinningFormValues);
    setLibraries([]);
    setState("showAdvanced")(false);
    setState("pairedRead1")(null);
    setState("pairedRead2")(null);
    setState("singleRead")(null);
    setState("sraResetKey")((key) => key + 1);
  }

  const runtime = useServiceRuntime({
    definition: metagenomicBinningService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      syncLibraries: setLibraries,
    },
  });
  const pairedCount = selectedLibraries.filter(
    (library) => library.type === "paired",
  ).length;
  const metaspadesDisabled = !(
    selectedLibraries.length === 1 && pairedCount === 1
  );

  useEffect(() => {
    if (metaspadesDisabled && assembler === "metaspades") {
      form.setFieldValue("assembler", "auto");
    }
  }, [metaspadesDisabled, assembler, form]);

  function handlePairedLibraryAdd() {
    addPairedLibrary({
      read1: state.pairedRead1,
      read2: state.pairedRead2,
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
        setState("pairedRead1")(null);
        setState("pairedRead2")(null);
      },
    });
  }

  function handleSingleLibraryAdd() {
    addSingleLibrary({
      read: state.singleRead,
      buildLibrary: (read) => ({
        library: {
          id: read,
          name: getSingleLibraryName(read),
          type: "single",
          files: [read],
        },
      }),
      onError: toast.error,
      onAfterAdd: () => { setState("singleRead")(null); },
    });
  }

  return {
    form,
    state,
    setState,
    outputPath,
    startWith,
    canSubmit,
    selectedLibraries,
    setLibraries,
    removeLibrary,
    metaspadesDisabled,
    handlePairedLibraryAdd,
    handleSingleLibraryAdd,
    handleReset,
    isSubmitting: runtime.isSubmitting,
    jobParamsDialogProps: runtime.jobParamsDialogProps,
  };
}

export type MetagenomicBinningController = ReturnType<
  typeof useMetagenomicBinningController
>;
