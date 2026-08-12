"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ServiceHeader } from "@/components/services/service-header";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { blastServiceInfo } from "@/lib/services/info/blast";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { blastService } from "@/lib/forms/(genomics)/blast/blast-service";
import {
  completeFormSchema,
  defaultBlastFormValues,
  type BlastFormData,
} from "@/lib/forms/(genomics)/blast/blast-form-schema";
import {
  resolveDbSource,
  useBlastDatabaseTypes,
  useBlastProgramTracking,
  useFastaValidation,
} from "@/lib/forms/(genomics)/blast/blast-form-utils";
import type { WorkspaceSelectorPreset } from "@/components/workspace/workspace-selector-presets";
import {
  BlastParameters,
  InputSourceCard,
  SearchProgramCard,
} from "./blast-sections";

function useBlastForm(submit: (value: BlastFormData) => Promise<void>) {
  return useForm({
    defaultValues: defaultBlastFormValues as BlastFormData,
    validators: { onChange: completeFormSchema, onSubmit: completeFormSchema },
    onSubmit: async ({ value }) => submit(value),
  });
}
export type BlastForm = ReturnType<typeof useBlastForm>;

export default function BlastServicePage() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOutputNameValid, setIsOutputNameValid] = useState(true);
  const submitRef = useRef<(data: BlastFormData) => Promise<void>>(() =>
    Promise.resolve(),
  );
  const form = useBlastForm((data) => submitRef.current(data));
  const program = useBlastProgramTracking(form);
  const databaseTypes = useBlastDatabaseTypes(form);
  const database = useSelector(
    form.store,
    (state) => state.values.db_precomputed_database,
  );
  const dbType = useSelector(form.store, (state) => state.values.db_type);
  const source = useSelector(form.store, (state) => state.values.input_source);
  const outputPath = useSelector(
    form.store,
    (state) => state.values.output_path,
  );
  const canSubmit = useSelector(form.store, (state) => state.canSubmit);
  const { fastaValidationResult, isFastaValid, handleFastaValidationChange } =
    useFastaValidation(form, program);
  const previousProgram = useRef(program);
  const applyingRerun = useRef(false);
  useEffect(() => {
    form.setFieldValue(
      "input_type",
      program === "blastp" || program === "tblastn" ? "aa" : "dna",
    );
  }, [program, form]);
  useEffect(() => {
    if (
      previousProgram.current !== program &&
      !applyingRerun.current &&
      form.getFieldValue("input_fasta_file")
    )
      form.setFieldValue("input_fasta_file", "");
    applyingRerun.current = false;
    previousProgram.current = program;
  }, [program, form]);
  const runtime = useServiceRuntime({
    definition: blastService,
    form,
    rerun: {
      onApply: (data) => {
        if (data.blast_program) {
          if (data.blast_program !== form.state.values.blast_program)
            applyingRerun.current = true;
          form.setFieldValue("blast_program", data.blast_program as never);
        }
        if (data.db_precomputed_database) {
          const db = (data.db_precomputed_database as string).replace(
            /_/g,
            "-",
          ) as BlastFormData["db_precomputed_database"];
          form.setFieldValue("db_precomputed_database", db);
          form.setFieldValue("db_source", resolveDbSource(db));
        }
        if (data.blast_max_hits != null)
          form.setFieldValue("blast_max_hits", data.blast_max_hits as number);
        if (data.blast_evalue_cutoff != null)
          form.setFieldValue(
            "blast_evalue_cutoff",
            Number(data.blast_evalue_cutoff),
          );
      },
    },
  });
  useEffect(() => {
    submitRef.current = async (data) => {
      if (
        data.input_source === "fasta_data" &&
        data.input_fasta_data &&
        !isFastaValid
      ) {
        toast.error(fastaValidationResult?.message || "Invalid FASTA data");
        return;
      }
      await runtime.submitFormData(data);
    };
  }, [runtime, isFastaValid, fastaValidationResult]);
  const changeSource = (next: BlastFormData["input_source"]) => {
    const fasta =
      next === "fasta_data" ? form.getFieldValue("input_fasta_data") : "";
    form.setFieldValue("input_fasta_data", "");
    form.setFieldValue("input_fasta_file", "");
    form.setFieldValue("input_feature_group", "");
    if (next === "fasta_data") form.setFieldValue("input_fasta_data", fasta);
  };
  const changeDatabase = (next: BlastFormData["db_precomputed_database"]) => {
    form.setFieldValue("db_source", resolveDbSource(next));
    form.setFieldValue("db_genome_list", []);
    form.setFieldValue("db_genome_group", "");
    form.setFieldValue("db_feature_group", "");
    form.setFieldValue("db_taxon_list", []);
    form.setFieldValue("db_fasta_file", "");
  };
  const inputPreset: WorkspaceSelectorPreset =
    program === "blastp" || program === "tblastn"
      ? "featureProteinFasta"
      : "featureDnaFastaOrContigs";
  const dbPreset: WorkspaceSelectorPreset =
    database !== "selFasta"
      ? "featureFasta"
      : dbType === "faa"
        ? "featureProteinFasta"
        : "featureDnaFastaOrContigs";

  return (
    <section>
      <ServiceHeader
        title="BLAST"
        description="The BLAST service uses BLAST (Basic Local Alignment Search Tool) to search against public or private genomes or other databases using DNA or protein sequence(s)."
        infoPopupTitle={blastServiceInfo.title}
        infoPopupDescription={blastServiceInfo.description}
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />
      <form action={() => form.handleSubmit()} className="service-form-section">
        <SearchProgramCard form={form} />
        <InputSourceCard
          form={form}
          source={source}
          program={program}
          preset={inputPreset}
          onSourceChange={changeSource}
          onValidationChange={handleFastaValidationChange}
        />
        <BlastParameters
          form={form}
          database={database}
          dbPreset={dbPreset}
          databaseTypes={databaseTypes}
          outputPath={outputPath}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          onDatabaseChange={changeDatabase}
          onOutputValidationChange={setIsOutputNameValid}
        />
        <div className="service-form-controls">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset(defaultBlastFormValues);
                setShowAdvanced(false);
              }}
              className="service-form-controls-button"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={
                runtime.isSubmitting || !canSubmit || !isOutputNameValid
              }
            >
              {runtime.isSubmitting ? <Spinner /> : null}Submit
            </Button>
          </div>
        </div>
      </form>
      <JobParamsDialog {...runtime.jobParamsDialogProps} />
    </section>
  );
}
