import { FieldErrors, FieldItem } from "@/components/ui/tanstack-form";
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
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import OutputFolder from "@/components/services/output-folder";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { sarsCov2WastewaterAnalysisParameters } from "@/lib/services/info/sars-cov2-wastewater-analysis";
import { recipeOptions } from "@/lib/forms/(viral-tools)/sars-cov2-wastewater-analysis/sars-cov2-wastewater-analysis-form-schema";
import type { WastewaterForm } from "./page";

export function WastewaterParameters({
  form,
  outputPath,
  onValidationChange,
}: {
  form: WastewaterForm;
  outputPath: string;
  onValidationChange: (valid: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Parameters
          <DialogInfoPopup
            title={sarsCov2WastewaterAnalysisParameters.title}
            sections={sarsCov2WastewaterAnalysisParameters.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>
      <CardContent className="service-card-content space-y-4">
        <div className="space-y-2">
          <Label className="service-card-label">Strategy</Label>
          <form.Field name="recipe">
            {(field) => (
              <FieldItem>
                <Select
                  items={recipeOptions}
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value != null) field.handleChange(value);
                  }}
                >
                  <SelectTrigger
                    className="service-card-select-trigger"
                    aria-label="Strategy"
                  >
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {recipeOptions.map((recipe) => (
                        <SelectItem key={recipe.value} value={recipe.value}>
                          {recipe.label}
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
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <form.Field name="output_path">
            {(field) => (
              <FieldItem className="flex-1">
                <OutputFolder
                  value={field.state.value}
                  onChange={field.handleChange}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
          <form.Field name="output_file">
            {(field) => (
              <FieldItem className="flex-1">
                <OutputFolder
                  variant="name"
                  value={field.state.value}
                  onChange={field.handleChange}
                  outputFolderPath={outputPath}
                  onValidationChange={onValidationChange}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
        </div>
      </CardContent>
    </Card>
  );
}
