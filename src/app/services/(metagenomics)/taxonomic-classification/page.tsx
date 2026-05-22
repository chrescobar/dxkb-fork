"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { ServiceHeader } from "@/components/services/service-header";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { LibraryInputCard } from "@/components/services/library-input-card";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { Spinner } from "@/components/ui/spinner";

import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { useLibraryInputState } from "@/hooks/services/use-library-input-state";
import {
  assignSampleIdToNewSraLibraries,
  extractSampleIdFromPath,
  mapLibraryToSampleIdItem,
  mapSraLibraryToSampleIdItem,
} from "@/lib/forms/service-library-rules";
import {
  taxonomyClassificationInfo,
  taxonomyClassificationInput,
} from "@/lib/services/info/taxonomic-classification";

import {
  taxonomicClassificationFormSchema,
  defaultTaxonomicClassificationFormValues,
  wgsAnalysisTypeOptions,
  sixteenSAnalysisTypeOptions,
  wgsDatabaseOptions,
  sixteenSDatabaseOptions,
  type TaxonomicClassificationFormData,
  type LibraryItem,
} from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-form-schema";
import {
  getDefaultAnalysisType,
  getDefaultDatabase,
} from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-form-utils";
import { taxonomicClassificationService } from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-service";
import {
  findNewSraLibraries,
  getPairedLibraryName,
  getSingleLibraryName,
} from "@/lib/forms/tanstack-library-selection";
import { getLibraryTypeLabel } from "@/lib/forms/shared-schemas";

import type { Library } from "@/types/services";
import { TaxonomicClassificationParametersCard } from "./taxonomic-classification-parameters-card";

export default function TaxonomicClassificationPage() {
  // Sample identifiers (default from selection, editable)
  const [pairedSampleId, setPairedSampleId] = useState("");
  const [singleSampleId, setSingleSampleId] = useState("");
  const [srrSampleId, setSrrSampleId] = useState("");

  // Track if this is the initial mount to avoid triggering validation on load
  const isInitialMount = useRef(true);

  const form = useForm({
    defaultValues:
      defaultTaxonomicClassificationFormValues as TaxonomicClassificationFormData,
    validators: { onChange: taxonomicClassificationFormSchema },
    onSubmit: async ({ value }) => {
      await runtime.submitFormData(value as TaxonomicClassificationFormData);
    },
  });

  const sequenceType = useStore(form.store, (s) => s.values.sequence_type);
  const canSubmit = useStore(form.store, (s) => s.canSubmit);

  // Update analysis type and database when sequence type changes
  useEffect(() => {
    const newAnalysisType = getDefaultAnalysisType(sequenceType);
    const newDatabase = getDefaultDatabase(sequenceType);

    form.setFieldValue(
      "analysis_type",
      newAnalysisType as "microbiome" | "pathogen" | "default",
    );
    form.setFieldValue(
      "database",
      newDatabase as "bvbrc" | "standard" | "SILVA" | "Greengenes",
    );

    // Reset host genome when switching to 16S
    if (sequenceType === "16s") {
      form.setFieldValue("host_genome", "no_host");
    }

    // Only skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [sequenceType, form]);

  const libraryInput = useLibraryInputState<
    LibraryItem,
    { srr_accession: string; sample_id: string; title?: string }
  >({
    form,
    mapLibraryToItem: mapLibraryToSampleIdItem,
    mapSraLibraryToItem: mapSraLibraryToSampleIdItem,
    fields: {
      paired: "paired_end_libs",
      single: "single_end_libs",
      srr: "srr_libs",
    },
    normalizeLibraries: (nextLibraries, previousLibraries) =>
      assignSampleIdToNewSraLibraries(
        nextLibraries,
        previousLibraries,
        srrSampleId,
      ),
    buildPairedLibrary: (read1, read2, id) => {
      const defaultSampleId = extractSampleIdFromPath(read1, "sample");
      const librarySampleId = pairedSampleId.trim() || defaultSampleId;
      return {
        library: {
          id,
          name: getPairedLibraryName(read1, read2),
          type: "paired",
          files: [read1, read2],
          sampleId: librarySampleId,
        },
      };
    },
    buildSingleLibrary: (read) => {
      const defaultSampleId = extractSampleIdFromPath(read, "sample");
      const librarySampleId = singleSampleId.trim() || defaultSampleId;
      return {
        library: {
          id: read,
          name: getSingleLibraryName(read),
          type: "single",
          files: [read],
          sampleId: librarySampleId,
        },
      };
    },
    onPairedError: toast.error,
    onSingleError: toast.error,
  });

  // Custom paired add handler to update form field and clear sample ID after add
  const handlePairedLibraryAdd = () => {
    libraryInput.addPairedLibrary({
      read1: libraryInput.pairedRead1,
      read2: libraryInput.pairedRead2,
      buildLibrary: (read1, read2, id) => {
        const defaultSampleId = extractSampleIdFromPath(read1, "sample");
        const librarySampleId = pairedSampleId.trim() || defaultSampleId;
        return {
          library: {
            id,
            name: getPairedLibraryName(read1, read2),
            type: "paired",
            files: [read1, read2],
            sampleId: librarySampleId,
          },
        };
      },
      onError: toast.error,
      onAfterAdd: (library) => {
        const fallbackSampleId = library.files?.[0]
          ? extractSampleIdFromPath(library.files[0], "sample")
          : "sample";
        form.setFieldValue(
          "paired_sample_id",
          pairedSampleId.trim() || fallbackSampleId,
        );
        libraryInput.setPairedRead1(null);
        libraryInput.setPairedRead2(null);
        setPairedSampleId("");
      },
    });
  };

  // Custom single add handler to update form field and clear sample ID after add
  const handleSingleLibraryAdd = () => {
    libraryInput.addSingleLibrary({
      read: libraryInput.singleRead,
      buildLibrary: (read) => {
        const defaultSampleId = extractSampleIdFromPath(read, "sample");
        const librarySampleId = singleSampleId.trim() || defaultSampleId;
        return {
          library: {
            id: read,
            name: getSingleLibraryName(read),
            type: "single",
            files: [read],
            sampleId: librarySampleId,
          },
        };
      },
      onError: toast.error,
      onAfterAdd: (library) => {
        const fallbackSampleId = library.files?.[0]
          ? extractSampleIdFromPath(library.files[0], "sample")
          : "sample";
        form.setFieldValue(
          "single_sample_id",
          singleSampleId.trim() || fallbackSampleId,
        );
        libraryInput.setSingleRead(null);
        setSingleSampleId("");
      },
    });
  };

  const handleReset = () => {
    form.reset(defaultTaxonomicClassificationFormValues);
    libraryInput.setLibraries([]);
    libraryInput.resetInputState();
    setPairedSampleId("");
    setSingleSampleId("");
    setSrrSampleId("");
  };

  const runtime = useServiceRuntime({
    definition: taxonomicClassificationService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      getLibraryExtra: (lib, kind) => {
        if (kind === "paired") {
          return {
            sampleId:
              lib.sample_id || extractSampleIdFromPath(lib.read1, "sample"),
          };
        }
        if (kind === "single") {
          return {
            sampleId:
              lib.sample_id || extractSampleIdFromPath(lib.read, "sample"),
          };
        }
        return { sampleId: lib.sample_id || "" };
      },
      syncLibraries: libraryInput.setLibraries,
    },
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  // Unified handler for sample ID changes - updates both local state and form field
  const handleSampleIdChange = (
    type: "paired" | "single" | "srr",
    value: string,
  ) => {
    const config = {
      paired: { setter: setPairedSampleId, field: "paired_sample_id" as const },
      single: { setter: setSingleSampleId, field: "single_sample_id" as const },
      srr: { setter: setSrrSampleId, field: "srr_sample_id" as const },
    };
    config[type].setter(value);
    form.setFieldValue(config[type].field, value);
  };

  // When SRA/libs are updated, assign sample_id to newly added SRA entries
  const handleSetSelectedLibraries = (libs: Library[]) => {
    const newSraLibs = findNewSraLibraries(libs, libraryInput.selectedLibraries);
    libraryInput.setLibraries(libs);

    // Set top-level sample ID form field and clear the textbox after adding SRA libs
    if (newSraLibs.length > 0) {
      const lastNewSra = newSraLibs[newSraLibs.length - 1];
      const defaultSampleId = srrSampleId.trim() || lastNewSra.id;
      // Update form field for submission
      form.setFieldValue("srr_sample_id", defaultSampleId);
      // Clear the sample ID textbox after adding
      setSrrSampleId("");
    }
  };

  // Get current options based on sequence type
  const analysisTypeOptions =
    sequenceType === "wgs"
      ? wgsAnalysisTypeOptions
      : sixteenSAnalysisTypeOptions;

  const databaseOptions =
    sequenceType === "wgs" ? wgsDatabaseOptions : sixteenSDatabaseOptions;

  return (
    <section>
      <ServiceHeader
        title="Taxonomic Classification"
        description="The Taxonomic Classification Service computes taxonomic classification for read data."
        infoPopupTitle={taxonomyClassificationInfo.title}
        infoPopupDescription={taxonomyClassificationInfo.description}
        quickReferenceGuide="https://www.bv-brc.org/docs/quick_references/services/taxonomic_classification_service.html"
        tutorial="https://www.bv-brc.org/docs/tutorial/taxonomic_classification/taxonomic_classification.html"
        instructionalVideo="https://youtu.be/PsqHeZ8pvt4"
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
            infoPopup={taxonomyClassificationInput}
            pairedRead1={libraryInput.pairedRead1}
            pairedRead2={libraryInput.pairedRead2}
            singleRead={libraryInput.singleRead}
            sraResetKey={libraryInput.sraResetKey}
            selectedLibraries={libraryInput.selectedLibraries}
            setPairedRead1={(path) => {
              libraryInput.setPairedRead1(path);
              if (path) setPairedSampleId(extractSampleIdFromPath(path));
            }}
            setPairedRead2={(path) => {
              libraryInput.setPairedRead2(path);
              if (path && !libraryInput.pairedRead1) {
                setPairedSampleId(extractSampleIdFromPath(path));
              }
            }}
            setSingleRead={(path) => {
              libraryInput.setSingleRead(path);
              if (path) setSingleSampleId(extractSampleIdFromPath(path));
            }}
            setLibraries={handleSetSelectedLibraries}
            onPairedAdd={handlePairedLibraryAdd}
            onSingleAdd={handleSingleLibraryAdd}
            onSraChange={(value) => setSrrSampleId(value)}
            pairedExtras={
              <div>
                <Label className="service-card-sublabel">
                  Sample Identifier
                </Label>
                <Input
                  value={pairedSampleId}
                  onChange={(e) =>
                    handleSampleIdChange("paired", e.target.value)
                  }
                  placeholder="Sample ID"
                  className="service-card-input mt-1.5 font-mono text-sm"
                />
              </div>
            }
            singleExtras={
              <div>
                <Label className="service-card-sublabel">
                  Sample Identifier
                </Label>
                <Input
                  value={singleSampleId}
                  onChange={(e) =>
                    handleSampleIdChange("single", e.target.value)
                  }
                  placeholder="Sample ID"
                  className="service-card-input mt-1.5 font-mono text-sm"
                />
              </div>
            }
            sraExtras={
              <div>
                <Label className="service-card-sublabel">
                  Sample Identifier
                </Label>
                <Input
                  value={srrSampleId}
                  onChange={(e) => handleSampleIdChange("srr", e.target.value)}
                  placeholder="Sample ID"
                  className="service-card-input mt-1.5 font-mono text-sm"
                />
              </div>
            }
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
          <TaxonomicClassificationParametersCard
            form={form}
            sequenceType={sequenceType}
            analysisTypeOptions={analysisTypeOptions}
            databaseOptions={databaseOptions}
          />
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
