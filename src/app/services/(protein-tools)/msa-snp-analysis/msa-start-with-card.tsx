"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { msaSNPAnalysisStartWith } from "@/lib/services/info/msa-snp-analysis";
import * as MsaSnpAnalysis from "@/lib/forms/(protein-tools)/msa-snp-analysis/msa-snp-analysis-form-schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServiceForm { Field: any; store: any }

interface MsaStartWithCardProps {
  form: ServiceForm;
  onStatusChange: (prevStatus: string, newStatus: string) => void;
}

export function MsaStartWithCard({ form, onStatusChange }: MsaStartWithCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Start with:
          <DialogInfoPopup
            title={msaSNPAnalysisStartWith.title}
            description={msaSNPAnalysisStartWith.description}
            sections={msaSNPAnalysisStartWith.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <form.Field name="input_status">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <FieldItem>
              <RadioGroup
                value={field.state.value}
                onValueChange={(value) => {
                  if (value == null) return;
                  const prevStatus = field.state.value;
                  field.handleChange(
                    value as MsaSnpAnalysis.MsaSnpAnalysisFormData["input_status"],
                  );
                  onStatusChange(prevStatus, value);
                }}
                className="service-radio-group-horizontal"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="unaligned" id="unaligned" />
                  <Label htmlFor="unaligned">Unaligned Sequences</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="aligned" id="aligned" />
                  <Label htmlFor="aligned">Aligned Sequences</Label>
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
