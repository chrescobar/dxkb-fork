"use client";

import { HelpCircle } from "lucide-react";
import type { TaxonomicClassificationController } from "./use-taxonomic-classification-controller";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import OutputFolder from "@/components/services/output-folder";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FieldErrors,
  FieldItem,
  FieldLabel,
} from "@/components/ui/tanstack-form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  confidenceIntervalOptions,
  hostGenomeOptions,
  type TaxonomicClassificationFormData,
} from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-form-schema";
import {
  isAnalysisTypeSelectable,
  isHostFilteringAvailable,
} from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-form-utils";
import {
  taxonomyClassificatioConfidenceInterval,
  taxonomyClassificationAnalysisType,
  taxonomyClassificationDatabase,
  taxonomyClassificationFilterHostReads,
  taxonomyClassificationParameters,
} from "@/lib/services/info/taxonomic-classification";

type Controller = TaxonomicClassificationController;
interface Option<TValue extends string> {
  value: TValue;
  label: string;
}

function OptionSelect<TValue extends string>({
  items,
  value,
  onChange,
  label,
  placeholder,
  disabled,
}: {
  items: readonly Option<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  label: string;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next != null) onChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger className="service-card-select-trigger" aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function BooleanRadio({
  value,
  onChange,
  id,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  id: string;
}) {
  return (
    <RadioGroup
      value={value ? "yes" : "no"}
      onValueChange={(next) => {
        if (next != null) onChange(next === "yes");
      }}
      className="service-radio-group-horizontal"
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value="no" id={`${id}-no`} />
        <Label htmlFor={`${id}-no`} className="text-sm">
          No
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="yes" id={`${id}-yes`} />
        <Label htmlFor={`${id}-yes`} className="text-sm">
          Yes
        </Label>
      </div>
    </RadioGroup>
  );
}

export function ClassificationParametersCard({
  controller,
}: {
  controller: Controller;
}) {
  const {
    form,
    sequenceType,
    analysisTypeOptions,
    databaseOptions,
    outputPath,
    setState,
  } = controller;
  return (
    <div className="md:col-span-12">
      <Card>
        <CardHeader className="service-card-header">
          <RequiredFormCardTitle className="service-card-title">
            Parameters
            <DialogInfoPopup
              title={taxonomyClassificationParameters.title}
              description={taxonomyClassificationParameters.description}
              sections={taxonomyClassificationParameters.sections}
            />
          </RequiredFormCardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <form.Field name="sequence_type">
              {(field) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    Sequencing Type
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger aria-label="Help: select sequencing type for input reads">
                          <HelpCircle className="service-card-tooltip-icon ml-2" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Select the sequencing type according to your input
                            reads
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FieldLabel>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (value != null) {
                        field.handleChange(
                          value as TaxonomicClassificationFormData["sequence_type"],
                        );
                      }
                    }}
                    className="service-radio-group-horizontal"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="wgs" id="wgs" />
                      <Label htmlFor="wgs" className="text-sm">
                        Whole Genome Sequencing (WGS)
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="16s" id="16s" />
                      <Label htmlFor="16s" className="text-sm">
                        16S Ribosomal RNA
                      </Label>
                    </div>
                  </RadioGroup>
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <form.Field name="analysis_type">
                {(field) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Analysis Type
                      <DialogInfoPopup
                        {...taxonomyClassificationAnalysisType}
                        className="ml-2"
                      />
                    </FieldLabel>
                    <OptionSelect
                      items={analysisTypeOptions}
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                      label="Analysis Type"
                      placeholder="Select analysis type"
                      disabled={!isAnalysisTypeSelectable(sequenceType)}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
              <form.Field name="database">
                {(field) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Database
                      <DialogInfoPopup
                        {...taxonomyClassificationDatabase}
                        className="ml-2"
                      />
                    </FieldLabel>
                    <OptionSelect
                      items={databaseOptions}
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                      label="Database"
                      placeholder="Select database"
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
              <form.Field name="host_genome">
                {(field) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Filter Host Reads
                      <DialogInfoPopup
                        title={taxonomyClassificationFilterHostReads.title}
                        description={
                          taxonomyClassificationFilterHostReads.description
                        }
                        className="ml-2"
                      />
                    </FieldLabel>
                    <OptionSelect
                      items={hostGenomeOptions}
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                      label="Filter Host Reads"
                      placeholder="Select filter option"
                      disabled={!isHostFilteringAvailable(sequenceType)}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
              <form.Field name="confidence_interval">
                {(field) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Confidence Interval
                      <DialogInfoPopup
                        title={taxonomyClassificatioConfidenceInterval.title}
                        description={
                          taxonomyClassificatioConfidenceInterval.description
                        }
                        className="ml-2"
                      />
                    </FieldLabel>
                    <OptionSelect
                      items={confidenceIntervalOptions}
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                      label="Confidence Interval"
                      placeholder="Select confidence interval"
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
              <form.Field name="save_classified_sequences">
                {(field) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Save Classified Sequences
                    </FieldLabel>
                    <BooleanRadio
                      id="classified"
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
              <form.Field name="save_unclassified_sequences">
                {(field) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Save Unclassified Sequences
                    </FieldLabel>
                    <BooleanRadio
                      id="unclassified"
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>
            <div className="flex flex-col space-y-4">
              <form.Field name="output_path">
                {(field) => (
                  <FieldItem className="w-full">
                    <OutputFolder
                      required
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
              <form.Field name="output_file">
                {(field) => (
                  <FieldItem className="w-full">
                    <OutputFolder
                      variant="name"
                      required
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                      outputFolderPath={outputPath}
                      onValidationChange={setState("isOutputNameValid")}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
