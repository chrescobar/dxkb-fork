"use client";

import { useState, useEffect } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { ServiceHeader } from "@/components/services/service-header";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { Spinner } from "@/components/ui/spinner";
import { LibraryInputCard } from "@/components/services/library-input-card";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";

import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { useLibraryInputState } from "@/hooks/services/use-library-input-state";
import { metagenomicBinningInfo, metagenomicBinningInputFile } from "@/lib/services/info/metagenomic-binning";

import {
  metagenomicBinningFormSchema,
  defaultMetagenomicBinningFormValues,
  type MetagenomicBinningFormData,
  type LibraryItem,
} from "@/lib/forms/(metagenomics)/metagenomic-binning/metagenomic-binning-form-schema";
import { metagenomicBinningService } from "@/lib/forms/(metagenomics)/metagenomic-binning/metagenomic-binning-service";
import {
  buildBaseLibraryItem,
  getPairedLibraryName,
  getSingleLibraryName,
} from "@/lib/forms/tanstack-library-selection";
import { getLibraryTypeLabel } from "@/lib/forms/shared-schemas";

import type { WorkspaceObject } from "@/lib/services/workspace/types";
import { MetagenomicBinningStartWithCard } from "./metagenomic-binning-start-with-card";
import { MetagenomicBinningParametersCard } from "./metagenomic-binning-parameters-card";

export default function MetagenomicBinningPage() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm({
    defaultValues: defaultMetagenomicBinningFormValues as MetagenomicBinningFormData,
    validators: { onChange: metagenomicBinningFormSchema },
    onSubmit: async ({ value }) => {
      await runtime.submitFormData(value as MetagenomicBinningFormData);
    },
  });

  const startWith = useStore(form.store, (s) => s.values.start_with);
  const assembler = useStore(form.store, (s) => s.values.assembler);
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

  function handleReset() {
    form.reset(defaultMetagenomicBinningFormValues);
    libraryInput.setLibraries([]);
    libraryInput.resetInputState();
    setShowAdvanced(false);
  }

  const runtime = useServiceRuntime({
    definition: metagenomicBinningService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      syncLibraries: libraryInput.setLibraries,
    },
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  const pairedCount = libraryInput.selectedLibraries.filter((lib) => lib.type === "paired").length;
  const metaspadesDisabled = !(libraryInput.selectedLibraries.length === 1 && pairedCount === 1);

  useEffect(() => {
    if (metaspadesDisabled && assembler === "metaspades") {
      form.setFieldValue("assembler", "auto");
    }
  }, [metaspadesDisabled, assembler, form]);

  return (
    <section>
      <ServiceHeader
        title="Metagenomic Binning"
        description="The Metagenomic Binning Service accepts either reads or contigs, and
          attempts to 'bin' the data into a set of genomes. This service can be
          used to reconstruct bacterial and archaeal genomes from environmental
          samples."
        infoPopupTitle={metagenomicBinningInfo.title}
        infoPopupDescription={metagenomicBinningInfo.description}
        quickReferenceGuide="https://www.bv-brc.org/docs/quick_references/services/metagenomic_binning_service.html"
        tutorial="https://www.bv-brc.org/docs/tutorial/metagenomic_binning/metagenomic_binning.html"
        instructionalVideo="https://youtube.com/playlist?list=PLWfOyhOW_OasTc7mmLSXZvQYrO_R5se47&si=X66tQsvWsW0GuA6Z"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="grid grid-cols-1 gap-6 md:grid-cols-12"
      >
        <div className="md:col-span-12">
          <MetagenomicBinningStartWithCard form={form} />
        </div>

        {startWith === "reads" && (
          <>
            <div className="md:col-span-7">
              <LibraryInputCard
                title="Input File"
                infoPopup={metagenomicBinningInputFile}
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
          </>
        )}

        {startWith === "contigs" && (
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
                <form.Field name="contigs">
                  {(field) => (
                    <FieldItem>
                      <Label className="service-card-label">Contigs</Label>
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
                </form.Field>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="md:col-span-12">
          <MetagenomicBinningParametersCard
            form={form}
            startWith={startWith}
            metaspadesDisabled={metaspadesDisabled}
            showAdvanced={showAdvanced}
            onShowAdvancedChange={setShowAdvanced}
          />
        </div>

        <div className="md:col-span-12">
          <div className="service-form-controls">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
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
