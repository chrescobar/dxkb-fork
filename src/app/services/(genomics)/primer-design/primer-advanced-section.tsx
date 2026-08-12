"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FieldErrors,
  FieldItem,
  FieldLabel,
} from "@/components/ui/tanstack-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PrimerDesignController } from "./use-primer-design-form";

type ScalarFieldName =
  | "PRIMER_MIN_TM"
  | "PRIMER_OPT_TM"
  | "PRIMER_MAX_TM"
  | "PRIMER_PAIR_MAX_DIFF_TM"
  | "PRIMER_MIN_GC"
  | "PRIMER_OPT_GC"
  | "PRIMER_MAX_GC";

interface ScalarField {
  label: string;
  name: ScalarFieldName;
}

const temperatureFields = [
  { label: "Min", name: "PRIMER_MIN_TM" },
  { label: "Opt", name: "PRIMER_OPT_TM" },
  { label: "Max", name: "PRIMER_MAX_TM" },
  { label: "Max \u0394Tm", name: "PRIMER_PAIR_MAX_DIFF_TM" },
] as const satisfies readonly ScalarField[];
const gcFields = [
  { label: "Min", name: "PRIMER_MIN_GC" },
  { label: "Opt", name: "PRIMER_OPT_GC" },
  { label: "Max", name: "PRIMER_MAX_GC" },
] as const satisfies readonly ScalarField[];
const concentrationFields = [
  {
    label: "Concentration of Monovalent Cations (mM)",
    name: "PRIMER_SALT_MONOVALENT",
  },
  { label: "Annealing Oligo Concentration (nM)", name: "PRIMER_DNA_CONC" },
  {
    label: "Concentration of Divalent Cations (mM)",
    name: "PRIMER_SALT_DIVALENT",
  },
  { label: "Concentration of dNTPs (mM)", name: "PRIMER_DNTP_CONC" },
] as const;

function Help({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={<HelpCircle className="service-card-tooltip-icon" />}
        />
        <TooltipContent className="max-w-sm">{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ScalarFields({
  controller,
  fields,
  columns,
}: {
  controller: PrimerDesignController;
  fields: readonly ScalarField[];
  columns: string;
}) {
  const { form } = controller;
  return (
    <div className={columns}>
      {fields.map(({ label, name }) => (
        <form.Field key={name} name={name}>
          {(field) => (
            <FieldItem>
              <FieldLabel field={field} className="service-card-sublabel">
                {label}
              </FieldLabel>
              <Input
                id={field.name}
                value={field.state.value || ""}
                onChange={(event) => {
                  field.handleChange(event.target.value || undefined);
                }}
                className="service-card-input"
              />
              <FieldErrors field={field} />
            </FieldItem>
          )}
        </form.Field>
      ))}
    </div>
  );
}

export function PrimerAdvancedSection({
  controller,
}: {
  controller: PrimerDesignController;
}) {
  const { form, showAdvanced, setShowAdvanced } = controller;
  return (
    <Collapsible
      open={showAdvanced}
      onOpenChange={setShowAdvanced}
      className="service-collapsible-container"
    >
      <CollapsibleTrigger className="service-collapsible-trigger">
        Advanced Options
        <ChevronDown
          className={`size-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="service-collapsible-content">
        <div className="space-y-3 px-2 py-3">
          <form.Field name="PRIMER_NUM_RETURN">
            {(field) => (
              <FieldItem>
                <div className="flex items-center gap-2">
                  <FieldLabel field={field} className="service-card-label">
                    Number to Return
                  </FieldLabel>
                  <Help>
                    Maximum number of primer pairs to return. Larger values may
                    increase runtime.
                  </Help>
                </div>
                <Input
                  id={field.name}
                  value={field.state.value || ""}
                  onChange={(event) => {
                    field.handleChange(event.target.value || undefined);
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
              <Label className="service-card-label">
                Primer Tm ({"\u00B0"}C)
              </Label>
              <Help>
                Define minimum, optimum, and maximum melting temperatures as
                well as the maximum pairwise difference.
              </Help>
            </div>
            <ScalarFields
              controller={controller}
              fields={temperatureFields}
              columns="grid grid-cols-1 gap-3 sm:grid-cols-4"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="service-card-label">Primer GC%</Label>
              <Help>
                Specify acceptable GC content range for designed primers.
              </Help>
            </div>
            <ScalarFields
              controller={controller}
              fields={gcFields}
              columns="grid grid-cols-1 gap-3 sm:grid-cols-3"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {concentrationFields.map(({ label, name }) => (
              <form.Field key={name} name={name}>
                {(field) => (
                  <FieldItem>
                    <FieldLabel field={field} className="service-card-label">
                      {label}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value || ""}
                      onChange={(event) => {
                        field.handleChange(event.target.value || undefined);
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
  );
}
