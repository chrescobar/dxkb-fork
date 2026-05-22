"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { FastaTextarea } from "@/components/services/fasta-textarea";
import { blastServiceInputSource } from "@/lib/services/info/blast";
import type { WorkspaceSelectorPreset } from "@/components/workspace/workspace-selector-presets";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import type { BlastFormData } from "@/lib/forms/(genomics)/blast/blast-form-schema";
import type { FastaValidationResult } from "@/lib/fasta-validation";
import type { ServiceCardForm } from "@/lib/services/service-definition";

interface BlastInputSourceCardProps {
  form: ServiceCardForm<BlastFormData>;
  inputSource: BlastFormData["input_source"];
  inputFastaPreset: WorkspaceSelectorPreset;
  currentBlastProgram: BlastFormData["blast_program"];
  onInputSourceChange: (source: BlastFormData["input_source"]) => void;
  onFastaValidationChange: (isValid: boolean, result: FastaValidationResult | null) => void;
}

export function BlastInputSourceCard({
  form,
  inputSource,
  inputFastaPreset,
  currentBlastProgram,
  onInputSourceChange,
  onFastaValidationChange,
}: BlastInputSourceCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Input Source
          <DialogInfoPopup
            title={blastServiceInputSource.title}
            description={blastServiceInputSource.description}
            sections={blastServiceInputSource.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <form.Field name="input_source">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <div className="space-y-6">
              <FieldItem>
                <RadioGroup
                  onValueChange={(value) => {
                    field.handleChange(value as BlastFormData["input_source"]);
                    onInputSourceChange(value as BlastFormData["input_source"]);
                  }}
                  value={field.state.value}
                  className="service-radio-group-horizontal"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="fasta_data" id="fastaSequence" />
                    <Label htmlFor="fastaSequence">Enter sequence</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="fasta_file" id="fastaFile" />
                    <Label htmlFor="fastaFile">Select FASTA file</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="feature_group" id="featureGroup" />
                    <Label htmlFor="featureGroup">Select feature group</Label>
                  </div>
                </RadioGroup>
                <FieldErrors field={field} />
              </FieldItem>

              <div
                className={
                  inputSource === "fasta_data"
                    ? "service-card-content-grid-item"
                    : "hidden"
                }
              >
                <form.Field name="input_fasta_data">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(fastaField: any) => (
                    <FieldItem>
                      <FastaTextarea
                        value={fastaField.state.value ?? ""}
                        onChange={fastaField.handleChange}
                        inputType={currentBlastProgram}
                        onValidationChange={onFastaValidationChange}
                        required={true}
                        showValidationStatus={true}
                      />
                      <FieldErrors field={fastaField} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>

              <div
                className={
                  inputSource === "fasta_file"
                    ? "service-card-content-grid-item"
                    : "hidden"
                }
              >
                <form.Field name="input_fasta_file">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(fileField: any) => (
                    <FieldItem>
                      <WorkspaceObjectSelector
                        preset={inputFastaPreset}
                        placeholder="Select a FASTA file to search..."
                        value={fileField.state.value}
                        onObjectSelect={(object: WorkspaceObject) => {
                          fileField.handleChange(object.path);
                        }}
                      />
                      <FieldErrors field={fileField} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>

              <div
                className={
                  inputSource === "feature_group"
                    ? "service-card-content-grid-item mb-4"
                    : "hidden"
                }
              >
                <form.Field name="input_feature_group">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(groupField: any) => (
                    <FieldItem>
                      <WorkspaceObjectSelector
                        preset="featureGroup"
                        placeholder="Select a feature group to search..."
                        value={groupField.state.value}
                        onObjectSelect={(object: WorkspaceObject) => {
                          groupField.handleChange(object.path);
                        }}
                      />
                      <FieldErrors field={groupField} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>
            </div>
          )}
        </form.Field>
      </CardContent>
    </Card>
  );
}
