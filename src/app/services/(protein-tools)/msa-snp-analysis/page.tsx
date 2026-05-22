"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { useViralGenomeGroupValidation } from "@/hooks/services/use-viral-genome-group-validation";
import { normalizeToArray } from "@/lib/rerun-utility";
import { ServiceHeader } from "@/components/services/service-header";
import { Button } from "@/components/ui/button";
import { WorkspaceObject } from "@/lib/services/workspace/types";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  msaSNPAnalysisInfo,
} from "@/lib/services/info/msa-snp-analysis";
import * as MsaSnpAnalysis from "@/lib/forms/(protein-tools)/msa-snp-analysis/msa-snp-analysis-form-schema";
import * as MsaSnpAnalysisUtils from "@/lib/forms/(protein-tools)/msa-snp-analysis/msa-snp-analysis-form-utils";
import { msaSnpAnalysisService } from "@/lib/forms/(protein-tools)/msa-snp-analysis/msa-snp-analysis-service";
import { useMsaReferenceOptions } from "@/hooks/services/use-msa-reference-options";
import { MsaStartWithCard } from "./msa-start-with-card";
import { MsaSelectSequencesCard } from "./msa-select-sequences-card";
import { MsaReferenceSequenceCard } from "./msa-reference-sequence-card";
import { MsaParametersCard } from "./msa-parameters-card";

export default function MSAandSNPAnalysisPage() {
  const [selectedFastaObject, setSelectedFastaObject] =
    useState<WorkspaceObject | null>(null);
  const [selectedAlignedFastaObject, setSelectedAlignedFastaObject] =
    useState<WorkspaceObject | null>(null);
  const [fastaInputText, setFastaInputText] = useState<string>("");
  const [referenceFastaText, setReferenceFastaText] = useState<string>("");
  const [fastaValidationResult, setFastaValidationResult] = useState<{
    valid: boolean;
    message: string;
    numseq: number;
  } | null>(null);
  const [referenceFastaValidationResult, setReferenceFastaValidationResult] =
    useState<{
      valid: boolean;
      message: string;
      numseq: number;
    } | null>(null);
  const [showStrategy, setShowStrategy] = useState(false);

  const groupValidation = useViralGenomeGroupValidation({
    maxGenomes: MsaSnpAnalysis.maxGenomes,
    maxGenomeLength: MsaSnpAnalysis.maxGenomeLength,
  });

  function handleReset() {
    form.reset(MsaSnpAnalysis.defaultMsaSnpAnalysisFormValues);
    setSelectedFastaObject(null);
    setSelectedAlignedFastaObject(null);
    setFastaInputText("");
    setReferenceFastaText("");
    setFastaValidationResult(null);
    setReferenceFastaValidationResult(null);
    setShowStrategy(false);
    referenceOptions.reset();
    // Clear feature group selection
    form.setFieldValue("feature_groups", "");
  }

  const form = useForm({
    defaultValues:
      MsaSnpAnalysis.defaultMsaSnpAnalysisFormValues as MsaSnpAnalysis.MsaSnpAnalysisFormData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: { onChange: MsaSnpAnalysis.msaSnpAnalysisFormSchema as any },
    onSubmit: async ({ value }) => {
      await runtime.submitFormData(
        value as MsaSnpAnalysis.MsaSnpAnalysisFormData,
      );
    },
  });

  const referenceOptions = useMsaReferenceOptions({
    form,
    fields: {
      refType: "ref_type",
      featureGroupPath: "feature_groups",
      genomeGroupPaths: "select_genomegroup",
      refString: "ref_string",
    },
  });
  const { refType, setSelectedFeatureId, setSelectedGenomeId } = referenceOptions;

  const rawSelectGenomegroup = useStore(
    form.store,
    (s) => s.values.select_genomegroup,
  );
  const selectGenomegroup = useMemo(
    () => rawSelectGenomegroup || [],
    [rawSelectGenomegroup],
  );

  const inputStatus = useStore(form.store, (s) => s.values.input_status);
  const inputType = useStore(form.store, (s) => s.values.input_type);
  const aligner = useStore(form.store, (s) => s.values.aligner);
  const canSubmit = useStore(form.store, (s) => s.canSubmit);

  const runtime = useServiceRuntime({
    definition: msaSnpAnalysisService,
    form,
    onSuccess: handleReset,
    rerun: {
      onApply: (rerunData, form) => {
        const rawInputType = rerunData.input_type as string | undefined;
        if (rawInputType) {
          let inputTypeValue:
            | MsaSnpAnalysis.MsaSnpAnalysisFormData["input_type"]
            | undefined;
          if (rawInputType === "input_group") {
            inputTypeValue = "input_feature_group";
          } else if (rawInputType === "input_genomegroup") {
            inputTypeValue = "input_genome_group";
          } else if (
            rawInputType === "input_fasta" ||
            rawInputType === "input_sequence"
          ) {
            inputTypeValue =
              rawInputType as MsaSnpAnalysis.MsaSnpAnalysisFormData["input_type"];
          }
          if (inputTypeValue) {
            form.setFieldValue("input_type", inputTypeValue as never);
          }
        }

        const featureGroupsRaw = normalizeToArray<string>(
          rerunData.feature_groups,
        );
        if (featureGroupsRaw.length > 0) {
          form.setFieldValue("feature_groups", featureGroupsRaw[0] as never);
        }

        const selectGenomegroupRaw = normalizeToArray<string>(
          rerunData.select_genomegroup,
        );
        if (selectGenomegroupRaw.length > 0) {
          form.setFieldValue(
            "select_genomegroup",
            selectGenomegroupRaw as never,
          );
        }

        const fastaFilesRaw = normalizeToArray<MsaSnpAnalysis.FastaFileItem>(
          rerunData.fasta_files,
        );
        if (fastaFilesRaw.length > 0) {
          form.setFieldValue("fasta_files", fastaFilesRaw as never);
        }

        if (
          typeof rerunData.fasta_keyboard_input === "string" &&
          rerunData.fasta_keyboard_input.trim() !== ""
        ) {
          const text = rerunData.fasta_keyboard_input;
          setFastaInputText(text);
          form.setFieldValue("fasta_keyboard_input", text as never);
        }

        if (
          typeof rerunData.ref_string === "string" &&
          rerunData.ref_string.trim() !== ""
        ) {
          form.setFieldValue("ref_string", rerunData.ref_string as never);
          const resolvedRefType = rerunData.ref_type as string | undefined;
          if (resolvedRefType === "feature_id") {
            setSelectedFeatureId(rerunData.ref_string);
          } else if (resolvedRefType === "genome_id") {
            setSelectedGenomeId(rerunData.ref_string);
          } else if (resolvedRefType === "string") {
            setReferenceFastaText(rerunData.ref_string);
          }
        }

        if (rerunData.aligner === "Muscle") {
          form.setFieldValue("strategy", undefined as never);
        } else {
          const strategyVal = (rerunData.strategy ||
            rerunData.strategy_settings) as string | undefined;
          if (strategyVal && strategyVal.trim() !== "") {
            form.setFieldValue("strategy", strategyVal as never);
            setShowStrategy(true);
          }
        }
      },
    },
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  // Update strategy visibility based on aligner
  useEffect(() => {
    if (aligner === "Muscle" || inputStatus === "aligned") {
      queueMicrotask(() => setShowStrategy(false));
    }
  }, [aligner, inputStatus]);

  // Validate FASTA input when text changes
  useEffect(() => {
    if (!fastaInputText.trim()) {
      form.setFieldValue("fasta_keyboard_input", "");
      queueMicrotask(() => setFastaValidationResult(null));
      return;
    }

    const hasReference =
      refType === "string" && referenceFastaText.trim() !== "";
    const validation = MsaSnpAnalysisUtils.validateSequenceFasta(
      fastaInputText,
      hasReference,
    );

    queueMicrotask(() =>
      setFastaValidationResult({
        valid: validation.valid && validation.meetsMinSequenceRequirement,
        message: validation.meetsMinSequenceRequirement
          ? validation.message
          : `At least ${hasReference ? "one" : "two"} sequence(s) are required.`,
        numseq: validation.numseq,
      }),
    );

    if (validation.valid && validation.meetsMinSequenceRequirement) {
      form.setFieldValue("fasta_keyboard_input", validation.trimFasta);
    }
  }, [fastaInputText, refType, referenceFastaText, form]);

  // Validate reference FASTA input when text changes
  useEffect(() => {
    if (!referenceFastaText.trim()) {
      // Only clear ref_string when the "string" ref type controls it.
      // For "feature_id" / "genome_id", ref_string is set by the dropdown
      // and must not be wiped out (e.g. after a rerun pre-fill).
      if (refType === "string") {
        form.setFieldValue("ref_string", "");
      }
      queueMicrotask(() => setReferenceFastaValidationResult(null));
      return;
    }

    const validation =
      MsaSnpAnalysisUtils.validateReferenceFasta(referenceFastaText);

    queueMicrotask(() =>
      setReferenceFastaValidationResult({
        valid: validation.valid && validation.isSingleSequence,
        message: validation.isSingleSequence
          ? validation.message
          : "Only one sequence is allowed.",
        numseq: validation.numseq,
      }),
    );

    if (validation.valid && validation.isSingleSequence) {
      form.setFieldValue("ref_string", validation.trimFasta);
    }
  }, [referenceFastaText, refType, form]);

  // Determine which reference options are available
  const availableRefTypes =
    useMemo((): MsaSnpAnalysis.MsaSnpAnalysisFormData["ref_type"][] => {
      if (inputStatus === "aligned") {
        return ["none", "first"];
      }

      if (inputType === "input_feature_group") {
        return ["none", "feature_id", "string"];
      }

      if (inputType === "input_genome_group") {
        return ["none", "genome_id", "string"];
      }

      if (inputType === "input_fasta" || inputType === "input_sequence") {
        return ["none", "first", "string"];
      }

      return ["none", "string"];
    }, [inputStatus, inputType]);

  // Called by MsaStartWithCard when input_status changes
  const handleStatusChange = (prevStatus: string, newStatus: string) => {
    if (newStatus === "aligned") {
      form.setFieldValue("input_type", undefined);
    } else {
      form.setFieldValue("input_type", "input_feature_group");
    }
    if (prevStatus !== newStatus) {
      form.setFieldValue("ref_type", "none");
      form.setFieldValue("ref_string", "");
      referenceOptions.setSelectedFeatureId("");
      referenceOptions.setSelectedGenomeId("");
      setReferenceFastaText("");
    }
  };

  const handleAlignerChange = useCallback(
    (newAligner: MsaSnpAnalysis.MsaSnpAnalysisFormData["aligner"]) => {
      form.setFieldValue("aligner", newAligner as never);
      if (newAligner === "Muscle") {
        form.setFieldValue("strategy", undefined as never);
        setShowStrategy(false);
      } else {
        form.setFieldValue("strategy", "auto" as never);
      }
    },
    [form],
  );

  // Called by MsaSelectSequencesCard when input_type changes
  const handleInputTypeChange = (prevType: string | undefined, newType: string) => {
    if (prevType !== newType) {
      form.setFieldValue("ref_type", "none");
      form.setFieldValue("ref_string", "");
      referenceOptions.setSelectedFeatureId("");
      referenceOptions.setSelectedGenomeId("");
      setReferenceFastaText("");
    }
  };

  const handleInputGenomeGroupSelect = async (object: WorkspaceObject | null) => {
    if (!object?.path) return;
    const result = await groupValidation.validate(object.path);
    if (result.status === "ok") {
      form.setFieldValue("select_genomegroup", [object.path] as never);
    }
  };

  return (
    <section>
      <ServiceHeader
        title="MSA & SNP / Variation Analysis"
        description="The Multiple Sequence Alignment and SNP / Variation Analysis Service
          allows users to choose an alignment algorithm to align sequences selected from a search result,
          a FASTA file saved to the workspace, or through simply cutting and pasting.
          The service can also be used for variation and SNP analysis with feature groups, FASTA files, aligned FASTA files, and user input FASTA records."
        infoPopupTitle={msaSNPAnalysisInfo.title}
        infoPopupDescription={msaSNPAnalysisInfo.description}
        quickReferenceGuide="https://www.bv-brc.org/docs/quick_references/services/msa_snp_variation_service.html"
        tutorial="https://www.bv-brc.org/docs/tutorial/msa_snp_variation/msa_snp_variation.html"
        instructionalVideo="https://www.youtube.com/watch?v=ea6GboAZPQs"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <MsaStartWithCard
          form={form}
          onStatusChange={handleStatusChange}
        />

        <MsaSelectSequencesCard
          form={form}
          inputStatus={inputStatus}
          fastaInputText={fastaInputText}
          setFastaInputText={setFastaInputText}
          fastaValidationResult={fastaValidationResult}
          selectedFastaObject={selectedFastaObject}
          setSelectedFastaObject={setSelectedFastaObject}
          selectedAlignedFastaObject={selectedAlignedFastaObject}
          setSelectedAlignedFastaObject={setSelectedAlignedFastaObject}
          isValidatingGenomeGroup={groupValidation.isValidating}
          selectGenomegroup={selectGenomegroup}
          onGenomeGroupSelect={handleInputGenomeGroupSelect}
          onInputTypeChange={handleInputTypeChange}

        />

        <MsaReferenceSequenceCard
          form={form}
          referenceOptions={referenceOptions}
          availableRefTypes={availableRefTypes}
          selectGenomegroup={selectGenomegroup}
          referenceFastaText={referenceFastaText}
          setReferenceFastaText={setReferenceFastaText}
          referenceFastaValidationResult={referenceFastaValidationResult}
        />

        <MsaParametersCard
          form={form}
          inputStatus={inputStatus}
          showStrategy={showStrategy}
          setShowStrategy={setShowStrategy}
          onAlignerChange={handleAlignerChange}
        />

        {/* Form Controls */}
        <div className="service-form-controls">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit}
          >
            {isSubmitting ? <Spinner /> : null}
            Submit
          </Button>
        </div>
      </form>

      <JobParamsDialog {...jobParamsDialogProps} />
    </section>
  );
}
