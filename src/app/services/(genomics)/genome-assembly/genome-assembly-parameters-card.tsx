"use client";

import { FieldItem, FieldLabel, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { NumberInput } from "@/components/ui/number-input";
import { HelpCircle, ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormLabel } from "@/components/forms/required-form-components";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import { genomeAssemblyParameters } from "@/lib/services/info/genome-assembly";
import {
  genomeAssemblyRecipes,
  genomeSizeUnitOptions,
  calculateGenomeSize,
} from "@/lib/forms/(genomics)/genome-assembly/genome-assembly-form-utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServiceForm { Field: any; store: any; setFieldValue: (...args: any[]) => void; state: any }

interface GenomeAssemblyParametersCardProps {
  form: ServiceForm;
  showGenomeSizeField: boolean;
  genomeSizeUnit: "M" | "K";
  expectedGenomeSize: number;
  showAdvanced: boolean;
  onExpectedGenomeSizeChange: (value: number, unit: "M" | "K") => void;
  onGenomeSizeUnitChange: (unit: "M" | "K") => void;
  onShowAdvancedChange: (open: boolean) => void;
}

export function GenomeAssemblyParametersCard({
  form,
  showGenomeSizeField,
  genomeSizeUnit,
  expectedGenomeSize,
  showAdvanced,
  onExpectedGenomeSizeChange,
  onGenomeSizeUnitChange,
  onShowAdvancedChange,
}: GenomeAssemblyParametersCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <CardTitle className="service-card-title">
          Parameters
          <DialogInfoPopup
            title={genomeAssemblyParameters.title}
            description={genomeAssemblyParameters.description}
            sections={genomeAssemblyParameters.sections}
          />
        </CardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="space-y-6">
          <form.Field name="recipe">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <RequiredFormLabel>Assembly Strategy</RequiredFormLabel>
                <Select
                  items={genomeAssemblyRecipes}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as string)}
                >
                  <SelectTrigger
                    aria-label="Assembly strategy"
                    className="service-card-select-trigger"
                  >
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent className="service-card-select-content">
                    <SelectGroup>
                      {genomeAssemblyRecipes.map((recipe) => (
                        <SelectItem key={recipe.value} value={recipe.value}>
                          {recipe.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          <OutputLocationFields form={form} required />

          {showGenomeSizeField && (
            <form.Field name="genome_size">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    Estimated Genome Size
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={expectedGenomeSize}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        onExpectedGenomeSizeChange(value, genomeSizeUnit);
                        field.handleChange(
                          calculateGenomeSize(value, genomeSizeUnit),
                        );
                      }}
                      className="service-card-input flex-1"
                      min={genomeSizeUnit === "M" ? 1 : 100}
                      max={genomeSizeUnit === "M" ? 10 : 10000}
                    />
                    <span className="text-lg">&times;</span>
                    <Select
                      items={genomeSizeUnitOptions}
                      value={genomeSizeUnit}
                      onValueChange={(value) => {
                        if (value == null) return;
                        const unit = value as "M" | "K";
                        onGenomeSizeUnitChange(unit);
                        if (unit === "M") {
                          field.handleChange(5000000);
                        } else {
                          field.handleChange(500000);
                        }
                      }}
                    >
                      <SelectTrigger
                        aria-label="Genome size unit"
                        className="service-card-select-trigger w-20"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {genomeSizeUnitOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
          )}

          <Collapsible
            open={showAdvanced}
            onOpenChange={onShowAdvancedChange}
            className="service-collapsible-container"
          >
            <CollapsibleTrigger className="service-collapsible-trigger">
              Advanced Options
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="service-collapsible-content">
              <div className="space-y-4">
                <Label className="service-card-label">Read Processing</Label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {(
                    [
                      { name: "normalize", label: "Normalize Illumina Reads" },
                      { name: "trim", label: "Trim Short Reads" },
                      { name: "filtlong", label: "Filter Long Reads" },
                    ] as const
                  ).map(({ name, label }) => (
                    <form.Field key={name} name={name}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(field: any) => (
                        <FieldItem className="flex flex-col items-start justify-between">
                          <FieldLabel field={field} className="service-card-sublabel">
                            {label}
                          </FieldLabel>
                          <Switch
                            checked={field.state.value}
                            onCheckedChange={(checked) =>
                              field.handleChange(checked)
                            }
                          />
                        </FieldItem>
                      )}
                    </form.Field>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="service-card-label">Genome Parameters</Label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <form.Field name="target_depth">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(field: any) => (
                      <FieldItem>
                        <FieldLabel field={field} className="service-card-sublabel">
                          Target Genome Coverage
                        </FieldLabel>
                        <NumberInput
                          value={field.state.value}
                          onValueChange={field.handleChange}
                          min={100}
                          max={500}
                          stepper={50}
                        />
                        <FieldErrors field={field} />
                      </FieldItem>
                    )}
                  </form.Field>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="service-card-label">Assembly Polishing</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="service-card-tooltip-icon" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        Racon and Pilon iterations improve long-read assembly accuracy.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(
                    [
                      { name: "racon_iter", label: "Racon Iterations", min: 0, max: 4 },
                      { name: "pilon_iter", label: "Pilon Iterations", min: 0, max: 4 },
                    ] as const
                  ).map(({ name, label, min, max }) => (
                    <form.Field key={name} name={name}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(field: any) => (
                        <FieldItem>
                          <FieldLabel field={field} className="service-card-sublabel">
                            {label}
                          </FieldLabel>
                          <NumberInput
                            value={field.state.value}
                            onValueChange={field.handleChange}
                            min={min}
                            max={max}
                          />
                          <FieldErrors field={field} />
                        </FieldItem>
                      )}
                    </form.Field>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="service-card-label">Assembly Thresholds</Label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(
                    [
                      { name: "min_contig_len", label: "Min. contig length", min: 100, max: 100000, stepper: 10 },
                      { name: "min_contig_cov", label: "Min. contig coverage", min: 0, max: 100000, stepper: 5 },
                    ] as const
                  ).map(({ name, label, min, max, stepper }) => (
                    <form.Field key={name} name={name}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(field: any) => (
                        <FieldItem>
                          <FieldLabel field={field} className="service-card-sublabel">
                            {label}
                          </FieldLabel>
                          <NumberInput
                            value={field.state.value}
                            onValueChange={field.handleChange}
                            min={min}
                            max={max}
                            stepper={stepper}
                          />
                          <FieldErrors field={field} />
                        </FieldItem>
                      )}
                    </form.Field>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
