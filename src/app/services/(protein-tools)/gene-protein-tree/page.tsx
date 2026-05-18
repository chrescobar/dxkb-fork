"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useState, useMemo, useEffect, useRef } from "react";
import { ServiceHeader } from "@/components/services/service-header";
import { Button } from "@/components/ui/button";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { normalizeToArray } from "@/lib/rerun-utility";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import type { WorkspaceSelectorPreset } from "@/components/workspace/workspace-selector-presets";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import {
  defaultMetadataFields,
  type GeneProteinTreeFormData,
  defaultGeneProteinTreeFormValues,
  geneProteinTreeFormSchema,
  dnaModels,
  proteinModels,
  type SequenceItem,
  getMetadataSelectOptions,
  isMetadataLabel,
} from "@/lib/forms/(protein-tools)/gene-protein-tree/gene-protein-tree-form-schema";
import {
  formatMetadataLabel,
  getSequenceTypeLabel,
  type Alphabet,
  checkDuplicateSequence,
  checkSequenceLimit,
  createSequenceItem,
  removeSequenceAtIndex,
  createMetadataField,
  getDisplayName,
} from "@/lib/forms/(protein-tools)/gene-protein-tree/gene-protein-tree-form-utils";
import { geneProteinTreeService } from "@/lib/forms/(protein-tools)/gene-protein-tree/gene-protein-tree-service";
import { phylogeneticTreeInfo } from "@/lib/services/info/phylogenetic-tree";
import { GeneProteinTreeInputCard } from "./gene-protein-tree-input-card";
import { AlignmentParametersCard } from "@/components/services/alignment-parameters-card";
import { GeneProteinTreeTreeParametersCard } from "./gene-protein-tree-tree-parameters-card";
import { GeneProteinTreeMetadataOptions } from "./gene-protein-tree-metadata-options";

interface MetadataField {
  id: string;
  name: string;
  selected: boolean;
}

export default function GeneProteinTreePage() {
  const [selectedFeatureGroupObject, setSelectedFeatureGroupObject] =
    useState<WorkspaceObject | null>(null);
  const [selectedAlignedFastaObject, setSelectedAlignedFastaObject] =
    useState<WorkspaceObject | null>(null);
  const [selectedUnalignedFastaObject, setSelectedUnalignedFastaObject] =
    useState<WorkspaceObject | null>(null);
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>(
    defaultMetadataFields,
  );
  const [selectedMetadataField, setSelectedMetadataField] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm({
    defaultValues: defaultGeneProteinTreeFormValues as GeneProteinTreeFormData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: { onChange: geneProteinTreeFormSchema as any },
    onSubmit: async ({ value }) => {
      await runtime.submitFormData(value as GeneProteinTreeFormData);
    },
  });

  const alphabet = useStore(form.store, (s) => s.values.alphabet);
  const sequences = useStore(form.store, (s) => s.values.sequences);
  const canSubmit = useStore(form.store, (s) => s.canSubmit);

  const substitutionModelOptions = useMemo(
    () => (alphabet === "DNA" ? dnaModels : proteinModels),
    [alphabet],
  );

  const skipAlphabetEffect = useRef(false);
  const prevAlphabetRef = useRef(alphabet);

  useEffect(() => {
    const alphabetChanged = prevAlphabetRef.current !== alphabet;
    prevAlphabetRef.current = alphabet;

    if (!alphabetChanged) return;

    if (skipAlphabetEffect.current) {
      skipAlphabetEffect.current = false;
      return;
    }

    const resetModel =
      alphabet === "DNA" ? dnaModels[0].value : proteinModels[0].value;
    form.setFieldValue("substitution_model", resetModel);

    const isDNA = alphabet === "DNA";
    const validTypes = isDNA
      ? ["feature_group", "aligned_dna_fasta", "feature_dna_fasta"]
      : ["feature_group", "aligned_protein_fasta", "feature_protein_fasta"];

    const filteredSequences = sequences.filter((seq) =>
      validTypes.includes(seq.type),
    );

    if (filteredSequences.length !== sequences.length) {
      form.setFieldValue("sequences", filteredSequences);
      toast.info("Switched alphabet. Cleared incompatible sequences.");
    }

    queueMicrotask(() => {
      setSelectedAlignedFastaObject(null);
      setSelectedUnalignedFastaObject(null);
    });
  }, [alphabet, form, sequences]);

  useEffect(() => {
    const selectedFields = metadataFields
      .filter((field) => field.selected)
      .map((field) => field.id);
    form.setFieldValue("metadata_fields", selectedFields);
  }, [metadataFields, form]);

  const runtime = useServiceRuntime({
    definition: geneProteinTreeService,
    form,
    onSuccess: handleReset,
    rerun: {
      onApply: (rerunData) => {
        if (rerunData.alphabet) {
          if (rerunData.alphabet !== form.state.values.alphabet) {
            skipAlphabetEffect.current = true;
          }
          form.setFieldValue(
            "alphabet",
            rerunData.alphabet as GeneProteinTreeFormData["alphabet"],
          );
        }
        if (rerunData.trim_threshold != null) {
          form.setFieldValue("trim_threshold", String(rerunData.trim_threshold));
        }
        if (rerunData.gap_threshold != null) {
          form.setFieldValue("gap_threshold", String(rerunData.gap_threshold));
        }

        const seqs = normalizeToArray<SequenceItem>(rerunData.sequences);
        if (seqs.length > 0) {
          form.setFieldValue("sequences", seqs);
        }

        const featureFields = normalizeToArray<string>(rerunData.feature_metadata_fields);
        const genomeFields = normalizeToArray<string>(rerunData.genome_metadata_fields);
        const allMetadataFieldIds = [...featureFields, ...genomeFields];
        if (allMetadataFieldIds.length > 0) {
          setMetadataFields(allMetadataFieldIds.map((id) => createMetadataField(id)));
        }
      },
    },
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  const selectedMetadataIds = useMemo(
    () => new Set(metadataFields.filter((f) => f.selected).map((f) => f.id)),
    [metadataFields],
  );

  const availableMetadataOptions = useMemo(() => {
    const allOptions = getMetadataSelectOptions(formatMetadataLabel);
    return allOptions.filter(
      (option) => option.isLabel || !selectedMetadataIds.has(option.value),
    );
  }, [selectedMetadataIds]);

  const alignedFastaPreset: WorkspaceSelectorPreset =
    alphabet === "DNA" ? "alignedDnaFasta" : "alignedProteinFasta";
  const unalignedFastaPreset: WorkspaceSelectorPreset =
    alphabet === "DNA" ? "featureDnaFasta" : "featureProteinFasta";

  function handleAddSequence(source: "feature" | "aligned" | "unaligned") {
    let selectedObject: WorkspaceObject | null = null;
    let type: SequenceItem["type"];

    if (source === "feature") {
      selectedObject = selectedFeatureGroupObject;
      type = "feature_group";
    } else if (source === "aligned") {
      selectedObject = selectedAlignedFastaObject;
      type = alphabet === "DNA" ? "aligned_dna_fasta" : "aligned_protein_fasta";
    } else {
      selectedObject = selectedUnalignedFastaObject;
      type = alphabet === "DNA" ? "feature_dna_fasta" : "feature_protein_fasta";
    }

    if (!selectedObject?.path) {
      toast.error("No object selected", {
        description: "Please select a workspace object before adding.",
        closeButton: true,
      });
      return;
    }

    const currentSequences = form.state.values.sequences;

    if (checkDuplicateSequence(currentSequences, selectedObject.path, type)) {
      toast.error("Duplicate selection detected", {
        description: `${getSequenceTypeLabel(type, alphabet as Alphabet)} is already selected.`,
        closeButton: true,
      });
      return;
    }

    if (checkSequenceLimit(currentSequences)) {
      toast.error("Selection limit reached", {
        description: "A maximum of 5000 sequences can be added.",
        closeButton: true,
      });
      return;
    }

    form.setFieldValue("sequences", [
      ...currentSequences,
      createSequenceItem(selectedObject.path, type),
    ]);

    if (source === "feature") setSelectedFeatureGroupObject(null);
    if (source === "aligned") setSelectedAlignedFastaObject(null);
    if (source === "unaligned") setSelectedUnalignedFastaObject(null);
  }

  function removeSequence(id: string) {
    const currentSequences = form.state.values.sequences;
    form.setFieldValue(
      "sequences",
      removeSequenceAtIndex(currentSequences, parseInt(id, 10)),
    );
  }

  function handleMetadataSelection(value: string) {
    if (isMetadataLabel(value)) {
      setSelectedMetadataField("");
      return;
    }
    setSelectedMetadataField(value);
  }

  function addMetadataField() {
    if (!selectedMetadataField) return;
    if (selectedMetadataIds.has(selectedMetadataField)) {
      setSelectedMetadataField("");
      return;
    }
    setMetadataFields((prev) => [createMetadataField(selectedMetadataField), ...prev]);
    setSelectedMetadataField("");
  }

  function removeMetadataField(fieldId: string) {
    setMetadataFields((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, selected: false } : field,
      ),
    );
  }

  function handleReset() {
    form.reset(defaultGeneProteinTreeFormValues);
    setSelectedFeatureGroupObject(null);
    setSelectedAlignedFastaObject(null);
    setSelectedUnalignedFastaObject(null);
    setMetadataFields(defaultMetadataFields);
    setSelectedMetadataField("");
    setShowAdvanced(false);
  }

  const selectedItemsForTable = useMemo(
    () =>
      sequences.map((seq, index) => ({
        id: `${index}`,
        name: getDisplayName(seq.filename.split("/").pop() || seq.filename),
        type: getSequenceTypeLabel(seq.type, alphabet as Alphabet),
        description: seq.filename,
      })),
    [alphabet, sequences],
  );

  return (
    <section>
      <ServiceHeader
        title="Gene / Protein Tree"
        description="The Gene / Protein Tree Service enables construction of custom phylogenetic trees built from user-selected genes or proteins."
        infoPopupTitle={phylogeneticTreeInfo.title}
        infoPopupDescription={phylogeneticTreeInfo.description}
        quickReferenceGuide="https://www.bv-brc.org/docs/quick_references/services/genetree.html"
        tutorial="https://www.bv-brc.org/docs/tutorial/genetree/genetree.html"
        instructionalVideo="https://youtu.be/VtXWBRSdXRo"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <GeneProteinTreeInputCard
          form={form}
          alphabet={alphabet}
          alignedFastaPreset={alignedFastaPreset}
          unalignedFastaPreset={unalignedFastaPreset}
          selectedFeatureGroupObject={selectedFeatureGroupObject}
          selectedAlignedFastaObject={selectedAlignedFastaObject}
          selectedUnalignedFastaObject={selectedUnalignedFastaObject}
          selectedItemsForTable={selectedItemsForTable}
          onFeatureGroupChange={setSelectedFeatureGroupObject}
          onAlignedFastaChange={setSelectedAlignedFastaObject}
          onUnalignedFastaChange={setSelectedUnalignedFastaObject}
          onAddSequence={handleAddSequence}
          onRemoveSequence={removeSequence}
        />

        <div className="space-y-4">
          <AlignmentParametersCard form={form} />
          <GeneProteinTreeTreeParametersCard
            form={form}
            substitutionModelOptions={substitutionModelOptions}
          />
        </div>

        <GeneProteinTreeMetadataOptions
          showAdvanced={showAdvanced}
          onShowAdvancedChange={setShowAdvanced}
          metadataFields={metadataFields}
          selectedMetadataField={selectedMetadataField}
          availableMetadataOptions={availableMetadataOptions}
          onMetadataSelection={handleMetadataSelection}
          onAddMetadataField={addMetadataField}
          onRemoveMetadataField={removeMetadataField}
        />

        <div className="service-form-controls col-span-2">
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
