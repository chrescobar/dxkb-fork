"use client";

import { useState } from "react";
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
import { HelpCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { ServiceHeader } from "@/components/services/service-header";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { LibraryInputCard } from "@/components/services/library-input-card";
import { SingleGenomeSelector } from "@/components/services/single-genome-selector";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { Spinner } from "@/components/ui/spinner";

import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { useLibraryInputState } from "@/hooks/services/use-library-input-state";
import {
  fastqUtilitiesInfo,
  fastqUtilitiesParameters,
  fastqUtilitiesPipeline,
  readInputFileInfo,
} from "@/lib/services/info/fastq-utilities";

import {
  fastqUtilitiesFormSchema,
  defaultFastqUtilitiesFormValues,
  pipelineActionOptions,
  platformOptions,
  maxPipelineActions,
  type FastqUtilitiesFormData,
  type LibraryItem,
  type PipelineActionItem,
  type PipelineAction,
  type Platform,
} from "@/lib/forms/(utilities)/fastq-utilities/fastq-utilities-form-schema";
import {
  isAlignSelected,
  createPipelineActionItem,
  removePipelineActionItem,
  actionItemsToRecipe,
} from "@/lib/forms/(utilities)/fastq-utilities/fastq-utilities-form-utils";
import { fastqUtilitiesService } from "@/lib/forms/(utilities)/fastq-utilities/fastq-utilities-service";
import {
  buildBaseLibraryItem,
  getPairedLibraryName,
  getSingleLibraryName,
} from "@/lib/forms/tanstack-library-selection";
import { getLibraryTypeLabel } from "@/lib/forms/shared-schemas";

export default function FastqUtilitiesPage() {
  // Platform state for library inputs
  const [singlePlatform, setSinglePlatform] = useState<Platform>("illumina");

  // Pipeline state
  const [selectedAction, setSelectedAction] = useState<PipelineAction | "">("");
  const [pipelineActions, setPipelineActions] = useState<PipelineActionItem[]>(
    [],
  );

  const form = useForm({
    defaultValues: defaultFastqUtilitiesFormValues as FastqUtilitiesFormData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: { onChange: fastqUtilitiesFormSchema as any },
    onSubmit: async ({ value }) => {
      await runtime.submitFormData(value as FastqUtilitiesFormData);
    },
  });

  const recipe = useStore(form.store, (s) => s.values.recipe);
  const canSubmit = useStore(form.store, (s) => s.canSubmit);

  // Check if align is selected (to show/require target genome)
  const alignSelected = isAlignSelected(recipe);

  const handleLibraryError = (message: string) => {
    if (
      message === "This paired library has already been added" ||
      message === "This single library has already been added"
    ) {
      toast.error("Duplicate library", { description: message });
      return;
    }
    toast.error(message);
  };

  const libraryInput = useLibraryInputState<LibraryItem>({
    form,
    mapLibraryToItem: (library) => ({
      ...buildBaseLibraryItem(library),
      ...(library.type === "single" && {
        platform: (library.platform as Platform) ?? "illumina",
      }),
    }),
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
    buildSingleLibrary: (read) => {
      if (!singlePlatform) {
        return { error: "Platform must be selected for single read library" };
      }
      return {
        library: {
          id: read,
          name: getSingleLibraryName(read),
          type: "single",
          files: [read],
          platform: singlePlatform,
        },
      };
    },
    duplicateMatcher: (library, read) =>
      library.id === read && library.type === "single",
    onPairedError: handleLibraryError,
    onSingleError: handleLibraryError,
  });

  const handleReset = () => {
    form.reset(defaultFastqUtilitiesFormValues as FastqUtilitiesFormData);
    libraryInput.setLibraries([]);
    libraryInput.resetInputState();
    setSinglePlatform("illumina");
    setPipelineActions([]);
    setSelectedAction("");
  };

  const runtime = useServiceRuntime({
    definition: fastqUtilitiesService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      getLibraryExtra: (lib, kind) => {
        if (kind === "single") {
          return { platform: lib.platform };
        }
        return {};
      },
      syncLibraries: libraryInput.setLibraries,
      onApply: (rerunData, form) => {
        // Backend rerun params may serialize a single action as a string and use Title Case.
        const rawRecipe = rerunData.recipe;
        const recipeArray: PipelineAction[] = (
          Array.isArray(rawRecipe)
            ? (rawRecipe as string[])
            : typeof rawRecipe === "string"
              ? [rawRecipe]
              : []
        ).map((a) => a.toLowerCase() as PipelineAction);

        if (recipeArray.length > 0) {
          const actions = recipeArray.map((action, i) =>
            createPipelineActionItem(action, i),
          );
          setPipelineActions(actions);
          form.setFieldValue("recipe", actionItemsToRecipe(actions) as never);
        }
      },
    },
  });
  const { isSubmitting, jobParamsDialogProps } = runtime;

  // Handle adding pipeline action
  const handleAddPipelineAction = () => {
    if (!selectedAction) {
      toast.error("Please select an action first");
      return;
    }

    if (pipelineActions.length >= maxPipelineActions) {
      toast.error("Maximum actions reached", {
        description: `You can add up to ${maxPipelineActions} pipeline actions`,
      });
      return;
    }

    const newActionItem = createPipelineActionItem(
      selectedAction,
      pipelineActions.length,
    );
    const newActions = [...pipelineActions, newActionItem];
    setPipelineActions(newActions);
    form.setFieldValue("recipe", actionItemsToRecipe(newActions));
    setSelectedAction("");
  };

  // Handle removing pipeline action
  const handleRemovePipelineAction = (id: string) => {
    const removedAction = pipelineActions.find((a) => a.id === id);
    const newActions = removePipelineActionItem(pipelineActions, id);
    setPipelineActions(newActions);
    form.setFieldValue("recipe", actionItemsToRecipe(newActions));

    // Clear target genome if align is removed
    if (
      removedAction?.action === "align" &&
      !newActions.some((a) => a.action === "align")
    ) {
      form.setFieldValue("reference_genome_id", "");
    }
  };

  return (
    <section>
      <ServiceHeader
        title="FastQ Utilities"
        description="The FastQ Utilities Service provides capability for aligning, measuring base call quality, and trimming FastQ read files."
        infoPopupTitle={fastqUtilitiesInfo.title}
        infoPopupDescription={fastqUtilitiesInfo.description}
        quickReferenceGuide="https://www.bv-brc.org/docs/quick_references/services/fastq_utilities_service.html"
        tutorial="https://www.bv-brc.org/docs/tutorial/fastq_utilities/fastq_utilities.html"
        instructionalVideo="https://youtube.com/playlist?list=PLWfOyhOW_Oas1LLS2wRlWzilruoSxVeJw"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="grid grid-cols-1 gap-6 md:grid-cols-12"
      >
        {/* Parameters Section */}
        <div className="md:col-span-7">
          <Card className="h-full">
            <CardHeader className="service-card-header">
              <RequiredFormCardTitle className="service-card-title">
                Parameters
                <DialogInfoPopup
                  title={fastqUtilitiesParameters.title}
                  sections={fastqUtilitiesParameters.sections}
                />
              </RequiredFormCardTitle>
            </CardHeader>

            <CardContent className="service-card-content">
              <OutputLocationFields form={form} />
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Section */}
        <div className="md:col-span-5">
          <Card className="h-full">
            <CardHeader className="service-card-header">
              <RequiredFormCardTitle className="service-card-title">
                Pipeline
                <DialogInfoPopup
                  title={fastqUtilitiesPipeline.title}
                  sections={fastqUtilitiesPipeline.sections}
                />
              </RequiredFormCardTitle>
            </CardHeader>

            <CardContent className="service-card-content">
              <div>
                <Label className="service-card-label">Select Action</Label>
                <div className="flex items-center gap-2">
                  <Select
                    items={pipelineActionOptions}
                    value={selectedAction}
                    onValueChange={(value) =>
                      value != null &&
                      setSelectedAction(value as PipelineAction)
                    }
                  >
                    <SelectTrigger className="service-card-select-trigger">
                      <SelectValue placeholder="Select Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {pipelineActionOptions.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddPipelineAction}
                    disabled={
                      !selectedAction ||
                      pipelineActions.length >= maxPipelineActions
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Pipeline Actions List */}
              <div className="mt-4 space-y-2">
                {pipelineActions.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No actions added yet
                  </p>
                ) : (
                  pipelineActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full ${action.color}`}
                        />
                        <span className="text-sm">{action.label}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemovePipelineAction(action.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <form.Field name="recipe">
                {(field) => (
                  <FieldItem>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>

              {/* Target Genome (enabled only when Align is selected) */}
              <div className="pt-4">
                <form.Field name="reference_genome_id">
                  {(field) => (
                    <FieldItem>
                      <SingleGenomeSelector
                        title="Target Genome"
                        placeholder="e.g. Mycobacterium tuberculosis H37Rv"
                        value={field.state.value || ""}
                        onChange={field.handleChange}
                        disabled={!alignSelected}
                        helperText={
                          alignSelected
                            ? undefined
                            : "Add the Align action to enable genome selection."
                        }
                      />
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Input Library Section */}
        <div className="md:col-span-7">
          <LibraryInputCard
            title="Input Library"
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
            singleAddDisabled={!libraryInput.singleRead || !singlePlatform}
            singleExtras={
              <div>
                <Label className="service-card-sublabel">Platform</Label>
                <Select
                  items={platformOptions}
                  value={singlePlatform}
                  onValueChange={(value) =>
                    value != null && setSinglePlatform(value as Platform)
                  }
                >
                  <SelectTrigger className="service-card-select-trigger">
                    <SelectValue placeholder="Select a Platform..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {platformOptions.map((platform) => (
                        <SelectItem
                          key={platform.value}
                          value={platform.value}
                        >
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
                className="max-h-80 overflow-y-auto"
              />
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
