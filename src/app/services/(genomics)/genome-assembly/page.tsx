"use client";

import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { ServiceHeader } from "@/components/services/service-header";
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
import { genomeAssemblyInfo, readInputFileInfo } from "@/lib/services/info/genome-assembly";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import SraRunAccessionWithValidation from "@/components/services/sra-run-accession-with-validation";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { Library } from "@/types/services";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { toast } from "sonner";
import {
  genomeAssemblyFormSchema,
  defaultGenomeAssemblyFormValues,
  type GenomeAssemblyFormData,
  type LibraryItem,
} from "@/lib/forms/(genomics)/genome-assembly/genome-assembly-form-schema";
import { genomeAssemblyService } from "@/lib/forms/(genomics)/genome-assembly/genome-assembly-service";
import {
  RequiredFormCardTitle,
} from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { WorkspaceObject } from "@/lib/services/workspace/types";
import { ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  buildBaseLibraryItem,
  getPairedLibraryName,
  getSingleLibraryName,
  useTanstackLibrarySelection,
} from "@/lib/forms/tanstack-library-selection";
import { GenomeAssemblyParametersCard } from "./genome-assembly-parameters-card";

function mapAssemblyLibraryToItem(library: Library): LibraryItem {
  if (library.type === "paired") {
    return {
      ...buildBaseLibraryItem(library),
      platform: library.platform || "infer",
      interleaved: library.interleaved || false,
      read_orientation_outward: library.read_orientation_outward || false,
    };
  }
  if (library.type === "single") {
    return {
      ...buildBaseLibraryItem(library),
      platform: library.platform || "infer",
    };
  }
  return buildBaseLibraryItem(library);
}

export default function GenomeAssemblyPage() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [genomeSizeUnit, setGenomeSizeUnit] = useState<"M" | "K">("M");
  const [expectedGenomeSize, setExpectedGenomeSize] = useState(5);
  const [pairedRead1, setPairedRead1] = useState<string | null>(null);
  const [pairedRead2, setPairedRead2] = useState<string | null>(null);
  const [singleRead, setSingleRead] = useState<string | null>(null);
  const [sraResetKey, setSraResetKey] = useState(0);

  const form = useForm({
    defaultValues: defaultGenomeAssemblyFormValues as GenomeAssemblyFormData,
    validators: { onChange: genomeAssemblyFormSchema },
    onSubmit: async ({ value }) => {
      const data = value as GenomeAssemblyFormData;

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

  const {
    selectedLibraries,
    addPairedLibrary,
    addSingleLibrary,
    removeLibrary,
    setLibraries,
  } = useTanstackLibrarySelection<LibraryItem>({
    form,
    mapLibraryToItem: mapAssemblyLibraryToItem,
    fields: {
      paired: "paired_end_libs",
      single: "single_end_libs",
      srr: "srr_ids",
    },
  });

  const runtime = useServiceRuntime({
    definition: genomeAssemblyService,
    form,
    onSuccess: handleReset,
    rerun: {
      libraries: ["paired", "single", "sra"],
      getLibraryExtra: (lib, kind) => {
        if (kind === "paired") {
          return {
            platform: lib.platform || "infer",
            interleaved: !!lib.interleaved,
            read_orientation_outward: !!lib.read_orientation_outward,
          };
        }
        if (kind === "single") {
          return { platform: lib.platform || "infer" };
        }
        return {};
      },
      syncLibraries: setLibraries,
    },
  });

  function handleReset() {
    form.reset(defaultGenomeAssemblyFormValues);
    setLibraries([]);
    setShowAdvanced(false);
    setGenomeSizeUnit("M");
    setExpectedGenomeSize(5);
    setPairedRead1(null);
    setPairedRead2(null);
    setSingleRead(null);
    setSraResetKey((k) => k + 1);
  }

  const recipe = useStore(form.store, (s) => s.values.recipe);
  const showGenomeSizeField = recipe === "canu";
  const canSubmit = useStore(form.store, (s) => s.canSubmit);

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
          platform: "infer",
          interleaved: false,
          read_orientation_outward: false,
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
          platform: "infer",
        },
      }),
      onError: toast.error,
      onAfterAdd: () => {
        setSingleRead(null);
      },
    });
  };

  return (
    <section>
      <ServiceHeader
        title="Genome Assembly"
        description="The Genome Assembly Service allows single or multiple assemblers to be invoked to compare results. The service attempts to select the best assembly."
        infoPopupTitle={genomeAssemblyInfo.title}
        infoPopupDescription={genomeAssemblyInfo.description}
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="grid grid-cols-1 gap-6 md:grid-cols-12"
      >
        <div className="space-y-6 md:col-span-7">
          {/* Input Files Card */}
          <Card>
            <CardHeader className="service-card-header">
              <RequiredFormCardTitle className="service-card-title">
                Input Files
                <DialogInfoPopup
                  title={readInputFileInfo.title}
                  description={readInputFileInfo.description}
                  sections={readInputFileInfo.sections}
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
                    aria-label="Add paired read library to selected libraries"
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
                    onObjectSelect={(object: WorkspaceObject) => {
                      setPairedRead1(object.path);
                    }}
                  />
                  <WorkspaceObjectSelector
                    preset="reads"
                    placeholder="Select READ FILE 2..."
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
                    aria-label="Add single read library to selected libraries"
                    onClick={handleSingleLibraryAdd}
                    disabled={!singleRead}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
                <WorkspaceObjectSelector
                  preset="reads"
                  placeholder="Select READ FILE..."
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
            </CardContent>
          </Card>

          {/* Selected Libraries (mobile) */}
          <div className="md:hidden">
            <Card className="h-full">
              <CardHeader className="service-card-header">
                <CardTitle className="service-card-title">
                  Selected Libraries
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger aria-label="Selected libraries help">
                        <HelpCircle className="service-card-tooltip-icon" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Read files placed here will contribute to a single analysis.</p>
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
                  items={selectedLibraries.map((library) => ({
                    id: library.id,
                    name: library.name,
                    type: library.type,
                  }))}
                  onRemove={removeLibrary}
                  className="max-h-84 overflow-y-auto"
                />
              </CardContent>
            </Card>
          </div>

          <GenomeAssemblyParametersCard
            form={form}
            showGenomeSizeField={showGenomeSizeField}
            genomeSizeUnit={genomeSizeUnit}
            expectedGenomeSize={expectedGenomeSize}
            showAdvanced={showAdvanced}
            onExpectedGenomeSizeChange={(value) => setExpectedGenomeSize(value)}
            onGenomeSizeUnitChange={(unit) => {
              setGenomeSizeUnit(unit);
              setExpectedGenomeSize(unit === "M" ? 5 : 500);
            }}
            onShowAdvancedChange={setShowAdvanced}
          />
        </div>

        {/* Right Column - Selected Libraries (desktop) */}
        <div className="hidden md:col-span-5 md:block">
          <Card className="h-full">
            <CardHeader className="service-card-header">
              <CardTitle className="service-card-title">
                Selected Libraries
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger aria-label="Selected libraries help">
                      <HelpCircle className="service-card-tooltip-icon" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Read files placed here will contribute to a single analysis.</p>
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
                items={selectedLibraries.map((library) => ({
                  id: library.id,
                  name: library.name,
                  type: library.type,
                }))}
                onRemove={removeLibrary}
                className="max-h-84 overflow-y-auto"
              />
            </CardContent>
          </Card>
        </div>

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
            <Button type="submit" disabled={runtime.isSubmitting || !canSubmit}>
              {runtime.isSubmitting ? <Spinner /> : null}
              Assemble
            </Button>
          </div>
        </div>
      </form>

      <JobParamsDialog {...runtime.jobParamsDialogProps} />
    </section>
  );
}
