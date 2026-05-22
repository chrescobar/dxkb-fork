"use client";

import { useForm, useStore } from "@tanstack/react-form";
import {
  FieldItem,
  FieldLabel,
  FieldErrors,
} from "@/components/ui/tanstack-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

import { ServiceHeader } from "@/components/services/service-header";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { LibraryInputCard } from "@/components/services/library-input-card";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { Spinner } from "@/components/ui/spinner";

import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { useLibraryInputState } from "@/hooks/services/use-library-input-state";
import {
  metagenomicReadMappingInfo,
  metagenomicReadMappingParameters,
  readInputFileInfo,
} from "@/lib/services/info/metagenomic-read-mapping";

import {
  metagenomicReadMappingFormSchema,
  defaultMetagenomicReadMappingFormValues,
  predefinedGeneSetOptions,
  type MetagenomicReadMappingFormData,
  type LibraryItem,
} from "@/lib/forms/(metagenomics)/metagenomic-read-mapping/metagenomic-read-mapping-form-schema";
import { metagenomicReadMappingService } from "@/lib/forms/(metagenomics)/metagenomic-read-mapping/metagenomic-read-mapping-service";
import {
  buildBaseLibraryItem,
  getPairedLibraryName,
  getSingleLibraryName,
} from "@/lib/forms/tanstack-library-selection";
import { getLibraryTypeLabel } from "@/lib/forms/shared-schemas";

import type { WorkspaceObject } from "@/lib/services/workspace/types";

export default function MetagenomicReadMappingPage() {
  const form = useForm({
    defaultValues:
      defaultMetagenomicReadMappingFormValues as MetagenomicReadMappingFormData,
    validators: { onChange: metagenomicReadMappingFormSchema },
    onSubmit: async ({ value }) => {
      await runtime.submitFormData(value as MetagenomicReadMappingFormData);
    },
  });

  const geneSetType = useStore(form.store, (s) => s.values.gene_set_type);
  const canSubmit = useStore(form.store, (s) => s.canSubmit);

  const libraryInput = useLibraryInputState<LibraryItem>({
    form,
    mapLibraryToItem: buildBaseLibraryItem,
    fields: {
      paired: "paired_end_libs",
      single: "single_end_libs",
      srr: "srr_ids",
    },
    buildPairedLibrary: (read1, read2, id) => ({
      library: {
        id,
        name: getPairedLibraryName(read1, read2),
        type: "paired",
        files: [read1, read2],
      },
    }),
    buildSingleLibrary: (read) => ({
      library: {
        id: read,
        name: getSingleLibraryName(read),
        type: "single",
        files: [read],
      },
    }),
  });

  const handleReset = () => {
    form.reset(defaultMetagenomicReadMappingFormValues);
    libraryInput.setLibraries([]);
    libraryInput.resetInputState();
  };

  const runtime = useServiceRuntime({
    definition: metagenomicReadMappingService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      syncLibraries: libraryInput.setLibraries,
    },
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  return (
    <section>
      <ServiceHeader
        title="Metagenomic Read Mapping"
        description="The Metagenomic Read Mapping Service uses KMA to align reads against
          antibiotic resistance genes from CARD and virulence factors from VFDB."
        infoPopupTitle={metagenomicReadMappingInfo.title}
        infoPopupDescription={metagenomicReadMappingInfo.description}
        quickReferenceGuide="https://www.bv-brc.org/docs/quick_references/services/metagenomic_read_mapping_service.html"
        tutorial="https://www.bv-brc.org/docs/tutorial/metagenomic_read_mapping/metagenomic_read_mapping.html"
        instructionalVideo="https://youtube.com/playlist?list=PLWfOyhOW_Oaurdhs675JawVb4LIcAncKc&si=TK4xGmL_92kiiHDG"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="grid grid-cols-1 gap-6 md:grid-cols-12"
      >
        {/* Input File Section */}
        <div className="md:col-span-7">
          <LibraryInputCard
            title="Input File"
            infoPopup={readInputFileInfo}
            pairedRead1={libraryInput.pairedRead1}
            pairedRead2={libraryInput.pairedRead2}
            singleRead={libraryInput.singleRead}
            sraResetKey={libraryInput.sraResetKey}
            selectedLibraries={libraryInput.selectedLibraries}
            setPairedRead1={libraryInput.setPairedRead1}
            setPairedRead2={libraryInput.setPairedRead2}
            setSingleRead={libraryInput.setSingleRead}
            setLibraries={libraryInput.setLibraries}
            onPairedAdd={libraryInput.handlePairedLibraryAdd}
            onSingleAdd={libraryInput.handleSingleLibraryAdd}
          />
        </div>

        {/* Selected Libraries Section */}
        <div className="md:col-span-5">
          <Card className="h-full">
            <CardHeader className="service-card-header">
              <CardTitle className="service-card-title">
                Selected Libraries
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
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
                items={libraryInput.selectedLibraries.map((library) => ({
                  id: library.id,
                  name: library.name,
                  type: getLibraryTypeLabel(library.type),
                }))}
                onRemove={libraryInput.removeLibrary}
              />
            </CardContent>
          </Card>
        </div>

        {/* Parameters Section */}
        <div className="md:col-span-12">
          <Card>
            <CardHeader className="service-card-header">
              <RequiredFormCardTitle className="service-card-title">
                Parameters
                <DialogInfoPopup
                  title={metagenomicReadMappingParameters.title}
                  description={metagenomicReadMappingParameters.description}
                  sections={metagenomicReadMappingParameters.sections}
                />
              </RequiredFormCardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {/* Gene Set Type */}
                <div className="w-full">
                  <form.Field name="gene_set_type">
                    {(field) => (
                      <FieldItem>
                        <FieldLabel
                          field={field}
                          className="service-card-label"
                        >
                          Gene Set Type
                        </FieldLabel>
                        <RadioGroup
                          value={field.state.value}
                          onValueChange={(value) =>
                            value != null &&
                            field.handleChange(
                              value as MetagenomicReadMappingFormData["gene_set_type"],
                            )
                          }
                          className="service-radio-group-horizontal"
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value="predefined_list"
                              id="predefined_list"
                            />
                            <Label
                              htmlFor="predefined_list"
                              className="text-sm"
                            >
                              Predefined List
                            </Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value="fasta_file"
                              id="fasta_file"
                            />
                            <Label htmlFor="fasta_file" className="text-sm">
                              FASTA File
                            </Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value="feature_group"
                              id="feature_group"
                            />
                            <Label htmlFor="feature_group" className="text-sm">
                              Feature Group
                            </Label>
                          </div>
                        </RadioGroup>
                        <FieldErrors field={field} />
                      </FieldItem>
                    )}
                  </form.Field>
                </div>

                {/* Predefined Gene Set Name */}
                {geneSetType === "predefined_list" && (
                  <div className="w-full">
                    <form.Field name="gene_set_name">
                      {(field) => (
                        <FieldItem>
                          <FieldLabel
                            field={field}
                            className="service-card-label"
                          >
                            Predefined Gene Set Name
                          </FieldLabel>
                          <Select
                            items={predefinedGeneSetOptions}
                            value={field.state.value}
                            onValueChange={(value) =>
                              value != null &&
                              field.handleChange(
                                value as MetagenomicReadMappingFormData["gene_set_name"],
                              )
                            }
                          >
                            <SelectTrigger className="service-card-select-trigger">
                              <SelectValue placeholder="Select Gene Set" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {predefinedGeneSetOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
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
                )}

                {/* Gene Set FASTA */}
                {geneSetType === "fasta_file" && (
                  <div className="w-full">
                    <form.Field name="gene_set_fasta">
                      {(field) => (
                        <FieldItem>
                          <FieldLabel
                            field={field}
                            className="service-card-label"
                          >
                            Gene Set FASTA
                          </FieldLabel>
                          <WorkspaceObjectSelector
                            preset="geneSetFasta"
                            placeholder="Select Gene Set FASTA File..."
                            onSelectedObjectChange={(
                              object: WorkspaceObject | null,
                            ) => {
                              field.handleChange(object?.path || "");
                            }}
                            value={field.state.value}
                          />
                          <FieldErrors field={field} />
                        </FieldItem>
                      )}
                    </form.Field>
                  </div>
                )}

                {/* Gene Set Feature Group */}
                {geneSetType === "feature_group" && (
                  <div className="w-full">
                    <form.Field name="gene_set_feature_group">
                      {(field) => (
                        <FieldItem>
                          <FieldLabel
                            field={field}
                            className="service-card-label"
                          >
                            Gene Set Feature Group
                          </FieldLabel>
                          <WorkspaceObjectSelector
                            preset="featureGroup"
                            placeholder="Select Gene Set Feature Group..."
                            onSelectedObjectChange={(
                              object: WorkspaceObject | null,
                            ) => {
                              field.handleChange(object?.path || "");
                            }}
                            value={field.state.value}
                          />
                          <FieldErrors field={field} />
                        </FieldItem>
                      )}
                    </form.Field>
                  </div>
                )}

                {/* Output Configuration */}
                <div className="flex flex-col space-y-4">
                  <OutputLocationFields form={form} required={true} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Controls */}
        <div className="md:col-span-12">
          <div className="service-form-controls">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Submit
            </Button>
          </div>
        </div>
      </form>

      <JobParamsDialog {...jobParamsDialogProps} />
    </section>
  );
}
