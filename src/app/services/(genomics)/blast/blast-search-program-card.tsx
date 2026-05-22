"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { blastServiceSearchProgram } from "@/lib/services/info/blast";
import type { ServiceCardForm } from "@/lib/services/service-definition";
import type { BlastFormData } from "@/lib/forms/(genomics)/blast/blast-form-schema";

interface BlastSearchProgramCardProps {
  form: ServiceCardForm<BlastFormData>;
}

export function BlastSearchProgramCard({ form }: BlastSearchProgramCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Search Program
          <DialogInfoPopup
            title={blastServiceSearchProgram.title}
            description={blastServiceSearchProgram.description}
            sections={blastServiceSearchProgram.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <form.Field name="blast_program">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <FieldItem>
              <RadioGroup
                value={field.state.value}
                onValueChange={field.handleChange}
                className="grid w-full grid-cols-1 gap-4 md:grid-cols-2"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="blastn" id="blastn" />
                  <Label htmlFor="blastn" className="service-radio-group-label">
                    BLASTN (nucleotide → nucleotide database)
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="blastp" id="blastp" />
                  <Label htmlFor="blastp" className="service-radio-group-label">
                    BLASTP (protein → protein database)
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="blastx" id="blastx" />
                  <Label htmlFor="blastx" className="service-radio-group-label">
                    BLASTX (translated nucleotide → protein database)
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="tblastn" id="tblastn" />
                  <Label
                    htmlFor="tblastn"
                    className="service-radio-group-label"
                  >
                    tBLASTn (protein → translated nucleotide database)
                  </Label>
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
