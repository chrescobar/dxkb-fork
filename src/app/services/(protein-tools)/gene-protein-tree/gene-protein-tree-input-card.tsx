"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { phylogeneticTreeInput } from "@/lib/services/info/phylogenetic-tree";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import type { WorkspaceSelectorPreset } from "@/components/workspace/workspace-selector-presets";
import type { GeneProteinTreeFormData } from "@/lib/forms/(protein-tools)/gene-protein-tree/gene-protein-tree-form-schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServiceForm { Field: any }

interface SelectedItem {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface GeneProteinTreeInputCardProps {
  form: ServiceForm;
  alphabet: GeneProteinTreeFormData["alphabet"];
  alignedFastaPreset: WorkspaceSelectorPreset;
  unalignedFastaPreset: WorkspaceSelectorPreset;
  selectedFeatureGroupObject: WorkspaceObject | null;
  selectedAlignedFastaObject: WorkspaceObject | null;
  selectedUnalignedFastaObject: WorkspaceObject | null;
  selectedItemsForTable: SelectedItem[];
  onFeatureGroupChange: (object: WorkspaceObject | null) => void;
  onAlignedFastaChange: (object: WorkspaceObject | null) => void;
  onUnalignedFastaChange: (object: WorkspaceObject | null) => void;
  onAddSequence: (source: "feature" | "aligned" | "unaligned") => void;
  onRemoveSequence: (id: string) => void;
}

export function GeneProteinTreeInputCard({
  form,
  alphabet,
  alignedFastaPreset,
  unalignedFastaPreset,
  selectedFeatureGroupObject,
  selectedAlignedFastaObject,
  selectedUnalignedFastaObject,
  selectedItemsForTable,
  onFeatureGroupChange,
  onAlignedFastaChange,
  onUnalignedFastaChange,
  onAddSequence,
  onRemoveSequence,
}: GeneProteinTreeInputCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Input
          <DialogInfoPopup
            title={phylogeneticTreeInput.title}
            description={phylogeneticTreeInput.description}
            sections={phylogeneticTreeInput.sections}
          />
        </RequiredFormCardTitle>
        <CardDescription>Choose fasta file or features for tree.</CardDescription>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="space-y-4">
          <form.Field name="alphabet">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value) =>
                    value != null &&
                    field.handleChange(value as GeneProteinTreeFormData["alphabet"])
                  }
                  className="service-radio-group-horizontal"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="DNA" id="DNA" />
                    <Label htmlFor="DNA">DNA</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="Protein" id="Protein" />
                    <Label htmlFor="Protein">Protein</Label>
                  </div>
                </RadioGroup>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          <div className="space-y-2">
            <Label className="service-card-label">Feature Group</Label>
            <div className="flex gap-2">
              <WorkspaceObjectSelector
                preset="featureGroup"
                placeholder="Optional"
                onSelectedObjectChange={onFeatureGroupChange}
                value={selectedFeatureGroupObject?.path}
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => onAddSequence("feature")}
                disabled={!selectedFeatureGroupObject}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="service-card-label">
              {alphabet === "DNA" ? "DNA" : "Protein"} Aligned FASTA
            </Label>
            <div className="flex gap-2">
              <WorkspaceObjectSelector
                preset={alignedFastaPreset}
                placeholder="Optional"
                onSelectedObjectChange={onAlignedFastaChange}
                value={selectedAlignedFastaObject?.path}
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => onAddSequence("aligned")}
                disabled={!selectedAlignedFastaObject}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="service-card-label">
              {alphabet === "DNA" ? "DNA" : "Protein"} Unaligned FASTA
            </Label>
            <div className="flex gap-2">
              <WorkspaceObjectSelector
                preset={unalignedFastaPreset}
                placeholder="Optional"
                onSelectedObjectChange={onUnalignedFastaChange}
                value={selectedUnalignedFastaObject?.path}
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => onAddSequence("unaligned")}
                disabled={!selectedUnalignedFastaObject}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <form.Field name="sequences">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <SelectedItemsTable
                  title="Selected file / feature group"
                  items={selectedItemsForTable}
                  onRemove={onRemoveSequence}
                  className="max-h-84 overflow-y-auto"
                  allowDuplicates={false}
                  description="No mixing of DNA and Protein FASTA files is allowed."
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
