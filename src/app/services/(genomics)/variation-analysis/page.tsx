"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { ServiceHeader } from "@/components/services/service-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  variationAnalysisInfo,
  variationAnalysisParameters,
  readInputFileInfo,
} from "@/lib/services/info/variation-analysis";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { LibraryInputCard } from "@/components/services/library-input-card";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { useLibraryInputState } from "@/hooks/services/use-library-input-state";
import { toast } from "sonner";
import {
  variationAnalysisFormSchema,
  defaultVariationAnalysisFormValues,
  type VariationAnalysisFormData,
  type VariationLibraryItem,
} from "@/lib/forms/(genomics)/variation-analysis/variation-analysis-form-schema";
import {
  variationAnalysisMappers,
  variationAnalysisCallers,
} from "@/lib/forms/(genomics)/variation-analysis/variation-analysis-form-utils";
import { variationAnalysisService } from "@/lib/forms/(genomics)/variation-analysis/variation-analysis-service";
import { RequiredFormLabel } from "@/components/forms/required-form-components";
import { SingleGenomeSelector } from "@/components/services/single-genome-selector";
import { Spinner } from "@/components/ui/spinner";
import {
  buildBaseLibraryItem,
  getPairedLibraryName,
  getSingleLibraryName,
} from "@/lib/forms/tanstack-library-selection";

export default function VariationAnalysisPage() {
  const form = useForm({
    defaultValues: defaultVariationAnalysisFormValues,
    validators: { onChange: variationAnalysisFormSchema },
    onSubmit: async ({ value }) => {
      const data = value as VariationAnalysisFormData;

      const hasPaired = data.paired_end_libs && data.paired_end_libs.length > 0;
      const hasSingle = data.single_end_libs && data.single_end_libs.length > 0;
      const hasSrr = data.srr_ids && data.srr_ids.length > 0;

      if (!hasPaired && !hasSingle && !hasSrr) {
        toast.error("At least one library must be selected");
        return;
      }

      await runtime.submitFormData(data);
    },
  });

  const libraryInput = useLibraryInputState<VariationLibraryItem>({
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

  function handleReset() {
    form.reset(defaultVariationAnalysisFormValues);
    libraryInput.setLibraries([]);
    libraryInput.resetInputState();
  }

  const runtime = useServiceRuntime({
    definition: variationAnalysisService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      syncLibraries: libraryInput.setLibraries,
    },
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  const canSubmit = useStore(form.store, (s) => s.canSubmit);

  return (
    <section>
      <ServiceHeader
        title="Variation Analysis"
        description="The Variation Analysis Service can be used to identify and annotate sequence variations."
        infoPopupTitle={variationAnalysisInfo.title}
        infoPopupDescription={variationAnalysisInfo.description}
        quickReferenceGuide="https://www.bv-brc.org/docs/quick_references/services/variation_analysis_service.html"
        tutorial="https://www.bv-brc.org/docs/tutorial/variation_analysis/variation_analysis.html"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="grid grid-cols-1 gap-6 md:grid-cols-12"
      >
        {/* Left Column */}
        <div className="space-y-6 md:col-span-7">
          {/* Input Files Card */}
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

          {/* Selected Libraries (mobile) */}
          <div className="md:hidden">
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
                        <p>Files selected for analysis</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>
                  Place read files here using the arrow buttons.
                </CardDescription>
              </CardHeader>

              <CardContent className="service-card-content">
                <SelectedItemsTable
                  items={libraryInput.selectedLibraries.map((library) => ({
                    id: library.id,
                    name: library.name,
                    type: library.type,
                  }))}
                  onRemove={libraryInput.removeLibrary}
                  className="max-h-84 overflow-y-auto"
                />
              </CardContent>
            </Card>
          </div>

          {/* Parameters Card */}
          <Card>
            <CardHeader className="service-card-header">
              <CardTitle className="service-card-title">
                Parameters
                <DialogInfoPopup
                  title={variationAnalysisParameters.title}
                  description={variationAnalysisParameters.description}
                  sections={variationAnalysisParameters.sections}
                />
              </CardTitle>
            </CardHeader>

            <CardContent className="service-card-content">
              <div className="space-y-6">
                {/* Target Genome */}
                <form.Field name="reference_genome_id">
                  {(field) => (
                    <FieldItem>
                      <RequiredFormLabel>Target Genome</RequiredFormLabel>
                      <SingleGenomeSelector
                        value={field.state.value ?? ""}
                        onChange={(genomeId) => {
                          field.handleChange(genomeId);
                        }}
                        placeholder="e.g. Mycobacterium tuberculosis H37Rv"
                      />
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>

                {/* Aligner */}
                <form.Field name="mapper">
                  {(field) => (
                    <FieldItem>
                      <RequiredFormLabel>Aligner</RequiredFormLabel>
                      <Select
                        items={variationAnalysisMappers}
                        value={field.state.value}
                        onValueChange={(value) =>
                          value != null && field.handleChange(value)
                        }
                      >
                        <SelectTrigger className="service-card-select-trigger">
                          <SelectValue placeholder="Select aligner" />
                        </SelectTrigger>
                        <SelectContent className="service-card-select-content">
                          <SelectGroup>
                            {variationAnalysisMappers.map((mapper) => (
                              <SelectItem
                                key={mapper.value}
                                value={mapper.value}
                              >
                                {mapper.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>

                {/* SNP Caller */}
                <form.Field name="caller">
                  {(field) => (
                    <FieldItem>
                      <RequiredFormLabel>SNP Caller</RequiredFormLabel>
                      <Select
                        items={variationAnalysisCallers}
                        value={field.state.value}
                        onValueChange={(value) =>
                          value != null && field.handleChange(value)
                        }
                      >
                        <SelectTrigger className="service-card-select-trigger">
                          <SelectValue placeholder="Select SNP caller" />
                        </SelectTrigger>
                        <SelectContent className="service-card-select-content">
                          <SelectGroup>
                            {variationAnalysisCallers.map((caller) => (
                              <SelectItem
                                key={caller.value}
                                value={caller.value}
                              >
                                {caller.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>

                <OutputLocationFields form={form} required />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Selected Libraries (desktop) */}
        <div className="hidden md:col-span-5 md:block">
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
                      <p>Files selected for analysis</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Place read files here using the arrow buttons.
              </CardDescription>
            </CardHeader>

            <CardContent className="service-card-content">
              <SelectedItemsTable
                items={libraryInput.selectedLibraries.map((library) => ({
                  id: library.id,
                  name: library.name,
                  type: library.type,
                }))}
                onRemove={libraryInput.removeLibrary}
                className="max-h-84 overflow-y-auto"
              />
            </CardContent>
          </Card>
        </div>

        {/* Form Controls */}
        <div className="service-form-controls md:col-span-12">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="service-form-controls-button"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? <Spinner /> : null}
              Submit
            </Button>
          </div>
        </div>
      </form>

      <JobParamsDialog {...jobParamsDialogProps} />
    </section>
  );
}
