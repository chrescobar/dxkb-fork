"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import type { ServiceCardForm } from "@/lib/services/service-definition";
import type { ProteomeComparisonFormData } from "@/lib/forms/(protein-tools)/proteome-comparison/proteome-comparison-form-schema";
import { proteomeComparisonParameters } from "@/lib/services/info/proteome-comparison";

interface ProteomeComparisonParametersCardProps {
  form: ServiceCardForm<ProteomeComparisonFormData>;
  showAdvancedParams: boolean;
  onShowAdvancedChange: (open: boolean) => void;
}

export function ProteomeComparisonParametersCard({
  form,
  showAdvancedParams,
  onShowAdvancedChange,
}: ProteomeComparisonParametersCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <CardTitle className="service-card-title">
          Parameters
          <DialogInfoPopup
            title={proteomeComparisonParameters.title}
            description={proteomeComparisonParameters.description}
            sections={proteomeComparisonParameters.sections}
          />
        </CardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="space-y-4">
          <div className="flex flex-col space-y-4">
            <OutputLocationFields form={form} required={true} />
          </div>

          <Collapsible
            open={showAdvancedParams}
            onOpenChange={onShowAdvancedChange}
            className="service-collapsible-container"
          >
            <CollapsibleTrigger className="service-collapsible-trigger text-sm font-medium">
              Advanced Parameters (Optional)
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAdvancedParams ? "rotate-180 transform" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="service-collapsible-content">
              <div className="service-card-content-grid">
                <form.Field name="min_seq_cov">
                  {(field) => (
                    <FieldItem>
                      <Label className="service-card-sublabel">
                        Minimum % Coverage
                      </Label>
                      <NumberInput
                        name={field.name}
                        value={field.state.value}
                        min={10}
                        max={100}
                        stepper={5}
                        onValueChange={(value) => {
                          if (value !== undefined) field.handleChange(value);
                        }}
                        className="bg-muted service-card-input relative [appearance:textfield] rounded-r-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>

                <form.Field name="max_e_val">
                  {(field) => (
                    <FieldItem>
                      <Label className="service-card-sublabel">
                        BLAST E-Value
                      </Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="1e-5"
                        className="service-card-input"
                      />
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>

                <form.Field name="min_ident">
                  {(field) => (
                    <FieldItem>
                      <Label className="service-card-sublabel">
                        Minimum % Identity
                      </Label>
                      <NumberInput
                        name={field.name}
                        value={field.state.value}
                        min={10}
                        max={100}
                        stepper={5}
                        onValueChange={(value) => {
                          if (value !== undefined) field.handleChange(value);
                        }}
                        className="bg-muted service-card-input relative [appearance:textfield] rounded-r-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <FieldErrors field={field} />
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
