import { FieldErrors, FieldItem } from "@/components/ui/tanstack-form";
import { RequiredFormLabel } from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import type { BlastFormData } from "@/lib/forms/(genomics)/blast/blast-form-schema";
import type { WorkspaceSelectorPreset } from "@/components/workspace/workspace-selector-presets";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import type { BlastForm } from "./page";

export function DatabaseSelector({
  form,
  database,
  preset,
}: {
  form: BlastForm;
  database: BlastFormData["db_precomputed_database"];
  preset: WorkspaceSelectorPreset;
}) {
  const config =
    database === "selGenome"
      ? ["db_genome_list", "Select a genome", "unspecified", true]
      : database === "selGroup"
        ? ["db_genome_group", "Select a genome group", "genomeGroup", false]
        : database === "selFeatureGroup"
          ? [
              "db_feature_group",
              "Select a feature group",
              "featureGroup",
              false,
            ]
          : database === "selTaxon"
            ? ["db_taxon_list", "Select a taxon", "unspecified", true]
            : database === "selFasta"
              ? ["db_fasta_file", "Select a FASTA file", preset, false]
              : null;
  if (!config) return null;
  const [name, label, objectPreset, array] = config;
  const placeholder = typeof label === "string" ? `${label}...` : "Select...";
  return (
    <div className="service-card-row">
      <div className="service-card-row-item">
        <RequiredFormLabel className="service-card-label">
          {label}
        </RequiredFormLabel>
        <form.Field name={name as keyof BlastFormData}>
          {(field) => (
            <FieldItem>
              <WorkspaceObjectSelector
                preset={objectPreset as WorkspaceSelectorPreset}
                placeholder={placeholder}
                onObjectSelect={(object: WorkspaceObject) => {
                  field.handleChange(array ? [object.path] : object.path);
                }}
              />
              <FieldErrors field={field} />
            </FieldItem>
          )}
        </form.Field>
      </div>
    </div>
  );
}
