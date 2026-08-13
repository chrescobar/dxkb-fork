"use client";

import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";
import { useServicePageState } from "../../use-service-page-state";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import {
  defaultTaxonomicClassificationFormValues,
  sixteenSAnalysisTypeOptions,
  sixteenSDatabaseOptions,
  taxonomicClassificationFormSchema,
  wgsAnalysisTypeOptions,
  wgsDatabaseOptions,
  type LibraryItem,
} from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-form-schema";
import {
  getDefaultAnalysisType,
  getDefaultDatabase,
} from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-form-utils";
import { taxonomicClassificationService } from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-service";
import {
  assignSampleIdToNewSraLibraries,
  extractSampleIdFromPath,
  mapLibraryToSampleIdItem,
  mapSraLibraryToSampleIdItem,
} from "@/lib/forms/service-library-rules";
import {
  findNewSraLibraries,
  getPairedLibraryName,
  getSingleLibraryName,
  useTanstackLibrarySelection,
} from "@/lib/forms/tanstack-library-selection";
import type { Library } from "@/types/services";

export function useTaxonomicClassificationController() {
  const [state, setState] = useServicePageState({
    pairedRead1: null as string | null,
    pairedRead2: null as string | null,
    singleRead: null as string | null,
    sraResetKey: 0,
    pairedSampleId: "",
    singleSampleId: "",
    srrSampleId: "",
    isOutputNameValid: true,
  });
  const form = useForm({
    defaultValues: defaultTaxonomicClassificationFormValues,
    validators: { onChange: taxonomicClassificationFormSchema },
    onSubmit: async ({ value }) => runtime.submitFormData(value),
  });
  const outputPath = useSelector(
    form.store,
    (value) => value.values.output_path,
  );
  const sequenceType = useSelector(
    form.store,
    (value) => value.values.sequence_type,
  );
  const canSubmit = useSelector(form.store, (value) => value.canSubmit);

  useEffect(() => {
    const analysisTypeIsValid =
      sequenceType === "wgs"
        ? form.state.values.analysis_type === "microbiome" ||
          form.state.values.analysis_type === "pathogen"
        : form.state.values.analysis_type === "default";
    if (!analysisTypeIsValid) {
      form.setFieldValue(
        "analysis_type",
        getDefaultAnalysisType(sequenceType) as
          "microbiome" | "pathogen" | "default",
      );
    }
    const databaseIsValid =
      sequenceType === "wgs"
        ? form.state.values.database === "bvbrc" ||
          form.state.values.database === "standard"
        : form.state.values.database === "SILVA" ||
          form.state.values.database === "Greengenes";
    if (!databaseIsValid) {
      form.setFieldValue(
        "database",
        getDefaultDatabase(sequenceType) as
          "bvbrc" | "standard" | "SILVA" | "Greengenes",
      );
    }
    if (sequenceType === "16s") form.setFieldValue("host_genome", "no_host");
  }, [sequenceType, form]);

  const {
    selectedLibraries,
    addPairedLibrary,
    addSingleLibrary,
    removeLibrary,
    setLibraries,
  } = useTanstackLibrarySelection<
    LibraryItem,
    { srr_accession: string; sample_id: string; title?: string }
  >({
    form,
    mapLibraryToItem: mapLibraryToSampleIdItem,
    mapSraLibraryToItem: mapSraLibraryToSampleIdItem,
    fields: {
      paired: "paired_end_libs",
      single: "single_end_libs",
      srr: "srr_libs",
    },
    normalizeLibraries: (next, previous) =>
      assignSampleIdToNewSraLibraries(next, previous, state.srrSampleId),
  });

  function handleReset() {
    form.reset(defaultTaxonomicClassificationFormValues);
    setLibraries([]);
    setState("pairedRead1")(null);
    setState("pairedRead2")(null);
    setState("singleRead")(null);
    setState("pairedSampleId")("");
    setState("singleSampleId")("");
    setState("srrSampleId")("");
    setState("sraResetKey")((key) => key + 1);
  }

  const runtime = useServiceRuntime({
    definition: taxonomicClassificationService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      getLibraryExtra: (library, kind) => {
        if (kind === "paired")
          return {
            sampleId:
              library.sample_id ||
              extractSampleIdFromPath(library.read1, "sample"),
          };
        if (kind === "single")
          return {
            sampleId:
              library.sample_id ||
              extractSampleIdFromPath(library.read, "sample"),
          };
        return { sampleId: library.sample_id || "" };
      },
      syncLibraries: setLibraries,
    },
  });

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
          sampleId:
            state.pairedSampleId.trim() ||
            extractSampleIdFromPath(read1, "sample"),
        },
      }),
      onError: toast.error,
      onAfterAdd: (library) => {
        const fallback = library.files?.[0]
          ? extractSampleIdFromPath(library.files[0], "sample")
          : "sample";
        form.setFieldValue(
          "paired_sample_id",
          state.pairedSampleId.trim() || fallback,
        );
        setState("pairedRead1")(null);
        setState("pairedRead2")(null);
        setState("pairedSampleId")("");
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
          sampleId:
            state.singleSampleId.trim() ||
            extractSampleIdFromPath(read, "sample"),
        },
      }),
      onError: toast.error,
      onAfterAdd: (library) => {
        const fallback = library.files?.[0]
          ? extractSampleIdFromPath(library.files[0], "sample")
          : "sample";
        form.setFieldValue(
          "single_sample_id",
          state.singleSampleId.trim() || fallback,
        );
        setState("singleRead")(null);
        setState("singleSampleId")("");
      },
    });
  }

  function handleSampleIdChange(
    type: "paired" | "single" | "srr",
    value: string,
  ) {
    const config = {
      paired: {
        setter: setState("pairedSampleId"),
        field: "paired_sample_id" as const,
      },
      single: {
        setter: setState("singleSampleId"),
        field: "single_sample_id" as const,
      },
      srr: { setter: setState("srrSampleId"), field: "srr_sample_id" as const },
    };
    config[type].setter(value);
    form.setFieldValue(config[type].field, value);
  }

  function handleSetSelectedLibraries(libraries: Library[]) {
    const newSraLibraries = findNewSraLibraries(libraries, selectedLibraries);
    setLibraries(libraries);
    if (newSraLibraries.length > 0) {
      const last = newSraLibraries[newSraLibraries.length - 1];
      form.setFieldValue("srr_sample_id", state.srrSampleId.trim() || last.id);
      setState("srrSampleId")("");
    }
  }

  return {
    form,
    state,
    setState,
    outputPath,
    sequenceType,
    canSubmit,
    selectedLibraries,
    removeLibrary,
    handlePairedLibraryAdd,
    handleSingleLibraryAdd,
    handleSampleIdChange,
    handleSetSelectedLibraries,
    handleReset,
    analysisTypeOptions:
      sequenceType === "wgs"
        ? wgsAnalysisTypeOptions
        : sixteenSAnalysisTypeOptions,
    databaseOptions:
      sequenceType === "wgs" ? wgsDatabaseOptions : sixteenSDatabaseOptions,
    isSubmitting: runtime.isSubmitting,
    jobParamsDialogProps: runtime.jobParamsDialogProps,
  };
}

export type TaxonomicClassificationController = ReturnType<
  typeof useTaxonomicClassificationController
>;
