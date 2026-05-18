"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Label } from "@/components/ui/label";
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
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { phylogeneticTreeAlignmentParameters } from "@/lib/services/info/phylogenetic-tree";

const thresholdOptions = [
  "0",
  "0.1",
  "0.2",
  "0.3",
  "0.4",
  "0.5",
  "0.6",
  "0.7",
  "0.8",
  "0.9",
  "1",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServiceForm { Field: any }

interface AlignmentParametersCardProps {
  form: ServiceForm;
}

export function AlignmentParametersCard({ form }: AlignmentParametersCardProps) {
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
                <Label className="service-card-label">
                  Trim Ends of Alignment Threshold
                </Label>
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
                <Label className="service-card-label">
                  Remove Gappy Sequences Threshold
                </Label>
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
