"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { metaCATSParameters } from "@/lib/services/info/meta-cats";
import type { ServiceCardForm } from "@/lib/services/service-definition";
import type { MetaCatsFormData } from "@/lib/forms/(protein-tools)/meta-cats/meta-cats-form-schema";

interface MetaCatsParametersCardProps {
  form: ServiceCardForm<MetaCatsFormData>;
}

export function MetaCatsParametersCard({ form }: MetaCatsParametersCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Parameters
          <DialogInfoPopup
            title={metaCATSParameters.title}
            description={metaCATSParameters.description}
            sections={metaCATSParameters.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="space-y-4">
          <form.Field name="p_value">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <Label className="service-card-label">P-Value</Label>
                <NumberInput
                  name={field.name}
                  value={field.state.value}
                  min={0}
                  max={1}
                  stepper={0.01}
                  decimalScale={2}
                  onValueChange={(value: number | undefined) => {
                    if (value !== undefined) field.handleChange(value);
                  }}
                  className="bg-muted service-card-input relative max-w-32 [appearance:textfield] rounded-r-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          <div className="flex flex-col space-y-4">
            <OutputLocationFields form={form} required={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
