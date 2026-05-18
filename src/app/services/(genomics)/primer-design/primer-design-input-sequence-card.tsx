"use client";

import { FieldItem, FieldLabel, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { primerDesignInputSequence } from "@/lib/services/info/primer-design";
import { markerLabels, type MarkerType } from "@/lib/forms/(genomics)/primer-design/primer-design-form-utils";
import type { PrimerDesignFormData } from "@/lib/forms/(genomics)/primer-design/primer-design-form-schema";
import type { WorkspaceObject } from "@/lib/services/workspace/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServiceForm { Field: any }

interface SequenceValidation {
  isValid: boolean;
  message: string;
}

interface PrimerDesignInputSequenceCardProps {
  form: ServiceForm;
  inputType: PrimerDesignFormData["input_type"];
  sequenceValidation: SequenceValidation | null;
  showAdvanced: boolean;
  isRestoringValueRef: React.RefObject<boolean>;
  onShowAdvancedChange: (open: boolean) => void;
  onInputTypeChange: (
    newInputType: PrimerDesignFormData["input_type"],
    previousInputType: PrimerDesignFormData["input_type"],
  ) => void;
  onSequenceValueChange: (value: string) => void;
  onSequenceSelect: (event: React.SyntheticEvent<HTMLTextAreaElement>) => void;
  onUpdateSequenceWithMarkers: (marker: MarkerType) => void;
  onWorkspaceSelection: (object: WorkspaceObject) => void;
}

export function PrimerDesignInputSequenceCard({
  form,
  inputType,
  sequenceValidation,
  showAdvanced,
  isRestoringValueRef,
  onShowAdvancedChange,
  onInputTypeChange,
  onSequenceValueChange,
  onSequenceSelect,
  onUpdateSequenceWithMarkers,
  onWorkspaceSelection,
}: PrimerDesignInputSequenceCardProps) {
  return (
    <Card className="gap-0">
      <CardHeader className="service-card-header pb-1">
        <CardTitle className="service-card-title">
          Input Sequence
          <DialogInfoPopup
            title={primerDesignInputSequence.title}
            description={primerDesignInputSequence.description}
            sections={primerDesignInputSequence.sections}
          />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        <Tabs
          value={inputType}
          onValueChange={(value) => {
            const newInputType = value as PrimerDesignFormData["input_type"];
            onInputTypeChange(newInputType, inputType);
          }}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="sequence_text">Paste Sequence</TabsTrigger>
            <TabsTrigger value="workplace_fasta">Workspace FASTA</TabsTrigger>
          </TabsList>

          <TabsContent value="sequence_text" className="space-y-3">
            <form.Field name="SEQUENCE_ID">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    Sequence Identifier
                  </FieldLabel>
                  <Input
                    name={field.name}
                    id={field.name}
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Identifier for input sequence"
                    className="service-card-input"
                  />
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>

            <form.Field name="sequence_input">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    Paste Sequence
                  </FieldLabel>
                  <Textarea
                    name={field.name}
                    id={field.name}
                    value={field.state.value}
                    onChange={(event) =>
                      onSequenceValueChange(event.target.value)
                    }
                    onSelect={onSequenceSelect}
                    onKeyUp={onSequenceSelect}
                    onMouseUp={onSequenceSelect}
                    placeholder="Enter nucleotide sequence"
                    className="service-card-textarea"
                  />
                  {sequenceValidation && !sequenceValidation.isValid && (
                    <p className="text-destructive text-sm">
                      {sequenceValidation.message}
                    </p>
                  )}
                  {sequenceValidation && sequenceValidation.isValid && (
                    <p className="text-sm text-green-600">
                      Sequence looks valid.
                    </p>
                  )}
                </FieldItem>
              )}
            </form.Field>

            <div className="space-y-2">
              <Label className="service-card-sublabel">
                Mark Selected Region
              </Label>
              <div className="flex flex-wrap gap-2">
                {(
                  Object.keys(markerLabels) as (keyof typeof markerLabels)[]
                ).map((markerKey) => (
                  <Button
                    key={markerKey}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateSequenceWithMarkers(markerKey)}
                  >
                    {markerLabels[markerKey]}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateSequenceWithMarkers("clear")}
                >
                  Clear markers
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workplace_fasta" className="mt-0">
            <form.Field name="sequence_input">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    FASTA File
                  </FieldLabel>
                  <WorkspaceObjectSelector
                    preset="featureDnaFasta"
                    placeholder="Select FASTA file from workspace"
                    value={field.state.value}
                    onObjectSelect={onWorkspaceSelection}
                    onSelectedObjectChange={(object) => {
                      if (isRestoringValueRef.current) return;
                      if (object && inputType === "workplace_fasta") {
                        field.handleChange(object.path || "");
                      } else if (!object && inputType === "workplace_fasta") {
                        const currentValue = field.state.value;
                        if (currentValue) field.handleChange("");
                      }
                    }}
                  />
                  <p className="text-muted-foreground text-xs">
                    Note: only the first FASTA record will be used.
                  </p>
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
          </TabsContent>
        </Tabs>

        <form.Field name="PRIMER_PICK_INTERNAL_OLIGO">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <FieldItem className="flex flex-row items-center gap-2">
              <FieldLabel field={field} className="service-card-sublabel">
                Pick Internal Oligo
              </FieldLabel>
              <Switch
                checked={field.state.value ? true : false}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
              <FieldErrors field={field} />
            </FieldItem>
          )}
        </form.Field>

        <form.Field name="PRIMER_PRODUCT_SIZE_RANGE">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <FieldItem>
              <div className="flex items-center gap-2">
                <FieldLabel field={field} className="service-card-label">
                  Product Size Range (bp)
                </FieldLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={<HelpCircle className="service-card-tooltip-icon" />}
                    />
                    <TooltipContent className="max-w-sm">
                      Minimum, optimum, and maximum lengths (in bases) of the PCR
                      product.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                value={
                  Array.isArray(field.state.value)
                    ? field.state.value.join(" ")
                    : field.state.value || ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  field.handleChange(
                    value.trim() ? value.trim().split(/\s+/) : [],
                  );
                }}
                placeholder="50-500"
                className="service-card-input"
              />
              <FieldErrors field={field} />
            </FieldItem>
          )}
        </form.Field>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="service-card-label">Primer Size (bp)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={<HelpCircle className="service-card-tooltip-icon" />}
                />
                <TooltipContent className="max-w-sm">
                  Specify minimum, optimum, and maximum primer lengths.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                { label: "Min", name: "PRIMER_MIN_SIZE" },
                { label: "Opt", name: "PRIMER_OPT_SIZE" },
                { label: "Max", name: "PRIMER_MAX_SIZE" },
              ] as const
            ).map(({ label, name }) => (
              <form.Field key={name} name={name}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-sublabel">
                      {label}
                    </FieldLabel>
                    <Input
                      value={field.state.value || ""}
                      onChange={(e) => {
                        field.handleChange(e.target.value || undefined);
                      }}
                      className="service-card-input"
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {(
            [
              {
                label: "Excluded Regions",
                name: "SEQUENCE_EXCLUDED_REGION",
                prefix: "<",
                suffix: ">",
                tooltip: "Space-separated start,length pairs that primers must avoid (e.g. 401,7 68,3).",
              },
              {
                label: "Target Region",
                name: "SEQUENCE_TARGET",
                prefix: "[",
                suffix: "]",
                tooltip: "Space-separated start,length pairs that primers must flank (e.g. 50,2).",
              },
              {
                label: "Included Regions",
                name: "SEQUENCE_INCLUDED_REGION",
                prefix: "{",
                suffix: "}",
                tooltip: "Single start,length pair defining the region where primers are allowed (e.g. 20,400).",
              },
              {
                label: "Primer Overlap Positions",
                name: "SEQUENCE_OVERLAP_JUNCTION_LIST",
                prefix: "-",
                suffix: "-",
                tooltip: "Space-separated positions that at least one primer must overlap.",
              },
            ] as const
          ).map(({ label, name, prefix, suffix, tooltip }) => (
            <form.Field key={name} name={name}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <FieldItem>
                  <div className="flex items-center gap-2">
                    <FieldLabel field={field} className="service-card-label">
                      {label}
                    </FieldLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <HelpCircle className="service-card-tooltip-icon" />
                          }
                        />
                        <TooltipContent className="max-w-sm">
                          {tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{prefix}</span>
                    <Input
                      value={
                        Array.isArray(field.state.value)
                          ? field.state.value.join(" ")
                          : field.state.value || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        field.handleChange(
                          value.trim() ? value.trim().split(/\s+/) : [],
                        );
                      }}
                      className="service-card-input"
                    />
                    <span>{suffix}</span>
                  </div>
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
          ))}
        </div>

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
            <div className="space-y-3 px-2 py-3">
              <form.Field name="PRIMER_NUM_RETURN">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <div className="flex items-center gap-2">
                      <FieldLabel field={field} className="service-card-label">
                        Number to Return
                      </FieldLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <HelpCircle className="service-card-tooltip-icon" />
                            }
                          />
                          <TooltipContent className="max-w-sm">
                            Maximum number of primer pairs to return.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      value={field.state.value || ""}
                      onChange={(e) => {
                        field.handleChange(e.target.value || undefined);
                      }}
                      placeholder="5"
                      className="service-card-input"
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="service-card-label">Primer Tm (°C)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <HelpCircle className="service-card-tooltip-icon" />
                        }
                      />
                      <TooltipContent className="max-w-sm">
                        Define minimum, optimum, and maximum melting temperatures
                        as well as the maximum pairwise difference.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  {(
                    [
                      { label: "Min", name: "PRIMER_MIN_TM" },
                      { label: "Opt", name: "PRIMER_OPT_TM" },
                      { label: "Max", name: "PRIMER_MAX_TM" },
                      { label: "Max ΔTm", name: "PRIMER_PAIR_MAX_DIFF_TM" },
                    ] as const
                  ).map(({ label, name }) => (
                    <form.Field key={name} name={name}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(field: any) => (
                        <FieldItem>
                          <FieldLabel
                            field={field}
                            className="service-card-sublabel"
                          >
                            {label}
                          </FieldLabel>
                          <Input
                            value={field.state.value || ""}
                            onChange={(e) => {
                              field.handleChange(e.target.value || undefined);
                            }}
                            className="service-card-input"
                          />
                          <FieldErrors field={field} />
                        </FieldItem>
                      )}
                    </form.Field>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="service-card-label">Primer GC%</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <HelpCircle className="service-card-tooltip-icon" />
                        }
                      />
                      <TooltipContent className="max-w-sm">
                        Specify acceptable GC content range for designed primers.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(
                    [
                      { label: "Min", name: "PRIMER_MIN_GC" },
                      { label: "Opt", name: "PRIMER_OPT_GC" },
                      { label: "Max", name: "PRIMER_MAX_GC" },
                    ] as const
                  ).map(({ label, name }) => (
                    <form.Field key={name} name={name}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(field: any) => (
                        <FieldItem>
                          <FieldLabel
                            field={field}
                            className="service-card-sublabel"
                          >
                            {label}
                          </FieldLabel>
                          <Input
                            value={field.state.value || ""}
                            onChange={(e) => {
                              field.handleChange(e.target.value || undefined);
                            }}
                            className="service-card-input"
                          />
                          <FieldErrors field={field} />
                        </FieldItem>
                      )}
                    </form.Field>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(
                  [
                    {
                      label: "Concentration of Monovalent Cations (mM)",
                      name: "PRIMER_SALT_MONOVALENT",
                    },
                    {
                      label: "Annealing Oligo Concentration (nM)",
                      name: "PRIMER_DNA_CONC",
                    },
                    {
                      label: "Concentration of Divalent Cations (mM)",
                      name: "PRIMER_SALT_DIVALENT",
                    },
                    {
                      label: "Concentration of dNTPs (mM)",
                      name: "PRIMER_DNTP_CONC",
                    },
                  ] as const
                ).map(({ label, name }) => (
                  <form.Field key={name} name={name}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(field: any) => (
                      <FieldItem>
                        <FieldLabel
                          field={field}
                          className="service-card-label"
                        >
                          {label}
                        </FieldLabel>
                        <Input
                          value={field.state.value || ""}
                          onChange={(e) => {
                            field.handleChange(e.target.value || undefined);
                          }}
                          className="service-card-input"
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
      </CardContent>
    </Card>
  );
}
