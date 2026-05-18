"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { metagenomicBinningStartWith } from "@/lib/services/info/metagenomic-binning";
import type { MetagenomicBinningFormData } from "@/lib/forms/(metagenomics)/metagenomic-binning/metagenomic-binning-form-schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServiceForm { Field: any }

interface MetagenomicBinningStartWithCardProps {
  form: ServiceForm;
}

export function MetagenomicBinningStartWithCard({
  form,
}: MetagenomicBinningStartWithCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <CardTitle className="service-card-title">
          Start With
          <DialogInfoPopup
            title={metagenomicBinningStartWith.title}
            description={metagenomicBinningStartWith.description}
            sections={metagenomicBinningStartWith.sections}
          />
        </CardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <form.Field name="start_with">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <FieldItem>
              <RadioGroup
                value={field.state.value}
                onValueChange={(value) =>
                  value != null &&
                  field.handleChange(
                    value as MetagenomicBinningFormData["start_with"],
                  )
                }
                className="service-radio-group-horizontal"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="reads" id="reads" />
                  <Label htmlFor="reads">Read Files</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="contigs" id="contigs" />
                  <Label htmlFor="contigs">Assembled Contigs</Label>
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
