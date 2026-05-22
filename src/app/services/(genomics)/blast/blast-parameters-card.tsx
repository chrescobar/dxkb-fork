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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import {
  RequiredFormLabelInfo,
  RequiredFormLabel,
} from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import {
  blastServiceDatabaseSource,
  blastServiceDatabaseType,
} from "@/lib/services/info/blast";
import { blastPrecomputedDatabases } from "@/types/services";
import { maxHitsOptionsBlast, evalueOptionsBlast } from "@/lib/forms/(genomics)/blast/blast-form-utils";
import type { BlastFormData } from "@/lib/forms/(genomics)/blast/blast-form-schema";
import type { WorkspaceSelectorPreset } from "@/components/workspace/workspace-selector-presets";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import type { ServiceCardForm } from "@/lib/services/service-definition";

interface BlastParametersCardProps {
  form: ServiceCardForm<BlastFormData>;
  dbPrecomputedDatabase: BlastFormData["db_precomputed_database"];
  availableDatabaseTypes: { value: string; label: string }[];
  currentBlastProgram: string;
  dbFastaPreset: WorkspaceSelectorPreset;
  showAdvanced: boolean;
  onShowAdvancedChange: (open: boolean) => void;
  onDatabaseSourceChange: (db: BlastFormData["db_precomputed_database"]) => void;
}

export function BlastParametersCard({
  form,
  dbPrecomputedDatabase,
  availableDatabaseTypes,
  currentBlastProgram,
  dbFastaPreset,
  showAdvanced,
  onShowAdvancedChange,
  onDatabaseSourceChange,
}: BlastParametersCardProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <CardTitle className="service-card-title">Parameters</CardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="service-card-row">
          <form.Field name="db_precomputed_database">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem className="w-full">
                <div className="service-card-row-item">
                  <RequiredFormLabelInfo
                    label="Database Source"
                    infoPopup={blastServiceDatabaseSource}
                  />
                  <Select
                    items={blastPrecomputedDatabases}
                    value={field.state.value}
                    onValueChange={(value) => {
                      field.handleChange(
                        value as BlastFormData["db_precomputed_database"],
                      );
                      onDatabaseSourceChange(
                        value as BlastFormData["db_precomputed_database"],
                      );
                    }}
                  >
                    <SelectTrigger className="service-card-select-trigger">
                      <SelectValue placeholder="Select database source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {blastPrecomputedDatabases.map((dbSource) => (
                          <SelectItem key={dbSource.value} value={dbSource.value}>
                            {dbSource.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          <form.Field name="db_type">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem className="w-full">
                <div className="service-card-row-item">
                  <RequiredFormLabelInfo
                    label="Database Type"
                    infoPopup={blastServiceDatabaseType}
                  />
                  <Select
                    items={availableDatabaseTypes}
                    key={`${currentBlastProgram}-${dbPrecomputedDatabase}-${availableDatabaseTypes.length}`}
                    value={field.state.value || ""}
                    onValueChange={(value) => {
                      if (value != null)
                        field.handleChange(value as BlastFormData["db_type"]);
                    }}
                  >
                    <SelectTrigger className="service-card-select-trigger">
                      <SelectValue placeholder="Select database type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {availableDatabaseTypes.map((dbTypeOption) => (
                          <SelectItem
                            key={dbTypeOption.value}
                            value={dbTypeOption.value}
                          >
                            {dbTypeOption.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
        </div>

        {/* Conditional database selector */}
        <div className="service-card-row">
          <div className="service-card-row-item">
            <div
              className={
                dbPrecomputedDatabase === "selGenome"
                  ? "service-card-content-grid-item"
                  : "hidden"
              }
            >
              <RequiredFormLabel className="service-card-label">
                Select a genome
              </RequiredFormLabel>
              <form.Field name="db_genome_list">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <WorkspaceObjectSelector
                      preset="unspecified"
                      placeholder="Genome..."
                      onObjectSelect={(object: WorkspaceObject) => {
                        field.handleChange([object.path]);
                      }}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>

            <div
              className={
                dbPrecomputedDatabase === "selGroup"
                  ? "service-card-content-grid-item"
                  : "hidden"
              }
            >
              <RequiredFormLabel className="service-card-label">
                Select a genome group
              </RequiredFormLabel>
              <form.Field name="db_genome_group">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <WorkspaceObjectSelector
                      preset="genomeGroup"
                      placeholder="Genome group..."
                      onObjectSelect={(object: WorkspaceObject) => {
                        field.handleChange(object.path);
                      }}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>

            <div
              className={
                dbPrecomputedDatabase === "selFeatureGroup"
                  ? "service-card-content-grid-item"
                  : "hidden"
              }
            >
              <RequiredFormLabel className="service-card-label">
                Select a feature group
              </RequiredFormLabel>
              <form.Field name="db_feature_group">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <WorkspaceObjectSelector
                      preset="featureGroup"
                      placeholder="Feature group..."
                      onObjectSelect={(object: WorkspaceObject) => {
                        field.handleChange(object.path);
                      }}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>

            <div
              className={
                dbPrecomputedDatabase === "selTaxon"
                  ? "service-card-content-grid-item"
                  : "hidden"
              }
            >
              <RequiredFormLabel className="service-card-label">
                Select a taxon
              </RequiredFormLabel>
              <form.Field name="db_taxon_list">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <WorkspaceObjectSelector
                      preset="unspecified"
                      placeholder="Taxon..."
                      onObjectSelect={(object: WorkspaceObject) => {
                        field.handleChange([object.path]);
                      }}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>

            <div
              className={
                dbPrecomputedDatabase === "selFasta"
                  ? "service-card-content-grid-item"
                  : "hidden"
              }
            >
              <RequiredFormLabel className="service-card-label">
                Select a FASTA file
              </RequiredFormLabel>
              <form.Field name="db_fasta_file">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <WorkspaceObjectSelector
                      preset={dbFastaPreset}
                      placeholder="FASTA file..."
                      onObjectSelect={(object: WorkspaceObject) => {
                        field.handleChange(object.path);
                      }}
                    />
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>
          </div>
        </div>

        <OutputLocationFields form={form} required />

        <Collapsible
          open={showAdvanced}
          onOpenChange={onShowAdvancedChange}
          className="service-collapsible-container"
        >
          <CollapsibleTrigger className="service-collapsible-trigger">
            Advanced Options
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="service-collapsible-content">
            <div className="service-card-content-grid">
              <form.Field name="blast_max_hits">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem className="service-card-content-grid-item">
                    <Label htmlFor="blast_max_hits" className="service-card-label">
                      Max Hits
                    </Label>
                    <Select
                      items={maxHitsOptionsBlast}
                      value={field.state.value}
                      onValueChange={(value) =>
                        value != null && field.handleChange(Number(value))
                      }
                    >
                      <SelectTrigger className="service-card-select-trigger">
                        <SelectValue placeholder="Select max hits" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {maxHitsOptionsBlast.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>

              <form.Field name="blast_evalue_cutoff">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem className="service-card-content-grid-item">
                    <Label
                      htmlFor="blast_evalue_cutoff"
                      className="service-card-label"
                    >
                      E-Value Threshold
                    </Label>
                    <Select
                      items={evalueOptionsBlast}
                      value={field.state.value}
                      onValueChange={(value) =>
                        value != null && field.handleChange(Number(value))
                      }
                    >
                      <SelectTrigger className="service-card-select-trigger">
                        <SelectValue placeholder="Select E-Value Threshold" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {evalueOptionsBlast.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
