"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { SingleGenomeSelector } from "@/components/services/single-genome-selector";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { Spinner } from "@/components/ui/spinner";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import type { ServiceCardForm } from "@/lib/services/service-definition";
import {
  maxComparisonGenomes,
  type ProteomeComparisonFormData,
  type ComparisonItem,
} from "@/lib/forms/(protein-tools)/proteome-comparison/proteome-comparison-form-schema";
import {
  getProteomeComparisonDisplayName,
  getComparisonItemTypeLabel,
} from "@/lib/forms/(protein-tools)/proteome-comparison/proteome-comparison-form-utils";
import { proteomeComparisonComparisonGenomes } from "@/lib/services/info/proteome-comparison";

interface ProteomeComparisonComparisonGenomesCardProps {
  form: ServiceCardForm<ProteomeComparisonFormData>;
  selectedCompGenomeId: string;
  setSelectedCompGenomeId: (id: string) => void;
  selectedCompFasta: WorkspaceObject | null;
  setSelectedCompFasta: (obj: WorkspaceObject | null) => void;
  selectedCompFeatureGroup: WorkspaceObject | null;
  setSelectedCompFeatureGroup: (obj: WorkspaceObject | null) => void;
  selectedCompGenomeGroup: WorkspaceObject | null;
  setSelectedCompGenomeGroup: (obj: WorkspaceObject | null) => void;
  isLoadingGenomeGroup: boolean;
  isLoadingCompGenome: boolean;
  comparisonItems: ComparisonItem[];
  totalGenomeCount: number;
  onAddCompGenome: () => void;
  onAddCompFasta: () => void;
  onAddCompFeatureGroup: () => void;
  onAddCompGenomeGroup: () => void;
  onRemoveComparisonItem: (id: string) => void;
}

export function ProteomeComparisonComparisonGenomesCard({
  form,
  selectedCompGenomeId,
  setSelectedCompGenomeId,
  selectedCompFasta,
  setSelectedCompFasta,
  selectedCompFeatureGroup,
  setSelectedCompFeatureGroup,
  selectedCompGenomeGroup,
  setSelectedCompGenomeGroup,
  isLoadingGenomeGroup,
  isLoadingCompGenome,
  comparisonItems,
  totalGenomeCount,
  onAddCompGenome,
  onAddCompFasta,
  onAddCompFeatureGroup,
  onAddCompGenomeGroup,
  onRemoveComparisonItem,
}: ProteomeComparisonComparisonGenomesCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Comparison Genomes
          <DialogInfoPopup
            title={proteomeComparisonComparisonGenomes.title}
            description={proteomeComparisonComparisonGenomes.description}
            sections={proteomeComparisonComparisonGenomes.sections}
          />
        </RequiredFormCardTitle>
        <CardDescription>
          Add up to {maxComparisonGenomes} genomes to compare (use plus buttons
          to add)
        </CardDescription>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="space-y-4">
          {/* Select Genome */}
          <div className="space-y-2">
            <Label className="service-card-label">Select Genome</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SingleGenomeSelector
                  placeholder="Select genome"
                  value={selectedCompGenomeId}
                  onChange={setSelectedCompGenomeId}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onAddCompGenome}
                disabled={
                  !selectedCompGenomeId ||
                  totalGenomeCount >= maxComparisonGenomes ||
                  isLoadingCompGenome
                }
              >
                {isLoadingCompGenome ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Select Protein FASTA File */}
          <div className="space-y-2">
            <Label className="service-card-label">
              And/Or Select Protein FASTA File
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <WorkspaceObjectSelector
                  preset="featureProteinFasta"
                  placeholder="Select protein FASTA file (Optional)"
                  value={selectedCompFasta?.path}
                  onSelectedObjectChange={(object: WorkspaceObject | null) => {
                    setSelectedCompFasta(object);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onAddCompFasta}
                disabled={
                  !selectedCompFasta ||
                  totalGenomeCount >= maxComparisonGenomes
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Select Feature Group */}
          <div className="space-y-2">
            <Label className="service-card-label">
              And/Or Select Feature Group
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <WorkspaceObjectSelector
                  preset="featureGroup"
                  placeholder="Select feature group (Optional)"
                  value={selectedCompFeatureGroup?.path}
                  onSelectedObjectChange={(object: WorkspaceObject | null) => {
                    setSelectedCompFeatureGroup(object);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onAddCompFeatureGroup}
                disabled={
                  !selectedCompFeatureGroup ||
                  totalGenomeCount >= maxComparisonGenomes
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Select Genome Group */}
          <div className="space-y-2">
            <Label className="service-card-label">
              And/Or Select Genome Group
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <WorkspaceObjectSelector
                  preset="genomeGroup"
                  placeholder="Select genome group (Optional)"
                  value={selectedCompGenomeGroup?.path}
                  onSelectedObjectChange={(object: WorkspaceObject | null) => {
                    setSelectedCompGenomeGroup(object);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onAddCompGenomeGroup}
                disabled={
                  !selectedCompGenomeGroup ||
                  totalGenomeCount >= maxComparisonGenomes ||
                  isLoadingGenomeGroup
                }
              >
                {isLoadingGenomeGroup ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Selected Genome Table */}
          <div className="space-y-2">
            <SelectedItemsTable
              title="Selected Genome Table"
              items={comparisonItems.map((item: ComparisonItem) => ({
                id: item.id,
                name: getProteomeComparisonDisplayName(item.name),
                type: getComparisonItemTypeLabel(item.type),
                description:
                  item.type === "genome_group" && item.genome_ids
                    ? `${item.genome_ids.length} genome(s)`
                    : undefined,
              }))}
              onRemove={onRemoveComparisonItem}
              emptyMessage="No genomes selected. Add genomes using the options above."
              className="max-h-80 overflow-y-auto"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {totalGenomeCount} / {maxComparisonGenomes} genome(s) selected
              </span>
            </div>

            <form.Field name="comparison_items">
              {(field) => (
                <FieldItem>
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
