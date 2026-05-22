"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import type { UseMsaReferenceOptionsReturn } from "@/hooks/services/use-msa-reference-options";
import * as MsaSnpAnalysis from "@/lib/forms/(protein-tools)/msa-snp-analysis/msa-snp-analysis-form-schema";
import type { ServiceCardForm } from "@/lib/services/service-definition";

interface MsaReferenceSequenceCardProps {
  form: ServiceCardForm<MsaSnpAnalysis.MsaSnpAnalysisFormData>;
  referenceOptions: UseMsaReferenceOptionsReturn;
  availableRefTypes: MsaSnpAnalysis.MsaSnpAnalysisFormData["ref_type"][];
  selectGenomegroup: string[];
  referenceFastaText: string;
  setReferenceFastaText: (text: string) => void;
  referenceFastaValidationResult: { valid: boolean; message: string; numseq: number } | null;
}

export function MsaReferenceSequenceCard({
  form,
  referenceOptions,
  availableRefTypes,
  selectGenomegroup,
  referenceFastaText,
  setReferenceFastaText,
  referenceFastaValidationResult,
}: MsaReferenceSequenceCardProps) {
  const [genomeIdDropdownOpen, setGenomeIdDropdownOpen] = useState(false);

  const {
    refType,
    featureOptions,
    genomeOptions,
    selectedFeatureId,
    selectedGenomeId,
    setSelectedFeatureId,
    setSelectedGenomeId,
    isLoadingFeatures,
    isLoadingGenomes,
  } = referenceOptions;

  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Select a reference sequence:
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent className="service-card-content">
        <div className="space-y-4">
          <form.Field name="ref_type">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value: string) => {
                    if (value == null) return;
                    field.handleChange(
                      value as MsaSnpAnalysis.MsaSnpAnalysisFormData["ref_type"],
                    );
                    // Clear ref_string when changing ref_type
                    if (value === "none" || value === "first") {
                      form.setFieldValue("ref_string", "");
                      setSelectedFeatureId("");
                      setSelectedGenomeId("");
                      setReferenceFastaText("");
                    }
                    // Close genome ID dropdown if ref_type changes away from genome_id
                    if (value !== "genome_id") {
                      setGenomeIdDropdownOpen(false);
                    }
                  }}
                  className="service-radio-group-horizontal"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="none" id="ref_none" />
                    <Label htmlFor="ref_none">None</Label>
                  </div>
                  {availableRefTypes.includes("first" as const) && (
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="first" id="ref_first" />
                      <Label htmlFor="ref_first">First Sequence</Label>
                    </div>
                  )}
                  {availableRefTypes.includes("feature_id" as const) && (
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value="feature_id"
                        id="ref_feature_id"
                      />
                      <Label htmlFor="ref_feature_id">Feature ID</Label>
                    </div>
                  )}
                  {availableRefTypes.includes("genome_id" as const) && (
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value="genome_id"
                        id="ref_genome_id"
                      />
                      <Label htmlFor="ref_genome_id">Genome ID</Label>
                    </div>
                  )}
                  {availableRefTypes.includes("string" as const) && (
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="string" id="ref_string" />
                      <Label htmlFor="ref_string">
                        Input Reference Sequence
                      </Label>
                    </div>
                  )}
                </RadioGroup>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          {/* Feature ID Reference */}
          {refType === "feature_id" && (
            <div className="space-y-2">
              <Label className="service-card-label">Feature ID</Label>
              <Select
                value={selectedFeatureId}
                onValueChange={(value: string | null) => {
                  if (value == null) return;
                  setSelectedFeatureId(value);
                  // Find the selected feature and use patric_id for ref_string
                  const selectedFeature = featureOptions.find(
                    (f) => f.feature_id === value,
                  );
                  const refValue =
                    selectedFeature?.patric_id ||
                    selectedFeature?.feature_id ||
                    value;
                  form.setFieldValue("ref_string", refValue);
                }}
                disabled={isLoadingFeatures}
              >
                <SelectTrigger className="service-card-select-trigger">
                  <SelectValue
                    placeholder={
                      isLoadingFeatures
                        ? "Loading features..."
                        : featureOptions.length === 0
                          ? "No features available"
                          : "Select feature ID"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingFeatures ? (
                    <div className="flex items-center justify-center p-4">
                      <Spinner className="mr-2 h-4 w-4" />
                      <span className="text-muted-foreground text-sm">
                        Loading features...
                      </span>
                    </div>
                  ) : featureOptions.length === 0 ? (
                    <div className="text-muted-foreground p-4 text-center text-sm">
                      No features found in the selected feature group
                    </div>
                  ) : (
                    <SelectGroup>
                      {featureOptions.map((feature) => {
                        const displayLabel = feature.patric_id
                          ? `${feature.patric_id}${feature.product ? ` --- ${feature.product}` : ""}`
                          : feature.feature_id;
                        return (
                          <SelectItem
                            key={feature.feature_id}
                            value={feature.feature_id}
                          >
                            {displayLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
              {isLoadingFeatures && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Spinner className="h-4 w-4" />
                  <span>Loading features from feature group...</span>
                </div>
              )}
              <form.Field name="ref_string">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>
          )}

          {/* Genome ID Reference */}
          {refType === "genome_id" && (
            <div className="space-y-2">
              <Label className="service-card-label">Genome ID</Label>
              <Select
                value={selectedGenomeId}
                open={genomeIdDropdownOpen}
                onOpenChange={(open) => {
                  // Check if a valid genome group is selected before allowing dropdown to open
                  if (
                    open &&
                    (!selectGenomegroup || selectGenomegroup.length === 0)
                  ) {
                    toast.error("Genome Group required", {
                      description:
                        "A valid Genome Group is needed before selecting a Genome ID",
                      closeButton: true,
                    });
                    setGenomeIdDropdownOpen(false);
                    return;
                  }
                  setGenomeIdDropdownOpen(open);
                }}
                onValueChange={(value: string | null) => {
                  if (value == null) return;
                  setSelectedGenomeId(value);
                  form.setFieldValue("ref_string", value);
                }}
                disabled={isLoadingGenomes}
              >
                <SelectTrigger className="service-card-select-trigger">
                  <SelectValue
                    placeholder={
                      isLoadingGenomes
                        ? "Loading genomes..."
                        : genomeOptions.length === 0
                          ? "No genomes available"
                          : "Select genome ID"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingGenomes ? (
                    <div className="flex items-center justify-center p-4">
                      <Spinner className="mr-2 h-4 w-4" />
                      <span className="text-muted-foreground text-sm">
                        Loading genomes...
                      </span>
                    </div>
                  ) : genomeOptions.length === 0 ? (
                    <div className="text-muted-foreground p-4 text-center text-sm">
                      No genomes found in the selected genome group
                    </div>
                  ) : (
                    <SelectGroup>
                      {genomeOptions.map((genome) => {
                        const displayLabel = genome.genome_name
                          ? `${genome.genome_id} -- ${genome.genome_name}`
                          : genome.genome_id;
                        return (
                          <SelectItem
                            key={genome.genome_id}
                            value={genome.genome_id}
                          >
                            {displayLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
              {isLoadingGenomes && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Spinner className="h-4 w-4" />
                  <span>Loading genomes from genome group...</span>
                </div>
              )}
              <form.Field name="ref_string">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>
          )}

          {/* Input Reference Sequence */}
          {refType === "string" && (
            <div className="space-y-2">
              <Textarea
                value={referenceFastaText}
                onChange={(e) => setReferenceFastaText(e.target.value)}
                placeholder="Enter a FASTA record of a reference sequence to align"
                className="service-card-textarea"
                rows={10}
              />
              {referenceFastaValidationResult && (
                <Alert
                  variant={
                    referenceFastaValidationResult.valid
                      ? "default"
                      : "destructive"
                  }
                >
                  <AlertDescription className="text-sm">
                    {referenceFastaValidationResult.valid
                      ? `✓ Valid FASTA with ${referenceFastaValidationResult.numseq} sequence`
                      : referenceFastaValidationResult.message}
                  </AlertDescription>
                </Alert>
              )}
              <form.Field name="ref_string">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
