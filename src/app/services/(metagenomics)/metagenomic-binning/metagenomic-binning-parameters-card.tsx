"use client";

import { FieldItem, FieldLabel, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NumberInput } from "@/components/ui/number-input";
import { ChevronDown } from "lucide-react";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import { metagenomicBinningParameters } from "@/lib/services/info/metagenomic-binning";
import {
  minContigLengthMin,
  minContigLengthMax,
  minContigCoverageMin,
  minContigCoverageMax,
  type MetagenomicBinningFormData,
} from "@/lib/forms/(metagenomics)/metagenomic-binning/metagenomic-binning-form-schema";
import type { ServiceCardForm } from "@/lib/services/service-definition";

interface MetagenomicBinningParametersCardProps {
  form: ServiceCardForm<MetagenomicBinningFormData>;
  startWith: MetagenomicBinningFormData["start_with"];
  metaspadesDisabled: boolean;
  showAdvanced: boolean;
  onShowAdvancedChange: (open: boolean) => void;
}

export function MetagenomicBinningParametersCard({
  form,
  startWith,
  metaspadesDisabled,
  showAdvanced,
  onShowAdvancedChange,
}: MetagenomicBinningParametersCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Parameters
          <DialogInfoPopup
            title={metagenomicBinningParameters.title}
            description={metagenomicBinningParameters.description}
            sections={metagenomicBinningParameters.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div className="flex w-full flex-col gap-4 md:flex-row">
            {startWith === "reads" && (
              <div className="w-full">
                <form.Field name="assembler">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem>
                      <FieldLabel field={field} className="service-card-label">
                        Assembly Strategy
                      </FieldLabel>
                      <RadioGroup
                        value={field.state.value}
                        onValueChange={(value) =>
                          value != null &&
                          field.handleChange(
                            value as MetagenomicBinningFormData["assembler"],
                          )
                        }
                        className="service-radio-group-horizontal"
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem
                            value="metaspades"
                            id="metaspades"
                            disabled={metaspadesDisabled}
                          />
                          <Label
                            htmlFor="metaspades"
                            className={`text-sm ${metaspadesDisabled ? "text-muted-foreground" : ""}`}
                          >
                            MetaSPAdes
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="megahit" id="megahit" />
                          <Label htmlFor="megahit" className="text-sm">
                            MEGAHIT
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="auto" id="auto" />
                          <Label htmlFor="auto" className="text-sm">
                            Auto
                          </Label>
                        </div>
                      </RadioGroup>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>
            )}

            <div className="w-full">
              <form.Field name="organism">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      Organisms of Interest
                    </FieldLabel>
                    <RadioGroup
                      value={field.state.value}
                      onValueChange={(value) =>
                        value != null &&
                        field.handleChange(
                          value as MetagenomicBinningFormData["organism"],
                        )
                      }
                      className="service-radio-group-horizontal"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="bacteria" id="bacteria" />
                        <Label htmlFor="bacteria" className="text-sm">
                          Bacteria/Archaea
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="viral" id="viral" />
                        <Label htmlFor="viral" className="text-sm">
                          Viruses
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both" className="text-sm">
                          Both
                        </Label>
                      </div>
                    </RadioGroup>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>
          </div>

          <div className="mt-4 space-y-6">
            <div className="flex flex-col space-y-4">
              <OutputLocationFields form={form} required={true} />
            </div>

            <form.Field name="genome_group">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    Genome Group Name
                  </FieldLabel>
                  <Input
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="My Genome Group"
                    className="service-card-input"
                  />
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
          </div>

          <Collapsible
            open={showAdvanced}
            onOpenChange={onShowAdvancedChange}
            className="service-collapsible-container"
          >
            <CollapsibleTrigger className="service-collapsible-trigger text-sm font-medium">
              Advanced Parameters
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="service-collapsible-content">
              <div className="mt-6 space-y-4">
                <div className="service-card-row">
                  <form.Field name="min_contig_len">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(field: any) => (
                      <FieldItem className="w-full">
                        <FieldLabel field={field} className="service-card-sublabel">
                          Minimum Contig Length
                        </FieldLabel>
                        <NumberInput
                          name={field.name}
                          value={field.state.value}
                          min={minContigLengthMin}
                          max={minContigLengthMax}
                          stepper={10}
                          onBlur={field.handleBlur}
                          onValueChange={(value) => {
                            if (value !== undefined) field.handleChange(value);
                          }}
                        />
                        <FieldErrors field={field} />
                      </FieldItem>
                    )}
                  </form.Field>

                  <form.Field name="min_contig_cov">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(field: any) => (
                      <FieldItem className="w-full">
                        <FieldLabel field={field} className="service-card-sublabel">
                          Minimum Contig Coverage
                        </FieldLabel>
                        <NumberInput
                          name={field.name}
                          value={field.state.value}
                          min={minContigCoverageMin}
                          max={minContigCoverageMax}
                          stepper={1}
                          onBlur={field.handleBlur}
                          onValueChange={(value) => {
                            if (value !== undefined) field.handleChange(value);
                          }}
                        />
                        <FieldErrors field={field} />
                      </FieldItem>
                    )}
                  </form.Field>
                </div>

                <form.Field name="disable_dangling">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem className="flex items-center gap-2">
                      <Checkbox
                        id="disable_dangling"
                        name="disable_dangling"
                        checked={field.state.value}
                        onCheckedChange={(checked) =>
                          field.handleChange(!!checked)
                        }
                        className="mb-2 bg-white"
                      />
                      <FieldLabel
                        field={field}
                        htmlFor="disable_dangling"
                        className="service-card-sublabel"
                      >
                        Disable Search For Dangling Contigs (Decreases Memory
                        Use)
                      </FieldLabel>
                    </FieldItem>
                  )}
                </form.Field>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
