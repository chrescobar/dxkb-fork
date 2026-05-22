"use client";

import { useStore } from "@tanstack/react-form";
import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { msaSNPAnalysisParameters } from "@/lib/services/info/msa-snp-analysis";
import * as MsaSnpAnalysis from "@/lib/forms/(protein-tools)/msa-snp-analysis/msa-snp-analysis-form-schema";
import { msaSNPAnalysisAligners } from "@/lib/forms/(protein-tools)/msa-snp-analysis/msa-snp-analysis-form-utils";
import type { ServiceCardForm } from "@/lib/services/service-definition";

interface MsaParametersCardProps {
  form: ServiceCardForm<MsaSnpAnalysis.MsaSnpAnalysisFormData>;
  inputStatus: string;
  showStrategy: boolean;
  setShowStrategy: (show: boolean) => void;
  onAlignerChange: (aligner: MsaSnpAnalysis.MsaSnpAnalysisFormData["aligner"]) => void;
}

export function MsaParametersCard({
  form,
  inputStatus,
  showStrategy,
  setShowStrategy,
  onAlignerChange,
}: MsaParametersCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aligner = useStore(form.store, (s: any) => s.values.aligner as MsaSnpAnalysis.MsaSnpAnalysisFormData["aligner"]);

  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Parameters:
          <DialogInfoPopup
            title={msaSNPAnalysisParameters.title}
            description={msaSNPAnalysisParameters.description}
            sections={msaSNPAnalysisParameters.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="space-y-4">
          <form.Field name="aligner">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <Label className="service-card-label">Aligner</Label>
                <Select
                  items={msaSNPAnalysisAligners.map((a) => ({
                    value: a.value,
                    label: a.label,
                  }))}
                  value={field.state.value}
                  onValueChange={(value: string) => {
                    if (value == null) return;
                    onAlignerChange(value as MsaSnpAnalysis.MsaSnpAnalysisFormData["aligner"]);
                  }}
                >
                  <SelectTrigger className="service-card-select-trigger">
                    <SelectValue placeholder="Select aligner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {msaSNPAnalysisAligners.map((a) => (
                        <SelectItem
                          key={a.value}
                          value={a.value}
                        >
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          {/* Strategy Options (only for Mafft and unaligned) */}
          {aligner === "Mafft" && inputStatus === "unaligned" && (
            <Collapsible
              open={showStrategy}
              onOpenChange={setShowStrategy}
              className="service-collapsible-container"
            >
              <CollapsibleTrigger className="service-collapsible-trigger text-sm font-medium">
                Strategy Options
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showStrategy ? "rotate-180 transform" : ""}`}
                />
              </CollapsibleTrigger>

              <CollapsibleContent className="service-collapsible-content">
                <form.Field name="strategy">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem>
                      <RadioGroup
                        value={field.state.value || "auto"}
                        onValueChange={(value: string) =>
                          value != null &&
                          field.handleChange(
                            value as MsaSnpAnalysis.MsaSnpAnalysisFormData["strategy"],
                          )
                        }
                        className="grid w-full gap-2 p-2"
                      >
                        {MsaSnpAnalysis.strategyOptions.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center gap-3"
                          >
                            <RadioGroupItem
                              value={option.value}
                              id={option.value}
                            />
                            <Label
                              htmlFor={option.value}
                              className="text-sm font-normal"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="flex flex-col space-y-4">
            <OutputLocationFields form={form} required={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
