"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { sarsCov2GenomeAnalysisStartWith } from "@/lib/services/info/sars-cov2-genome-analysis";
import type { ServiceCardForm } from "@/lib/services/service-definition";
import type { SarsCov2GenomeAnalysisFormData } from "@/lib/forms/(viral-tools)/sars-cov2-genome-analysis/sars-cov2-genome-analysis-form-schema";

interface SarsCov2StartWithCardProps {
  form: ServiceCardForm<SarsCov2GenomeAnalysisFormData>;
}

export function SarsCov2StartWithCard({ form }: SarsCov2StartWithCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Start With
          <DialogInfoPopup
            title={sarsCov2GenomeAnalysisStartWith.title}
            description={sarsCov2GenomeAnalysisStartWith.description}
            sections={sarsCov2GenomeAnalysisStartWith.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>
      <CardContent className="service-card-content">
        <form.Field name="input_type">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <FieldItem>
              <RadioGroup
                value={field.state.value}
                onValueChange={(value) =>
                  value != null && field.handleChange(value)
                }
                className="service-radio-group-horizontal"
              >
                <div className="service-radio-group-item flex items-center gap-2">
                  <RadioGroupItem value="reads" id="start-reads" />
                  <Label htmlFor="start-reads">Read File</Label>
                </div>
                <div className="service-radio-group-item flex items-center gap-2">
                  <RadioGroupItem value="contigs" id="start-contigs" />
                  <Label htmlFor="start-contigs">Assembled Contigs</Label>
                </div>
              </RadioGroup>
              <FieldErrors field={field} />
            </FieldItem>
          )}
        </form.Field>
      </CardContent>
    </Card>
  );
}
