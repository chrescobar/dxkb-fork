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
import { ChevronRight, HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { ServiceHeader } from "@/components/services/service-header";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import SraRunAccessionWithValidation from "@/components/services/sra-run-accession-with-validation";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { Spinner } from "@/components/ui/spinner";

import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
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
  useTanstackLibrarySelection,
} from "@/lib/forms/tanstack-library-selection";
import { getLibraryTypeLabel } from "@/lib/forms/shared-schemas";

import type { WorkspaceObject } from "@/lib/services/workspace/types";
import { MetagenomicBinningStartWithCard } from "./metagenomic-binning-start-with-card";
import { MetagenomicBinningParametersCard } from "./metagenomic-binning-parameters-card";

export default function MetagenomicBinningPage() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pairedRead1, setPairedRead1] = useState<string | null>(null);
  const [pairedRead2, setPairedRead2] = useState<string | null>(null);
  const [singleRead, setSingleRead] = useState<string | null>(null);
  const [sraResetKey, setSraResetKey] = useState(0);

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

  const {
    selectedLibraries,
    addPairedLibrary,
    addSingleLibrary,
    removeLibrary,
    setLibraries,
  } = useTanstackLibrarySelection<LibraryItem>({
    form,
    mapLibraryToItem: buildBaseLibraryItem,
    fields: {
      paired: "paired_end_libs",
      single: "single_end_libs",
      srr: "srr_ids",
    },
  });

  const runtime = useServiceRuntime({
    definition: metagenomicBinningService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      syncLibraries: setLibraries,
    },
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  const pairedCount = selectedLibraries.filter((lib) => lib.type === "paired").length;
  const metaspadesDisabled = !(selectedLibraries.length === 1 && pairedCount === 1);

  useEffect(() => {
    if (metaspadesDisabled && assembler === "metaspades") {
      form.setFieldValue("assembler", "auto");
    }
  }, [metaspadesDisabled, assembler, form]);

  const handlePairedLibraryAdd = () => {
    addPairedLibrary({
      read1: pairedRead1,
      read2: pairedRead2,
      buildLibrary: (read1, read2, id) => ({
        library: {
          id,
          name: getPairedLibraryName(read1, read2),
          type: "paired",
          files: [read1, read2],
        },
      }),
      onError: toast.error,
      onAfterAdd: () => {
        setPairedRead1(null);
        setPairedRead2(null);
      },
    });
  };

  const handleSingleLibraryAdd = () => {
    addSingleLibrary({
      read: singleRead,
      buildLibrary: (read) => ({
        library: {
          id: read,
          name: getSingleLibraryName(read),
          type: "single",
          files: [read],
        },
      }),
      onError: toast.error,
      onAfterAdd: () => {
        setSingleRead(null);
      },
    });
  };

  function handleReset() {
    form.reset(defaultMetagenomicBinningFormValues);
    setLibraries([]);
    setShowAdvanced(false);
    setPairedRead1(null);
    setPairedRead2(null);
    setSingleRead(null);
    setSraResetKey((k) => k + 1);
  }

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
                      <Label className="service-card-label">Paired Read Library</Label>
                      <div className="bg-border mx-4 h-px flex-1" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handlePairedLibraryAdd}
                        disabled={!pairedRead1 || !pairedRead2}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <WorkspaceObjectSelector
                        preset="reads"
                        placeholder="Select READ FILE 1..."
                        value={pairedRead1 ?? ""}
                        onObjectSelect={(object: WorkspaceObject) => {
                          setPairedRead1(object.path);
                        }}
                      />
                      <WorkspaceObjectSelector
                        preset="reads"
                        placeholder="Select READ FILE 2..."
                        value={pairedRead2 ?? ""}
                        onObjectSelect={(object: WorkspaceObject) => {
                          setPairedRead2(object.path);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="service-card-label">Single Read Library</Label>
                      <div className="bg-border mx-4 h-px flex-1" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleSingleLibraryAdd}
                        disabled={!singleRead}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                    <WorkspaceObjectSelector
                      preset="reads"
                      placeholder="Select READ FILE..."
                      value={singleRead ?? ""}
                      onObjectSelect={(object: WorkspaceObject) => {
                        setSingleRead(object.path);
                      }}
                    />
                  </div>

                  <SraRunAccessionWithValidation
                    key={sraResetKey}
                    title="SRA Run Accession"
                    placeholder="SRR..."
                    selectedLibraries={selectedLibraries}
                    setSelectedLibraries={setLibraries}
                    allowDuplicates={false}
                  />

                  <form.Field name="paired_end_libs">
                    {(field) => <FieldErrors field={field} />}
                  </form.Field>
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
                    items={selectedLibraries.map((library) => ({
                      id: library.id,
                      name: library.name,
                      type: getLibraryTypeLabel(library.type),
                    }))}
                    onRemove={removeLibrary}
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
