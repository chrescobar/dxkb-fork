"use client";

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
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle, RequiredFormLabel } from "@/components/forms/required-form-components";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import { phylogeneticTreeTreeParameters } from "@/lib/services/info/phylogenetic-tree";
import type { GeneProteinTreeFormData } from "@/lib/forms/(protein-tools)/gene-protein-tree/gene-protein-tree-form-schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServiceForm { Field: any; store: any; setFieldValue: (...args: any[]) => void; state: any }

interface GeneProteinTreeTreeParametersCardProps {
  form: ServiceForm;
  substitutionModelOptions: readonly { readonly value: string; readonly label: string }[];
}

export function GeneProteinTreeTreeParametersCard({
  form,
  substitutionModelOptions,
}: GeneProteinTreeTreeParametersCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Tree Parameters
          <DialogInfoPopup
            title={phylogeneticTreeTreeParameters.title}
            description={phylogeneticTreeTreeParameters.description}
            sections={phylogeneticTreeTreeParameters.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="space-y-4">
          <form.Field name="recipe">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value) =>
                    value != null &&
                    field.handleChange(value as GeneProteinTreeFormData["recipe"])
                  }
                  className="service-radio-group-horizontal"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="RAxML" id="raxml" />
                    <Label htmlFor="raxml">RAxML</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="PhyML" id="phyml" />
                    <Label htmlFor="phyml">PhyML</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="FastTree" id="fasttree" />
                    <Label htmlFor="fasttree">FastTree</Label>
                  </div>
                </RadioGroup>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          <form.Field name="substitution_model">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <RequiredFormLabel className="service-card-label">
                  Model
                </RequiredFormLabel>
                <Select
                  items={substitutionModelOptions.map((m) => ({
                    value: m.value,
                    label: m.label,
                  }))}
                  value={field.state.value}
                  onValueChange={(value) =>
                    value != null && field.handleChange(value)
                  }
                >
                  <SelectTrigger id="model" className="service-card-select-trigger">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {substitutionModelOptions.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
