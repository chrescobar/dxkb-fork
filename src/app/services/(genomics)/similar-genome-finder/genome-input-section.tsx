"use client";

import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FieldErrors,
  FieldItem,
  FieldLabel,
} from "@/components/ui/tanstack-form";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { SingleGenomeSelector } from "@/components/services/single-genome-selector";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { similarGenomeFinderSelectGenome } from "@/lib/services/info/similar-genome-finder";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import type { SimilarGenomeFinderController } from "./use-similar-genome-finder-form";

export function GenomeInputSection({
  controller,
  children,
}: {
  controller: SimilarGenomeFinderController;
  children: React.ReactNode;
}) {
  const { form, showAdvanced, setShowAdvanced } = controller;
  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Select a Genome
          <DialogInfoPopup
            title={similarGenomeFinderSelectGenome.title}
            description={similarGenomeFinderSelectGenome.description}
            sections={similarGenomeFinderSelectGenome.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>
      <CardContent className="service-card-content space-y-6">
        <form.Field name="selectedGenomeId">
          {(field) => (
            <FieldItem>
              <FieldLabel field={field} className="service-card-label">
                Search by Genome Name or Genome ID
              </FieldLabel>
              <SingleGenomeSelector
                placeholder="e.g. Mycobacterium tuberculosis H37Rv"
                value={field.state.value}
                onChange={(value) => {
                  field.handleChange(value);
                  if (value.trim()) form.setFieldValue("fasta_file", "");
                }}
              />
              <FieldErrors field={field} />
            </FieldItem>
          )}
        </form.Field>
        <form.Field name="fasta_file">
          {(field) => (
            <FieldItem>
              <FieldLabel field={field} className="service-card-label">
                Or Upload FASTA/FASTQ
              </FieldLabel>
              <WorkspaceObjectSelector
                preset="contigsOrReads"
                placeholder="Select a FASTA/FASTQ file..."
                value={field.state.value}
                onObjectSelect={(object: WorkspaceObject) => {
                  field.handleChange(object.path);
                  form.setFieldValue("selectedGenomeId", "");
                }}
              />
              <FieldErrors field={field} />
            </FieldItem>
          )}
        </form.Field>
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
            {children}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
