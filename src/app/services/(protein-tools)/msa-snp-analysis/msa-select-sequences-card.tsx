"use client";

import { useStore } from "@tanstack/react-form";
import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { WorkspaceObject } from "@/lib/services/workspace/types";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { msaSNPAnalysisSelectSequences } from "@/lib/services/info/msa-snp-analysis";
import * as MsaSnpAnalysis from "@/lib/forms/(protein-tools)/msa-snp-analysis/msa-snp-analysis-form-schema";
import * as MsaSnpAnalysisUtils from "@/lib/forms/(protein-tools)/msa-snp-analysis/msa-snp-analysis-form-utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServiceForm { Field: any; store: any }

interface MsaSelectSequencesCardProps {
  form: ServiceForm;
  inputStatus: string;
  fastaInputText: string;
  setFastaInputText: (text: string) => void;
  fastaValidationResult: { valid: boolean; message: string; numseq: number } | null;
  selectedFastaObject: WorkspaceObject | null;
  setSelectedFastaObject: (obj: WorkspaceObject | null) => void;
  selectedAlignedFastaObject: WorkspaceObject | null;
  setSelectedAlignedFastaObject: (obj: WorkspaceObject | null) => void;
  isValidatingGenomeGroup: boolean;
  selectGenomegroup: string[];
  onGenomeGroupSelect: (object: WorkspaceObject | null) => Promise<void>;
  onInputTypeChange: (prevType: string | undefined, newType: string) => void;
}

export function MsaSelectSequencesCard({
  form,
  inputStatus,
  fastaInputText,
  setFastaInputText,
  fastaValidationResult,
  selectedFastaObject,
  setSelectedFastaObject,
  selectedAlignedFastaObject,
  setSelectedAlignedFastaObject,
  isValidatingGenomeGroup,
  selectGenomegroup,
  onGenomeGroupSelect,
  onInputTypeChange,
}: MsaSelectSequencesCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputType = useStore(form.store, (s: any) => s.values.input_type as MsaSnpAnalysis.MsaSnpAnalysisFormData["input_type"]);

  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Select sequences:
          <DialogInfoPopup
            title={msaSNPAnalysisSelectSequences.title}
            description={msaSNPAnalysisSelectSequences.description}
            sections={msaSNPAnalysisSelectSequences.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        {inputStatus === "unaligned" ? (
          <div className="space-y-4">
            <form.Field name="input_type">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <FieldItem>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(value: string) => {
                      if (value == null) return;
                      const previousInputType = field.state.value as string | undefined;
                      field.handleChange(
                        value as MsaSnpAnalysis.MsaSnpAnalysisFormData["input_type"],
                      );
                      onInputTypeChange(previousInputType, value);
                    }}
                    className="service-radio-group-horizontal"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value="input_feature_group"
                        id="input_feature_group"
                      />
                      <Label htmlFor="input_feature_group">
                        Feature Group
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value="input_genome_group"
                        id="input_genome_group"
                      />
                      <Label htmlFor="input_genome_group">
                        Viral Genome Group
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value="input_fasta"
                        id="input_fasta"
                      />
                      <Label htmlFor="input_fasta">
                        DNA or Protein FASTA File
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value="input_sequence"
                        id="input_sequence"
                      />
                      <Label htmlFor="input_sequence">Input Sequence</Label>
                    </div>
                  </RadioGroup>
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>

            {/* Feature Group Input */}
            {inputType === "input_feature_group" && (
              <div className="space-y-4">
                <form.Field name="feature_groups">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem>
                      <WorkspaceObjectSelector
                        preset="featureGroup"
                        placeholder="Select feature group"
                        onSelectedObjectChange={(
                          object: WorkspaceObject | null,
                        ) => {
                          if (!object || !object.path) {
                            field.handleChange("");
                            return;
                          }

                          field.handleChange(object.path);
                        }}
                        value={field.state.value}
                      />
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>

                <form.Field name="alphabet">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem>
                      <RadioGroup
                        value={field.state.value}
                        onValueChange={(value: string) =>
                          value != null &&
                          field.handleChange(
                            value as MsaSnpAnalysis.MsaSnpAnalysisFormData["alphabet"],
                          )
                        }
                        className="service-radio-group-horizontal"
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="dna" id="dna" />
                          <Label htmlFor="dna">DNA</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="protein" id="protein" />
                          <Label htmlFor="protein">Protein</Label>
                        </div>
                      </RadioGroup>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>
            )}

            {/* Genome Group Input */}
            {inputType === "input_genome_group" && (
              <div className="space-y-2">
                <WorkspaceObjectSelector
                  preset="genomeGroup"
                  placeholder="Select viral genome group"
                  onSelectedObjectChange={onGenomeGroupSelect}
                  value={selectGenomegroup[0]}
                />
                {isValidatingGenomeGroup && (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Spinner className="h-4 w-4" />
                    <span>Validating genome group...</span>
                  </div>
                )}
                <form.Field name="select_genomegroup">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>
            )}

            {/* FASTA File Input */}
            {inputType === "input_fasta" && (
              <div className="space-y-2">
                <WorkspaceObjectSelector
                  preset="featureFasta"
                  placeholder="Select FASTA file"
                  onSelectedObjectChange={(
                    object: WorkspaceObject | null,
                  ) => {
                    if (!object || !object.path) {
                      setSelectedFastaObject(null);
                      return;
                    }

                    const inputValue = object.path;

                    // Determine file type - default to DNA, check path for protein indicators
                    let type: MsaSnpAnalysis.FastaFileItem["type"] =
                      "feature_dna_fasta";
                    const pathLower = inputValue.toLowerCase();
                    if (
                      pathLower.includes("protein") ||
                      pathLower.includes("aa") ||
                      pathLower.includes("pep")
                    ) {
                      type = "feature_protein_fasta";
                    }

                    // Replace the existing file (only one file allowed)
                    const newFile = MsaSnpAnalysisUtils.createFastaFileItem(
                      inputValue,
                      type,
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (form as any).setFieldValue("fasta_files", [newFile]);
                    setSelectedFastaObject(null);
                  }}
                  value={selectedFastaObject?.path}
                />
                <form.Field name="fasta_files">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>
            )}

            {/* Input Sequence */}
            {inputType === "input_sequence" && (
              <div className="space-y-2">
                <Textarea
                  value={fastaInputText}
                  onChange={(e) => setFastaInputText(e.target.value)}
                  placeholder="Enter FASTA records of sequences to align"
                  className="service-card-textarea"
                  rows={10}
                />
                {fastaValidationResult && (
                  <Alert
                    variant={
                      fastaValidationResult.valid
                        ? "default"
                        : "destructive"
                    }
                  >
                    <AlertDescription className="text-sm">
                      {fastaValidationResult.valid
                        ? `✓ Valid FASTA with ${fastaValidationResult.numseq} sequence${fastaValidationResult.numseq !== 1 ? "s" : ""}`
                        : fastaValidationResult.message}
                    </AlertDescription>
                  </Alert>
                )}
                <form.Field name="fasta_keyboard_input">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="service-card-label">
              Select an aligned FASTA file
            </Label>
            <WorkspaceObjectSelector
              preset="alignedFasta"
              placeholder="Select aligned FASTA file"
              onSelectedObjectChange={(object: WorkspaceObject | null) => {
                if (!object || !object.path) {
                  setSelectedAlignedFastaObject(null);
                  return;
                }

                const inputValue = object.path;

                // Determine file type - default to DNA, check path for protein indicators
                let type: MsaSnpAnalysis.FastaFileItem["type"] =
                  "aligned_dna_fasta";
                const pathLower = inputValue.toLowerCase();
                if (
                  pathLower.includes("protein") ||
                  pathLower.includes("aa") ||
                  pathLower.includes("pep")
                ) {
                  type = "aligned_protein_fasta";
                }

                // Replace the existing file (only one file allowed)
                const newFile = MsaSnpAnalysisUtils.createFastaFileItem(
                  inputValue,
                  type,
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (form as any).setFieldValue("fasta_files", [newFile]);
                setSelectedAlignedFastaObject(null);
              }}
              value={selectedAlignedFastaObject?.path}
            />
            <form.Field name="fasta_files">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <FieldItem>
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
