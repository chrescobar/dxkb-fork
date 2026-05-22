"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import {
  RequiredFormCardTitle,
  RequiredFormLabel,
} from "@/components/forms/required-form-components";
import { phylogeneticTreeAlignmentParameters } from "@/lib/services/info/phylogenetic-tree";
import { thresholdOptions } from "@/lib/forms/shared-schemas";
import type { ServiceCardForm } from "@/lib/services/service-definition";

interface AlignmentParametersCardProps<TForm extends Record<string, unknown>> {
  form: ServiceCardForm<TForm>;
}

export function AlignmentParametersCard<TForm extends Record<string, unknown>>({ form }: AlignmentParametersCardProps<TForm>) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Alignment Parameters
          <DialogInfoPopup
            title={phylogeneticTreeAlignmentParameters.title}
            description={phylogeneticTreeAlignmentParameters.description}
            sections={phylogeneticTreeAlignmentParameters.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="space-y-4">
          <form.Field name="trim_threshold">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <RequiredFormLabel className="service-card-label">
                  Trim Ends of Alignment Threshold
                </RequiredFormLabel>
                <Select
                  items={thresholdOptions.map((v) => ({ value: v, label: v }))}
                  value={field.state.value}
                  onValueChange={(value) =>
                    value != null && field.handleChange(value)
                  }
                >
                  <SelectTrigger className="service-card-select-trigger">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {thresholdOptions.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          <form.Field name="gap_threshold">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <RequiredFormLabel className="service-card-label">
                  Remove Gappy Sequences Threshold
                </RequiredFormLabel>
                <Select
                  items={thresholdOptions.map((v) => ({ value: v, label: v }))}
                  value={field.state.value}
                  onValueChange={(value) =>
                    value != null && field.handleChange(value)
                  }
                >
                  <SelectTrigger className="service-card-select-trigger">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {thresholdOptions.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
        </div>
      </CardContent>
    </Card>
  );
}
