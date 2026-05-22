"use client";

import { FieldItem, FieldLabel, FieldErrors } from "@/components/ui/tanstack-form";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import {
  taxonomyClassificationParameters,
  taxonomyClassificationAnalysisType,
  taxonomyClassificationDatabase,
  taxonomyClassificationFilterHostReads,
  taxonomyClassificatioConfidenceInterval,
} from "@/lib/services/info/taxonomic-classification";
import {
  hostGenomeOptions,
  confidenceIntervalOptions,
  type TaxonomicClassificationFormData,
} from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-form-schema";
import {
  isHostFilteringAvailable,
  isAnalysisTypeSelectable,
} from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-form-utils";
import type { ServiceCardForm } from "@/lib/services/service-definition";

interface TaxonomicClassificationParametersCardProps {
  form: ServiceCardForm<TaxonomicClassificationFormData>;
  sequenceType: TaxonomicClassificationFormData["sequence_type"];
  analysisTypeOptions: readonly { readonly value: string; readonly label: string }[];
  databaseOptions: readonly { readonly value: string; readonly label: string }[];
}

export function TaxonomicClassificationParametersCard({
  form,
  sequenceType,
  analysisTypeOptions,
  databaseOptions,
}: TaxonomicClassificationParametersCardProps) {
  return (
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
          <div className="w-full">
            <form.Field name="sequence_type">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    Sequencing Type
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="service-card-tooltip-icon ml-2" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the sequencing type according to your input reads</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FieldLabel>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(value) =>
                      value != null &&
                      field.handleChange(
                        value as TaxonomicClassificationFormData["sequence_type"],
                      )
                    }
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
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="service-card-content-grid-item">
              <form.Field name="analysis_type">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Analysis Type
                      <DialogInfoPopup
                        title={taxonomyClassificationAnalysisType.title}
                        description={taxonomyClassificationAnalysisType.description}
                        sections={taxonomyClassificationAnalysisType.sections}
                        className="ml-2"
                      />
                    </FieldLabel>
                    <Select
                      items={analysisTypeOptions}
                      value={field.state.value}
                      onValueChange={(value) =>
                        value != null &&
                        field.handleChange(
                          value as TaxonomicClassificationFormData["analysis_type"],
                        )
                      }
                      disabled={!isAnalysisTypeSelectable(sequenceType)}
                    >
                      <SelectTrigger className="service-card-select-trigger">
                        <SelectValue placeholder="Select analysis type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {analysisTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>

            <div className="service-card-content-grid-item">
              <form.Field name="database">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Database
                      <DialogInfoPopup
                        title={taxonomyClassificationDatabase.title}
                        description={taxonomyClassificationDatabase.description}
                        sections={taxonomyClassificationDatabase.sections}
                        className="ml-2"
                      />
                    </FieldLabel>
                    <Select
                      items={databaseOptions}
                      value={field.state.value}
                      onValueChange={(value) =>
                        value != null &&
                        field.handleChange(
                          value as TaxonomicClassificationFormData["database"],
                        )
                      }
                    >
                      <SelectTrigger className="service-card-select-trigger">
                        <SelectValue placeholder="Select database" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {databaseOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>

            <div className="service-card-content-grid-item">
              <form.Field name="host_genome">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Filter Host Reads
                      <DialogInfoPopup
                        title={taxonomyClassificationFilterHostReads.title}
                        description={taxonomyClassificationFilterHostReads.description}
                        className="ml-2"
                      />
                    </FieldLabel>
                    <Select
                      items={hostGenomeOptions}
                      value={field.state.value}
                      onValueChange={(value) =>
                        value != null &&
                        field.handleChange(
                          value as TaxonomicClassificationFormData["host_genome"],
                        )
                      }
                      disabled={!isHostFilteringAvailable(sequenceType)}
                    >
                      <SelectTrigger className="service-card-select-trigger">
                        <SelectValue placeholder="Select filter option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {hostGenomeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>

            <div className="service-card-content-grid-item">
              <form.Field name="confidence_interval">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Confidence Interval
                      <DialogInfoPopup
                        title={taxonomyClassificatioConfidenceInterval.title}
                        description={taxonomyClassificatioConfidenceInterval.description}
                        className="ml-2"
                      />
                    </FieldLabel>
                    <Select
                      items={confidenceIntervalOptions}
                      value={field.state.value}
                      onValueChange={(value) =>
                        value != null && field.handleChange(value)
                      }
                    >
                      <SelectTrigger className="service-card-select-trigger">
                        <SelectValue placeholder="Select confidence interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {confidenceIntervalOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>

            <div className="service-card-content-grid-item">
              <form.Field name="save_classified_sequences">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Save Classified Sequences
                    </FieldLabel>
                    <RadioGroup
                      value={field.state.value ? "yes" : "no"}
                      onValueChange={(value) =>
                        value != null && field.handleChange(value === "yes")
                      }
                      className="service-radio-group-horizontal"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="no" id="classified-no" />
                        <Label htmlFor="classified-no" className="text-sm">No</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="yes" id="classified-yes" />
                        <Label htmlFor="classified-yes" className="text-sm">Yes</Label>
                      </div>
                    </RadioGroup>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>

            <div className="service-card-content-grid-item">
              <form.Field name="save_unclassified_sequences">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Save Unclassified Sequences
                    </FieldLabel>
                    <RadioGroup
                      value={field.state.value ? "yes" : "no"}
                      onValueChange={(value) =>
                        value != null && field.handleChange(value === "yes")
                      }
                      className="service-radio-group-horizontal"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="no" id="unclassified-no" />
                        <Label htmlFor="unclassified-no" className="text-sm">No</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="yes" id="unclassified-yes" />
                        <Label htmlFor="unclassified-yes" className="text-sm">Yes</Label>
                      </div>
                    </RadioGroup>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <OutputLocationFields form={form} required={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
