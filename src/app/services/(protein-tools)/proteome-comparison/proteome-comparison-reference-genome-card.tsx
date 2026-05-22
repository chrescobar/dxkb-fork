"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { SingleGenomeSelector } from "@/components/services/single-genome-selector";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import type { ServiceCardForm } from "@/lib/services/service-definition";
import type { ProteomeComparisonFormData } from "@/lib/forms/(protein-tools)/proteome-comparison/proteome-comparison-form-schema";
import { proteomeComparisonReferenceGenome } from "@/lib/services/info/proteome-comparison";

type ReferenceType = "genome" | "fasta" | "feature_group";

interface ProteomeComparisonReferenceGenomeCardProps {
  form: ServiceCardForm<ProteomeComparisonFormData>;
  onReferenceTypeChange: (type: ReferenceType, value: string) => void;
}

export function ProteomeComparisonReferenceGenomeCard({
  form,
  onReferenceTypeChange,
}: ProteomeComparisonReferenceGenomeCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Reference Genome
          <DialogInfoPopup
            title={proteomeComparisonReferenceGenome.title}
            description={proteomeComparisonReferenceGenome.description}
            sections={proteomeComparisonReferenceGenome.sections}
          />
        </RequiredFormCardTitle>
        <CardDescription>
          Select 1 reference genome from the following options
        </CardDescription>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="space-y-4">
          <form.Field name="ref_genome_id">
            {(field) => (
              <FieldItem>
                <Label className="service-card-label">Select a Genome</Label>
                <SingleGenomeSelector
                  placeholder="e.g. Mycobacterium tuberculosis H37Rv"
                  value={field.state.value ?? ""}
                  onChange={(genomeId) => {
                    field.handleChange(genomeId);
                    onReferenceTypeChange("genome", genomeId);
                  }}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          <form.Field name="ref_fasta_file">
            {(field) => (
              <FieldItem>
                <Label className="service-card-label">
                  Or a Protein FASTA File
                </Label>
                <WorkspaceObjectSelector
                  preset="featureProteinFasta"
                  placeholder="Select protein FASTA file (Optional)"
                  value={field.state.value}
                  onSelectedObjectChange={(object: WorkspaceObject | null) => {
                    if (object?.path) {
                      field.handleChange(object.path);
                      onReferenceTypeChange("fasta", object.path);
                    } else {
                      field.handleChange("");
                    }
                  }}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          <form.Field name="ref_feature_group">
            {(field) => (
              <FieldItem>
                <Label className="service-card-label">Or a Feature Group</Label>
                <WorkspaceObjectSelector
                  preset="featureGroup"
                  placeholder="Select feature group (Optional)"
                  value={field.state.value}
                  onSelectedObjectChange={(object: WorkspaceObject | null) => {
                    if (object?.path) {
                      field.handleChange(object.path);
                      onReferenceTypeChange("feature_group", object.path);
                    } else {
                      field.handleChange("");
                    }
                  }}
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
