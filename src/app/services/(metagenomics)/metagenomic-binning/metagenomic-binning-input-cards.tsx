"use client";

import { ChevronRight, HelpCircle } from "lucide-react";
import type { MetagenomicBinningController } from "./use-metagenomic-binning-controller";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import SelectedItemsTable from "@/components/services/selected-items-table";
import SraRunAccessionWithValidation from "@/components/services/sra-run-accession-with-validation";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FieldErrors,
  FieldItem,
  FieldLabel,
} from "@/components/ui/tanstack-form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MetagenomicBinningFormData } from "@/lib/forms/(metagenomics)/metagenomic-binning/metagenomic-binning-form-schema";
import { getLibraryTypeLabel } from "@/lib/forms/shared-schemas";
import {
  metagenomicBinningInputFile,
  metagenomicBinningStartWith,
} from "@/lib/services/info/metagenomic-binning";
import type { WorkspaceObject } from "@/lib/services/workspace/types";

type Controller = MetagenomicBinningController;

export function BinningStartWithCard({
  controller,
}: {
  controller: Controller;
}) {
  return (
    <div className="md:col-span-12">
      <Card>
        <CardHeader className="service-card-header">
          <CardTitle className="service-card-title">
            Start With
            <DialogInfoPopup
              title={metagenomicBinningStartWith.title}
              description={metagenomicBinningStartWith.description}
              sections={metagenomicBinningStartWith.sections}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="service-card-content">
          <controller.form.Field name="start_with">
            {(field) => (
              <FieldItem>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value != null)
                      field.handleChange(
                        value as MetagenomicBinningFormData["start_with"],
                      );
                  }}
                  className="service-radio-group-horizontal"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="reads" id="reads" />
                    <Label htmlFor="reads">Read Files</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="contigs" id="contigs" />
                    <Label htmlFor="contigs">Assembled Contigs</Label>
                  </div>
                </RadioGroup>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </controller.form.Field>
        </CardContent>
      </Card>
    </div>
  );
}

export function BinningReadInputCards({
  controller,
}: {
  controller: Controller;
}) {
  const { state, setState, selectedLibraries } = controller;
  return (
    <>
      <div className="md:col-span-7">
        <Card className="h-full">
          <CardHeader className="service-card-header">
            <RequiredFormCardTitle className="service-card-title">
              Input File
              <DialogInfoPopup
                title={metagenomicBinningInputFile.title}
                description={metagenomicBinningInputFile.description}
                sections={metagenomicBinningInputFile.sections}
              />
            </RequiredFormCardTitle>
          </CardHeader>
          <CardContent className="service-card-content space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="service-card-label">
                  Paired Read Library
                </Label>
                <div className="mx-4 h-px flex-1 bg-border" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Add paired read library"
                  onClick={controller.handlePairedLibraryAdd}
                  disabled={!state.pairedRead1 || !state.pairedRead2}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
              <div className="space-y-3">
                <WorkspaceObjectSelector
                  preset="reads"
                  placeholder="Select READ FILE 1..."
                  value={state.pairedRead1 ?? ""}
                  onObjectSelect={(object: WorkspaceObject) =>
                    { setState("pairedRead1")(object.path); }
                  }
                />
                <WorkspaceObjectSelector
                  preset="reads"
                  placeholder="Select READ FILE 2..."
                  value={state.pairedRead2 ?? ""}
                  onObjectSelect={(object: WorkspaceObject) =>
                    { setState("pairedRead2")(object.path); }
                  }
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="service-card-label">
                  Single Read Library
                </Label>
                <div className="mx-4 h-px flex-1 bg-border" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Add single read library"
                  onClick={controller.handleSingleLibraryAdd}
                  disabled={!state.singleRead}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
              <WorkspaceObjectSelector
                preset="reads"
                placeholder="Select READ FILE..."
                value={state.singleRead ?? ""}
                onObjectSelect={(object: WorkspaceObject) =>
                  { setState("singleRead")(object.path); }
                }
              />
            </div>
            <SraRunAccessionWithValidation
              key={state.sraResetKey}
              title="SRA Run Accession"
              placeholder="SRR..."
              selectedLibraries={selectedLibraries}
              setSelectedLibraries={controller.setLibraries}
              allowDuplicates={false}
            />
            <controller.form.Field name="paired_end_libs">
              {(field) => <FieldErrors field={field} />}
            </controller.form.Field>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-5">
        <Card className="h-full">
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Selected Libraries
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger aria-label="Help: place read files using arrow buttons">
                    <HelpCircle className="service-card-tooltip-icon" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Place read files here using the arrow buttons</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription className="text-xs">
              Place read files here using the arrow buttons.
            </CardDescription>
          </CardHeader>
          <CardContent className="service-card-content">
            <SelectedItemsTable
              items={selectedLibraries.map((library) => ({
                id: library.id,
                name: library.name,
                type: getLibraryTypeLabel(library.type),
              }))}
              onRemove={controller.removeLibrary}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function BinningContigsCard({ controller }: { controller: Controller }) {
  return (
    <div className="md:col-span-12">
      <Card>
        <CardHeader className="service-card-header">
          <RequiredFormCardTitle className="service-card-title">
            Input File
            <DialogInfoPopup
              title={metagenomicBinningInputFile.title}
              description={metagenomicBinningInputFile.description}
              sections={metagenomicBinningInputFile.sections}
            />
          </RequiredFormCardTitle>
        </CardHeader>
        <CardContent className="service-card-content space-y-6">
          <controller.form.Field name="contigs">
            {(field) => (
              <FieldItem>
                <FieldLabel field={field} className="service-card-label">
                  Contigs
                </FieldLabel>
                <WorkspaceObjectSelector
                  preset="contigs"
                  placeholder="Select or Upload Contigs..."
                  onSelectedObjectChange={(object: WorkspaceObject | null) => {
                    field.handleChange(object?.path || "");
                  }}
                  value={field.state.value}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </controller.form.Field>
        </CardContent>
      </Card>
    </div>
  );
}
