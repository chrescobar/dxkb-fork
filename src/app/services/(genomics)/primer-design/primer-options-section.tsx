"use client";

import { HelpCircle } from "lucide-react";
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

const sizeFields = [
  { label: "Min", name: "PRIMER_MIN_SIZE" },
  { label: "Opt", name: "PRIMER_OPT_SIZE" },
  { label: "Max", name: "PRIMER_MAX_SIZE" },
] as const;

const regionFields = [
  {
    label: "Excluded Regions",
    name: "SEQUENCE_EXCLUDED_REGION",
    prefix: "<",
    suffix: ">",
    tooltip:
      "Space-separated start,length pairs that primers must avoid (e.g. 401,7 68,3).",
  },
  {
    label: "Target Region",
    name: "SEQUENCE_TARGET",
    prefix: "[",
    suffix: "]",
    tooltip:
      "Space-separated start,length pairs that primers must flank (e.g. 50,2).",
  },
  {
    label: "Included Regions",
    name: "SEQUENCE_INCLUDED_REGION",
    prefix: "{",
    suffix: "}",
    tooltip:
      "Single start,length pair defining the region where primers are allowed (e.g. 20,400).",
  },
  {
    label: "Primer Overlap Positions",
    name: "SEQUENCE_OVERLAP_JUNCTION_LIST",
    prefix: "-",
    suffix: "-",
    tooltip: "Space-separated positions that at least one primer must overlap.",
  },
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

export function PrimerOptionsSection({
  controller,
}: {
  controller: PrimerDesignController;
}) {
  const { form } = controller;
  return (
    <>
      <form.Field name="PRIMER_PRODUCT_SIZE_RANGE">
        {(field) => (
          <FieldItem>
            <div className="flex items-center gap-2">
              <FieldLabel field={field} className="service-card-label">
                Product Size Range (bp)
              </FieldLabel>
              <Help>
                Minimum, optimum, and maximum lengths (in bases) of the PCR
                product. Primer3 attempts to pick primers close to the optimum
                length.
              </Help>
            </div>
            <Input
              id={field.name}
              value={(field.state.value ?? []).join(" ")}
              onChange={(event) => {
                const value = event.target.value;
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
          <Help>
            Specify minimum, optimum, and maximum primer lengths. Primer3 will
            not pick primers shorter than the minimum or longer than the
            maximum.
          </Help>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {sizeFields.map(({ label, name }) => (
            <form.Field key={name} name={name}>
              {(field) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-sublabel">
                    {label}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value || ""}
                    onChange={(event) =>
                      { field.handleChange(event.target.value || undefined); }
                    }
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
        {regionFields.map(({ label, name, prefix, suffix, tooltip }) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <FieldItem>
                <div className="flex items-center gap-2">
                  <FieldLabel field={field} className="service-card-label">
                    {label}
                  </FieldLabel>
                  <Help>{tooltip}</Help>
                </div>
                <div className="flex items-center gap-2">
                  <span>{prefix}</span>
                  <Input
                    id={field.name}
                    value={(field.state.value ?? []).join(" ")}
                    onChange={(event) => {
                      const value = event.target.value;
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
    </>
  );
}
