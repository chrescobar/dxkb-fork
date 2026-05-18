"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useState, useMemo, useEffect, useRef } from "react";
import { ServiceHeader } from "@/components/services/service-header";
import { Button } from "@/components/ui/button";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  useBlastDatabaseTypes,
  useBlastProgramTracking,
  useFastaValidation,
  resolveDbSource,
} from "@/lib/forms/(genomics)/blast/blast-form-utils";
import { blastService } from "@/lib/forms/(genomics)/blast/blast-service";
import {
  completeFormSchema,
  defaultBlastFormValues,
  type BlastFormData,
} from "@/lib/forms/(genomics)/blast/blast-form-schema";
import type { WorkspaceSelectorPreset } from "@/components/workspace/workspace-selector-presets";
import { blastServiceInfo } from "@/lib/services/info/blast";
import { BlastSearchProgramCard } from "./blast-search-program-card";
import { BlastInputSourceCard } from "./blast-input-source-card";
import { BlastParametersCard } from "./blast-parameters-card";

export default function BlastServicePage() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm({
    defaultValues: defaultBlastFormValues as BlastFormData,
    validators: { onChange: completeFormSchema, onSubmit: completeFormSchema },
    onSubmit: async ({ value }) => {
      const data = value as BlastFormData;

      if (data.input_source === "fasta_data" && data.input_fasta_data) {
        if (!isFastaValid) {
          const errorMessage =
            fastaValidationResult?.message || "Invalid FASTA data";
          toast.error(errorMessage);
          return;
        }
      }

      await runtime.submitFormData(data);
    },
  });

  const availableDatabaseTypes = useBlastDatabaseTypes(form);
  const currentBlastProgram = useBlastProgramTracking(form);
  const dbPrecomputedDatabase = useStore(
    form.store,
    (s) => s.values.db_precomputed_database,
  );
  const dbType = useStore(form.store, (s) => s.values.db_type);
  const inputSource = useStore(form.store, (s) => s.values.input_source);
  const canSubmit = useStore(form.store, (s) => s.canSubmit);
  const { fastaValidationResult, isFastaValid, handleFastaValidationChange } =
    useFastaValidation(form, currentBlastProgram);

  const dbFastaPreset = useMemo<WorkspaceSelectorPreset>(() => {
    if (dbPrecomputedDatabase !== "selFasta") return "featureFasta";
    return dbType === "faa" ? "featureProteinFasta" : "featureDnaFastaOrContigs";
  }, [dbPrecomputedDatabase, dbType]);

  const inputFastaPreset = useMemo<WorkspaceSelectorPreset>(() => {
    switch (currentBlastProgram) {
      case "blastp": return "featureProteinFasta";
      case "blastn": return "featureDnaFastaOrContigs";
      case "blastx": return "featureDnaFastaOrContigs";
      case "tblastn": return "featureProteinFasta";
      default: return "featureFasta";
    }
  }, [currentBlastProgram]);

  const previousProgramRef = useRef<BlastFormData["blast_program"]>(currentBlastProgram);
  const isApplyingRerunRef = useRef(false);

  useEffect(() => {
    const derivedInputType =
      currentBlastProgram === "blastp" || currentBlastProgram === "tblastn"
        ? "aa"
        : "dna";
    form.setFieldValue("input_type", derivedInputType);
  }, [currentBlastProgram, form]);

  useEffect(() => {
    const previousProgram = previousProgramRef.current;

    if (
      previousProgram !== currentBlastProgram &&
      previousProgram !== undefined &&
      !isApplyingRerunRef.current &&
      form.getFieldValue("input_fasta_file") !== ""
    ) {
      form.setFieldValue("input_fasta_file", "");
    }

    isApplyingRerunRef.current = false;
    previousProgramRef.current = currentBlastProgram;
  }, [currentBlastProgram, form]);

  const runtime = useServiceRuntime({
    definition: blastService,
    form,
    rerun: {
      onApply: (rerunData) => {
        if (rerunData.blast_program) {
          if (rerunData.blast_program !== form.state.values.blast_program) {
            isApplyingRerunRef.current = true;
          }
          form.setFieldValue("blast_program", rerunData.blast_program as never);
        }
        if (rerunData.db_precomputed_database) {
          const rawDb = String(rerunData.db_precomputed_database).replace(/_/g, "-");
          const dbPrecomp = rawDb as BlastFormData["db_precomputed_database"];
          form.setFieldValue("db_precomputed_database", dbPrecomp);
          form.setFieldValue("db_source", resolveDbSource(dbPrecomp));
        }
        if (rerunData.blast_max_hits != null) {
          form.setFieldValue("blast_max_hits", rerunData.blast_max_hits as number);
        }
        if (rerunData.blast_evalue_cutoff != null) {
          form.setFieldValue("blast_evalue_cutoff", Number(rerunData.blast_evalue_cutoff));
        }
      },
    },
  });

  const handleReset = () => {
    form.reset(defaultBlastFormValues);
    setShowAdvanced(false);
  };

  const handleInputSourceChange = (newSource: BlastFormData["input_source"]) => {
    const preservedFastaData = String(
      (form.state.values as Record<string, unknown>).input_fasta_data ?? "",
    );
    form.setFieldValue("input_fasta_data", "");
    form.setFieldValue("input_fasta_file", "");
    form.setFieldValue("input_feature_group", "");

    if (newSource === "fasta_data") {
      form.setFieldValue("input_fasta_data", preservedFastaData);
    }
  };

  const handleDatabaseSourceChange = (
    newDBPrecomputedDatabase: BlastFormData["db_precomputed_database"],
  ) => {
    form.setFieldValue("db_source", resolveDbSource(newDBPrecomputedDatabase));
    form.setFieldValue("db_genome_list", []);
    form.setFieldValue("db_genome_group", "");
    form.setFieldValue("db_feature_group", "");
    form.setFieldValue("db_taxon_list", []);
    form.setFieldValue("db_fasta_file", "");
  };

  return (
    <section>
      <ServiceHeader
        title="BLAST"
        description="The BLAST service uses BLAST (Basic Local Alignment Search Tool) to search against
          public or private genomes or other databases using DNA or protein sequence(s)."
        infoPopupTitle={blastServiceInfo.title}
        infoPopupDescription={blastServiceInfo.description}
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="service-form-section"
      >
        <BlastSearchProgramCard form={form} />

        <BlastInputSourceCard
          form={form}
          inputSource={inputSource}
          inputFastaPreset={inputFastaPreset}
          currentBlastProgram={currentBlastProgram}
          onInputSourceChange={handleInputSourceChange}
          onFastaValidationChange={(isValid, result) => handleFastaValidationChange(isValid, result)}
        />

        <BlastParametersCard
          form={form}
          dbPrecomputedDatabase={dbPrecomputedDatabase}
          availableDatabaseTypes={availableDatabaseTypes}
          currentBlastProgram={currentBlastProgram}
          dbFastaPreset={dbFastaPreset}
          showAdvanced={showAdvanced}
          onShowAdvancedChange={setShowAdvanced}
          onDatabaseSourceChange={handleDatabaseSourceChange}
        />

        <div className="service-form-controls">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="service-form-controls-button"
            >
              Reset
            </Button>
            <Button type="submit" disabled={runtime.isSubmitting || !canSubmit}>
              {runtime.isSubmitting ? <Spinner /> : null}
              Submit
            </Button>
          </div>
        </div>
      </form>

      <JobParamsDialog {...runtime.jobParamsDialogProps} />
    </section>
  );
}
