import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FieldErrors, FieldItem } from "@/components/ui/tanstack-form";
import { Label } from "@/components/ui/label";
import OutputFolder from "@/components/services/output-folder";
import { RequiredFormLabelInfo } from "@/components/forms/required-form-components";
import {
  blastServiceDatabaseSource,
  blastServiceDatabaseType,
} from "@/lib/services/info/blast";
import { blastPrecomputedDatabases } from "@/types/services";
import {
  evalueOptionsBlast,
  maxHitsOptionsBlast,
} from "@/lib/forms/(genomics)/blast/blast-form-utils";
import type { BlastFormData } from "@/lib/forms/(genomics)/blast/blast-form-schema";
import type { WorkspaceSelectorPreset } from "@/components/workspace/workspace-selector-presets";
import type { BlastForm } from "./page";
import { DatabaseSelector } from "./database-selector";
import { OptionSelect } from "./option-select";

interface ParametersProps {
  form: BlastForm;
  database: BlastFormData["db_precomputed_database"];
  dbPreset: WorkspaceSelectorPreset;
  databaseTypes: readonly { label: string; value: string }[];
  outputPath: string;
  showAdvanced: boolean;
  setShowAdvanced: (open: boolean) => void;
  onDatabaseChange: (
    database: BlastFormData["db_precomputed_database"],
  ) => void;
  onOutputValidationChange: (valid: boolean) => void;
}

export function BlastParameters({
  form,
  database,
  dbPreset,
  databaseTypes,
  outputPath,
  showAdvanced,
  setShowAdvanced,
  onDatabaseChange,
  onOutputValidationChange,
}: ParametersProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <CardTitle className="service-card-title">Parameters</CardTitle>
      </CardHeader>
      <CardContent className="service-card-content">
        <div className="service-card-row">
          <form.Field name="db_precomputed_database">
            {(field) => (
              <FieldItem className="w-full">
                <RequiredFormLabelInfo
                  label="Database Source"
                  infoPopup={blastServiceDatabaseSource}
                />
                <OptionSelect
                  label="Database Source"
                  value={field.state.value}
                  options={blastPrecomputedDatabases}
                  onChange={(value) => {
                    field.handleChange(
                      value as BlastFormData["db_precomputed_database"],
                    );
                    onDatabaseChange(
                      value as BlastFormData["db_precomputed_database"],
                    );
                  }}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
          <form.Field name="db_type">
            {(field) => (
              <FieldItem className="w-full">
                <RequiredFormLabelInfo
                  label="Database Type"
                  infoPopup={blastServiceDatabaseType}
                />
                <OptionSelect
                  label="Database Type"
                  value={field.state.value}
                  options={databaseTypes}
                  onChange={(value) => {
                    field.handleChange(value as BlastFormData["db_type"]);
                  }}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
        </div>
        <DatabaseSelector form={form} database={database} preset={dbPreset} />
        <div className="service-card-row">
          <form.Field name="output_path">
            {(field) => (
              <FieldItem className="service-card-row-item">
                <OutputFolder
                  required
                  value={field.state.value}
                  onChange={field.handleChange}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
          <form.Field name="output_file">
            {(field) => (
              <FieldItem className="service-card-row-item">
                <OutputFolder
                  variant="name"
                  required
                  value={field.state.value}
                  onChange={field.handleChange}
                  outputFolderPath={outputPath}
                  onValidationChange={onOutputValidationChange}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
        </div>
        <Collapsible
          open={showAdvanced}
          onOpenChange={setShowAdvanced}
          className="service-collapsible-container"
        >
          <CollapsibleTrigger className="service-collapsible-trigger">
            Advanced Options
            <ChevronDown
              className={`size-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="service-collapsible-content">
            <div className="service-card-content-grid">
              <form.Field name="blast_max_hits">
                {(field) => (
                  <FieldItem>
                    <Label className="service-card-label">Max Hits</Label>
                    <OptionSelect
                      label="Max Hits"
                      value={field.state.value}
                      options={maxHitsOptionsBlast}
                      onChange={field.handleChange}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
              <form.Field name="blast_evalue_cutoff">
                {(field) => (
                  <FieldItem>
                    <Label className="service-card-label">
                      E-Value Threshold
                    </Label>
                    <OptionSelect
                      label="E-Value Threshold"
                      value={field.state.value}
                      options={evalueOptionsBlast}
                      onChange={field.handleChange}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
