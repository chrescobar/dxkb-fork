"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

import { ServiceHeader } from "@/components/services/service-header";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { LibraryInputCard } from "@/components/services/library-input-card";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { Spinner } from "@/components/ui/spinner";

import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { useLibraryInputState } from "@/hooks/services/use-library-input-state";
import {
  sarsCov2WastewaterAnalysisInfo,
  sarsCov2WastewaterAnalysisInputLib,
  sarsCov2WastewaterAnalysisParameters,
} from "@/lib/services/info/sars-cov2-wastewater-analysis";

import {
  sarsCov2WastewaterAnalysisFormSchema,
  defaultSarsCov2WastewaterAnalysisFormValues,
  primerOptions,
  primerVersionOptions,
  defaultPrimerVersion,
  recipeOptions,
  type SarsCov2WastewaterAnalysisFormData,
  type SarsCov2WastewaterLibraryItem,
  type Primers,
  type SrrLibItem,
} from "@/lib/forms/(viral-tools)/sars-cov2-wastewater-analysis/sars-cov2-wastewater-analysis-form-schema";
import {
  handleLibraryError as handleLibraryErrorUtil,
  getPairedLibraryBuildFn,
  getSingleLibraryBuildFn,
  singleLibraryDuplicateMatcher,
  findNewSraLibraries,
  resolveSampleIdAndDate,
  getDefaultSampleIdFromPath,
  getDefaultSampleIdFromSrr,
} from "@/lib/forms/(viral-tools)/sars-cov2-wastewater-analysis/sars-cov2-wastewater-analysis-form-utils";
import { sarsCov2WastewaterAnalysisService } from "@/lib/forms/(viral-tools)/sars-cov2-wastewater-analysis/sars-cov2-wastewater-analysis-service";
import {
  buildBaseLibraryItem,
} from "@/lib/forms/tanstack-library-selection";
import { getLibraryTypeLabel } from "@/lib/forms/shared-schemas";

import type { Library } from "@/types/services";

const quickReference =
  "https://www.bv-brc.org/docs/quick_references/services/sars_cov_2_wastewater_analysis_service.html";
const tutorial =
  "https://www.bv-brc.org/docs/tutorial/sars_cov_2_wastewater/sars_cov_2_wastewater.html";

export default function SarsCov2WastewaterAnalysisPage() {
  const form = useForm({
    defaultValues:
      defaultSarsCov2WastewaterAnalysisFormValues as SarsCov2WastewaterAnalysisFormData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: { onChange: sarsCov2WastewaterAnalysisFormSchema as any },
    onSubmit: async ({ value }) => {
      await runtime.submitFormData(value as SarsCov2WastewaterAnalysisFormData);
    },
  });

  const canSubmit = useStore(form.store, (s) => s.canSubmit);

  const [currentSampleId, setCurrentSampleId] = useState("");
  const [currentSampleDate, setCurrentSampleDate] = useState("");
  const skipSraNormalization = useRef(false);

  const primers = useStore(form.store, (s) => s.values.primers);
  const primerVersionOpts =
    primerVersionOptions[primers] ?? primerVersionOptions.ARTIC;

  const libraryInput = useLibraryInputState<SarsCov2WastewaterLibraryItem, SrrLibItem>({
    form,
    mapLibraryToItem: (library) => ({
      ...buildBaseLibraryItem(library),
      sample_id: library.sampleId?.trim() ?? library.id,
      ...(library.sampleLevelDate?.trim() && {
        sample_level_date: library.sampleLevelDate.trim(),
      }),
    }),
    mapSraLibraryToItem: (library) => ({
      srr_accession: library.id,
      sample_id: library.sampleId?.trim() ?? library.id,
      ...(library.sampleLevelDate?.trim() && {
        sample_level_date: library.sampleLevelDate.trim(),
      }),
      ...(library.title && { title: library.title }),
    }),
    fields: {
      paired: "paired_end_libs",
      single: "single_end_libs",
      srr: "srr_libs",
    },
    normalizeLibraries: (nextLibraries, previousLibraries) => {
      // Skip normalization when called from the rerun effect — libs already have correct sampleId
      if (skipSraNormalization.current) {
        skipSraNormalization.current = false;
        return nextLibraries;
      }
      const newSraLibIds = new Set(
        findNewSraLibraries(nextLibraries, previousLibraries).map((l) => l.id),
      );
      return nextLibraries.map((lib) => {
        if (lib.type === "sra" && newSraLibIds.has(lib.id)) {
          return {
            ...lib,
            sampleId: currentSampleId.trim() || lib.id,
            ...(currentSampleDate.trim() && {
              sampleLevelDate: currentSampleDate.trim(),
            }),
          };
        }
        return lib;
      });
    },
    buildPairedLibrary: (read1, read2, id) => {
      const { sampleId, sampleLevelDate } = resolveSampleIdAndDate(
        currentSampleId,
        currentSampleDate,
        read1,
      );
      return getPairedLibraryBuildFn(sampleId, sampleLevelDate)(read1, read2, id);
    },
    buildSingleLibrary: (read) => {
      const { sampleId, sampleLevelDate } = resolveSampleIdAndDate(
        currentSampleId,
        currentSampleDate,
        read,
      );
      return getSingleLibraryBuildFn(sampleId, sampleLevelDate)(read);
    },
    duplicateMatcher: singleLibraryDuplicateMatcher,
    onPairedError: (msg) => handleLibraryErrorUtil(msg, toast),
    onSingleError: (msg) => handleLibraryErrorUtil(msg, toast),
  });

  useEffect(() => {
    if (primers) {
      const defaultVersion = defaultPrimerVersion[primers];
      if (
        defaultVersion &&
        form.state.values.primer_version !== defaultVersion
      ) {
        form.setFieldValue("primer_version", defaultVersion);
      }
    }
  }, [primers, form]);

  // Custom paired add handler to clear sample ID after adding
  const handlePairedLibraryAdd = () => {
    libraryInput.addPairedLibrary({
      read1: libraryInput.pairedRead1,
      read2: libraryInput.pairedRead2,
      buildLibrary: (read1, read2, id) => {
        const { sampleId, sampleLevelDate } = resolveSampleIdAndDate(
          currentSampleId,
          currentSampleDate,
          read1,
        );
        return getPairedLibraryBuildFn(sampleId, sampleLevelDate)(read1, read2, id);
      },
      onError: (msg) => handleLibraryErrorUtil(msg, toast),
      onAfterAdd: () => {
        libraryInput.setPairedRead1(null);
        libraryInput.setPairedRead2(null);
        setCurrentSampleId("");
      },
    });
  };

  // Custom single add handler to clear sample ID after adding
  const handleSingleLibraryAdd = () => {
    libraryInput.addSingleLibrary({
      read: libraryInput.singleRead,
      buildLibrary: (read) => {
        const { sampleId, sampleLevelDate } = resolveSampleIdAndDate(
          currentSampleId,
          currentSampleDate,
          read,
        );
        return getSingleLibraryBuildFn(sampleId, sampleLevelDate)(read);
      },
      duplicateMatcher: singleLibraryDuplicateMatcher,
      onError: (msg) => handleLibraryErrorUtil(msg, toast),
      onAfterAdd: () => {
        libraryInput.setSingleRead(null);
        setCurrentSampleId("");
      },
    });
  };

  const handleSetSelectedLibraries = (libs: Library[]) => {
    const newSraLibs = findNewSraLibraries(libs, libraryInput.selectedLibraries);
    libraryInput.setLibraries(libs);
    if (newSraLibs.length > 0) {
      setCurrentSampleId("");
      setCurrentSampleDate("");
    }
  };

  const handleSraAccessionChange = (value: string) => {
    if (value.trim()) {
      setCurrentSampleId(getDefaultSampleIdFromSrr(value.trim()));
    }
  };

  const handleReset = () => {
    form.reset(defaultSarsCov2WastewaterAnalysisFormValues);
    libraryInput.setLibraries([]);
    libraryInput.resetInputState();
    setCurrentSampleId("");
    setCurrentSampleDate("");
  };

  const runtime = useServiceRuntime({
    definition: sarsCov2WastewaterAnalysisService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      getLibraryExtra: (lib, kind) => {
        const base = {
          sampleId: lib.sample_id || "",
          ...(lib.sample_level_date
            ? { sampleLevelDate: lib.sample_level_date }
            : {}),
        };
        if (kind === "sra") {
          return { ...base, ...(lib.title ? { title: lib.title } : {}) };
        }
        return base;
      },
      syncLibraries: (libs) => {
        skipSraNormalization.current = true;
        libraryInput.setLibraries(libs);
      },
    },
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  return (
    <section>
      <ServiceHeader
        title="SARS-CoV-2 Wastewater Analysis"
        description="The SARS-CoV-2 Wastewater Analysis assembles raw reads with the Sars One Codex pipeline and performs variant analysis with Freyja."
        infoPopupTitle={sarsCov2WastewaterAnalysisInfo.title}
        infoPopupDescription={sarsCov2WastewaterAnalysisInfo.description}
        quickReferenceGuide={quickReference}
        tutorial={tutorial}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="grid grid-cols-1 gap-6 md:grid-cols-12"
      >
        {/* Input Library */}
        <div className="md:col-span-6">
          <LibraryInputCard
            title="Input Library Selection"
            infoPopup={sarsCov2WastewaterAnalysisInputLib}
            pairedRead1={libraryInput.pairedRead1}
            pairedRead2={libraryInput.pairedRead2}
            singleRead={libraryInput.singleRead}
            sraResetKey={libraryInput.sraResetKey}
            selectedLibraries={libraryInput.selectedLibraries}
            setPairedRead1={(path) => {
              libraryInput.setPairedRead1(path);
              if (path) setCurrentSampleId(getDefaultSampleIdFromPath(path));
            }}
            setPairedRead2={libraryInput.setPairedRead2}
            setSingleRead={(path) => {
              libraryInput.setSingleRead(path);
              if (path) setCurrentSampleId(getDefaultSampleIdFromPath(path));
            }}
            setLibraries={handleSetSelectedLibraries}
            onPairedAdd={handlePairedLibraryAdd}
            onSingleAdd={handleSingleLibraryAdd}
            onSraChange={handleSraAccessionChange}
            sraExtras={
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                  <div className="flex-1 space-y-2">
                    <Label className="service-card-label">Primers</Label>
                    <form.Field name="primers">
                      {(field) => (
                        <FieldItem>
                          <Select
                            items={primerOptions}
                            value={field.state.value}
                            onValueChange={(v) =>
                              v != null && field.handleChange(v as Primers)
                            }
                          >
                            <SelectTrigger className="service-card-select-trigger">
                              <SelectValue placeholder="Select primers" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {primerOptions.map((primer) => (
                                  <SelectItem
                                    key={primer.value}
                                    value={primer.value}
                                  >
                                    {primer.label}
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
                  <div className="w-full space-y-2 sm:w-32">
                    <Label className="service-card-label">Version</Label>
                    <form.Field name="primer_version">
                      {(field) => (
                        <FieldItem>
                          <Select
                            items={primerVersionOpts}
                            value={field.state.value}
                            onValueChange={(value) =>
                              value != null && field.handleChange(value)
                            }
                          >
                            <SelectTrigger className="service-card-select-trigger">
                              <SelectValue placeholder="Version" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {primerVersionOpts.map((version) => (
                                  <SelectItem
                                    key={version.value}
                                    value={version.value}
                                  >
                                    {version.label}
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
                </div>

                <div className="space-y-2">
                  <Label className="service-card-label">Sample Identifier</Label>
                  <Input
                    className="service-card-input"
                    placeholder="SAMPLE ID"
                    value={currentSampleId}
                    onChange={(e) => setCurrentSampleId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="service-card-label">
                    Sample Date (optional)
                  </Label>
                  <Input
                    className="service-card-input"
                    placeholder="MM/DD/YYYY"
                    value={currentSampleDate}
                    onChange={(e) => setCurrentSampleDate(e.target.value)}
                  />
                </div>
              </>
            }
          />
        </div>

        {/* Selected Libraries */}
        <div className="md:col-span-6">
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
                items={libraryInput.selectedLibraries.map((lib) => ({
                  id: lib.id,
                  name: lib.name,
                  type: getLibraryTypeLabel(lib.type),
                }))}
                onRemove={libraryInput.removeLibrary}
                className="max-h-80 overflow-y-auto"
              />
            </CardContent>
          </Card>
        </div>

        {/* Parameters */}
        <div className="md:col-span-12">
          <Card>
            <CardHeader className="service-card-header">
              <RequiredFormCardTitle className="service-card-title">
                Parameters
                <DialogInfoPopup
                  title={sarsCov2WastewaterAnalysisParameters.title}
                  sections={sarsCov2WastewaterAnalysisParameters.sections}
                />
              </RequiredFormCardTitle>
            </CardHeader>
            <CardContent className="service-card-content space-y-4">
              <div className="space-y-2">
                <Label className="service-card-label">Strategy</Label>
                <form.Field name="recipe">
                  {(field) => (
                    <FieldItem>
                      <Select
                        items={recipeOptions}
                        value={field.state.value}
                        onValueChange={(value) =>
                          value != null && field.handleChange(value)
                        }
                      >
                        <SelectTrigger className="service-card-select-trigger">
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {recipeOptions.map((recipe) => (
                              <SelectItem
                                key={recipe.value}
                                value={recipe.value}
                              >
                                {recipe.label}
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

              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <OutputLocationFields form={form} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form controls */}
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
