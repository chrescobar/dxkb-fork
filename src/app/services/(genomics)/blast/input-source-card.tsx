import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldErrors, FieldItem } from "@/components/ui/tanstack-form";
import { RadioGroup } from "@/components/ui/radio-group";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { FastaTextarea } from "@/components/services/fasta-textarea";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { blastServiceInputSource } from "@/lib/services/info/blast";
import type { BlastFormData } from "@/lib/forms/(genomics)/blast/blast-form-schema";
import type { FastaValidationResult } from "@/lib/fasta-validation";
import type { WorkspaceSelectorPreset } from "@/components/workspace/workspace-selector-presets";
import type { BlastForm } from "./page";
import { Choice } from "./choice";

interface InputProps {
  form: BlastForm;
  source: BlastFormData["input_source"];
  program: BlastFormData["blast_program"];
  preset: WorkspaceSelectorPreset;
  onSourceChange: (source: BlastFormData["input_source"]) => void;
  onValidationChange: (
    valid: boolean,
    result: FastaValidationResult | null,
  ) => void;
}

export function InputSourceCard({
  form,
  source,
  program,
  preset,
  onSourceChange,
  onValidationChange,
}: InputProps) {
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
          {(field) => (
            <div className="space-y-6">
              <FieldItem>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as BlastFormData["input_source"]);
                    onSourceChange(value as BlastFormData["input_source"]);
                  }}
                  className="service-radio-group-horizontal"
                >
                  <Choice
                    value="fasta_data"
                    id="fastaSequence"
                    label="Enter sequence"
                  />
                  <Choice
                    value="fasta_file"
                    id="fastaFile"
                    label="Select FASTA file"
                  />
                  <Choice
                    value="feature_group"
                    id="featureGroup"
                    label="Select feature group"
                  />
                </RadioGroup>
                <FieldErrors field={field} />
              </FieldItem>
              {source === "fasta_data" && (
                <form.Field name="input_fasta_data">
                  {(item) => (
                    <FieldItem>
                      <FastaTextarea
                        value={item.state.value}
                        onChange={item.handleChange}
                        inputType={program}
                        onValidationChange={onValidationChange}
                        required
                        showValidationStatus
                      />
                      <FieldErrors field={item} />
                    </FieldItem>
                  )}
                </form.Field>
              )}
              {source === "fasta_file" && (
                <form.Field name="input_fasta_file">
                  {(item) => (
                    <FieldItem>
                      <WorkspaceObjectSelector
                        preset={preset}
                        placeholder="Select a FASTA file to search..."
                        value={item.state.value}
                        onSelectedObjectChange={(object) => {
                          item.handleChange(object?.path ?? "");
                        }}
                      />
                      <FieldErrors field={item} />
                    </FieldItem>
                  )}
                </form.Field>
              )}
              {source === "feature_group" && (
                <form.Field name="input_feature_group">
                  {(item) => (
                    <FieldItem>
                      <WorkspaceObjectSelector
                        preset="featureGroup"
                        placeholder="Select a feature group to search..."
                        value={item.state.value}
                        onSelectedObjectChange={(object) => {
                          item.handleChange(object?.path ?? "");
                        }}
                      />
                      <FieldErrors field={item} />
                    </FieldItem>
                  )}
                </form.Field>
              )}
            </div>
          )}
        </form.Field>
      </CardContent>
    </Card>
  );
}
