"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldErrors, FieldItem } from "@/components/ui/tanstack-form";
import { RequiredFormLabel } from "@/components/forms/required-form-components";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import OutputFolder from "@/components/services/output-folder";
import { SingleGenomeSelector } from "@/components/services/single-genome-selector";
import {
  variationAnalysisCallers,
  variationAnalysisMappers,
} from "@/lib/forms/(genomics)/variation-analysis/variation-analysis-form-utils";
import { variationAnalysisParameters } from "@/lib/services/info/variation-analysis";
import type { VariationAnalysisController } from "./use-variation-analysis-form";

export function ParametersSection({
  controller,
}: {
  controller: VariationAnalysisController;
}) {
  const { form, outputPath, setIsOutputNameValid } = controller;
  return (
    <Card>
      <CardHeader className="service-card-header">
        <CardTitle className="service-card-title">
          Parameters
          <DialogInfoPopup
            title={variationAnalysisParameters.title}
            description={variationAnalysisParameters.description}
            sections={variationAnalysisParameters.sections}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="service-card-content">
        <div className="space-y-6">
          <form.Field name="reference_genome_id">
            {(field) => (
              <FieldItem>
                <RequiredFormLabel>Target Genome</RequiredFormLabel>
                <SingleGenomeSelector
                  value={field.state.value}
                  onChange={field.handleChange}
                  placeholder="e.g. Mycobacterium tuberculosis H37Rv"
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
          <form.Field name="mapper">
            {(field) => (
              <FieldItem>
                <RequiredFormLabel>Aligner</RequiredFormLabel>
                <Select
                  items={variationAnalysisMappers}
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value != null) field.handleChange(value);
                  }}
                >
                  <SelectTrigger
                    className="service-card-select-trigger"
                    aria-label="Aligner"
                  >
                    <SelectValue placeholder="Select aligner" />
                  </SelectTrigger>
                  <SelectContent className="service-card-select-content">
                    <SelectGroup>
                      {variationAnalysisMappers.map((mapper) => (
                        <SelectItem key={mapper.value} value={mapper.value}>
                          {mapper.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
          <form.Field name="caller">
            {(field) => (
              <FieldItem>
                <RequiredFormLabel>SNP Caller</RequiredFormLabel>
                <Select
                  items={variationAnalysisCallers}
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value != null) field.handleChange(value);
                  }}
                >
                  <SelectTrigger
                    className="service-card-select-trigger"
                    aria-label="SNP Caller"
                  >
                    <SelectValue placeholder="Select SNP caller" />
                  </SelectTrigger>
                  <SelectContent className="service-card-select-content">
                    <SelectGroup>
                      {variationAnalysisCallers.map((caller) => (
                        <SelectItem key={caller.value} value={caller.value}>
                          {caller.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
          <form.Field name="output_path">
            {(field) => (
              <FieldItem>
                <OutputFolder
                  required
                  value={field.state.value}
                  onChange={field.handleChange}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
          <form.Field name="output_file">
            {(field) => (
              <FieldItem>
                <OutputFolder
                  variant="name"
                  required
                  value={field.state.value}
                  onChange={field.handleChange}
                  outputFolderPath={outputPath}
                  onValidationChange={setIsOutputNameValid}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
        </div>
      </CardContent>
    </Card>
  );
}
