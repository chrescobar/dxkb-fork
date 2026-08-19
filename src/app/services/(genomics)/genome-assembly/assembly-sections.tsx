import { ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import OutputFolder from "@/components/services/output-folder";
import SelectedItemsTable from "@/components/services/selected-items-table";
import SraRunAccessionWithValidation from "@/components/services/sra-run-accession-with-validation";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import {
  RequiredFormCardTitle,
  RequiredFormLabel,
} from "@/components/forms/required-form-components";
import {
  genomeAssemblyParameters,
  readInputFileInfo,
} from "@/lib/services/info/genome-assembly";
import {
  calculateGenomeSize,
  genomeAssemblyRecipes,
  genomeSizeUnitOptions,
} from "@/lib/forms/(genomics)/genome-assembly/genome-assembly-form-utils";
import type { Library } from "@/types/services";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import type { AssemblyAction, AssemblyForm, AssemblyUiState } from "./page";

interface InputProps {
  state: AssemblyUiState;
  dispatch: React.Dispatch<AssemblyAction>;
  libraries: Library[];
  setLibraries: (libraries: Library[]) => void;
  addPaired: () => void;
  addSingle: () => void;
}
export function AssemblyInputs({
  state,
  dispatch,
  libraries,
  setLibraries,
  addPaired,
  addSingle,
}: InputProps) {
  return (
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
        <ReadInput
          title="Paired Read Library"
          disabled={!state.pairedRead1 || !state.pairedRead2}
          onAdd={addPaired}
        >
          <WorkspaceObjectSelector
            preset="reads"
            placeholder="Select READ FILE 1..."
            onObjectSelect={(object: WorkspaceObject) => {
              dispatch({
                type: "set-read",
                read: "pairedRead1",
                value: object.path,
              });
            }}
          />
          <WorkspaceObjectSelector
            preset="reads"
            placeholder="Select READ FILE 2..."
            onObjectSelect={(object: WorkspaceObject) => {
              dispatch({
                type: "set-read",
                read: "pairedRead2",
                value: object.path,
              });
            }}
          />
        </ReadInput>
        <ReadInput
          title="Single Read Library"
          disabled={!state.singleRead}
          onAdd={addSingle}
        >
          <WorkspaceObjectSelector
            preset="reads"
            placeholder="Select READ FILE..."
            onObjectSelect={(object: WorkspaceObject) => {
              dispatch({
                type: "set-read",
                read: "singleRead",
                value: object.path,
              });
            }}
          />
        </ReadInput>
        <SraRunAccessionWithValidation
          key={state.sraResetKey}
          title="SRA Run Accession"
          placeholder="SRR..."
          selectedLibraries={libraries}
          setSelectedLibraries={setLibraries}
          allowDuplicates={false}
        />
      </CardContent>
    </Card>
  );
}
function ReadInput({
  title,
  disabled,
  onAdd,
  children,
}: {
  title: string;
  disabled: boolean;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="service-card-label">{title}</Label>
        <div className="mx-4 h-px flex-1 bg-border" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Add ${title.toLowerCase()} to selected libraries`}
          onClick={onAdd}
          disabled={disabled}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function SelectedLibraries({
  libraries,
  onRemove,
  mobile = false,
}: {
  libraries: Library[];
  onRemove: (id: string) => void;
  mobile?: boolean;
}) {
  return (
    <div className={mobile ? "md:hidden" : "hidden md:col-span-5 md:block"}>
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
                  <p>
                    Read files placed here will contribute to a single analysis.
                  </p>
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
            items={libraries.map((library) => ({
              id: library.id,
              name: library.name,
              type: library.type,
            }))}
            onRemove={onRemove}
            className="max-h-84 overflow-y-auto"
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface ParametersProps {
  form: AssemblyForm;
  state: AssemblyUiState;
  dispatch: React.Dispatch<AssemblyAction>;
  outputPath: string;
  showGenomeSize: boolean;
}
export function AssemblyParameters({
  form,
  state,
  dispatch,
  outputPath,
  showGenomeSize,
}: ParametersProps) {
  return (
    <Card>
      <CardHeader className="service-card-header">
        <CardTitle className="service-card-title">
          Parameters
          <DialogInfoPopup
            title={genomeAssemblyParameters.title}
            description={genomeAssemblyParameters.description}
            sections={genomeAssemblyParameters.sections}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="service-card-content">
        <div className="space-y-6">
          <form.Field name="recipe">
            {(field) => (
              <FieldItem>
                <RequiredFormLabel>Assembly Strategy</RequiredFormLabel>
                <Select
                  items={genomeAssemblyRecipes}
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as string);
                  }}
                >
                  <SelectTrigger
                    aria-label="Assembly strategy"
                    className="service-card-select-trigger"
                  >
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {genomeAssemblyRecipes.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
          <form.Field name="output_path">
            {(field) => (
              <FieldItem>
                <OutputFolder
                  required
                  value={field.state.value}
                  onChange={field.handleChange}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
          <form.Field name="output_file">
            {(field) => (
              <FieldItem>
                <OutputFolder
                  variant="name"
                  required
                  value={field.state.value}
                  onChange={field.handleChange}
                  outputFolderPath={outputPath}
                  onValidationChange={(valid) => {
                    dispatch({ type: "set-output-valid", value: valid });
                  }}
                />
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>
          {showGenomeSize && (
            <form.Field name="genome_size">
              {(field) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    Estimated Genome Size
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      id={field.name}
                      name={field.name}
                      aria-label="Estimated Genome Size"
                      type="number"
                      value={state.expectedGenomeSize}
                      onChange={(event) => {
                        const value = event.currentTarget.valueAsNumber;
                        if (Number.isFinite(value)) {
                          dispatch({ type: "set-genome-size", value });
                          field.handleChange(
                            calculateGenomeSize(value, state.genomeSizeUnit),
                          );
                        }
                      }}
                      className="service-card-input flex-1"
                      min={state.genomeSizeUnit === "M" ? 1 : 100}
                      max={state.genomeSizeUnit === "M" ? 10 : 10000}
                    />
                    <span className="text-lg">&times;</span>
                    <Select
                      items={genomeSizeUnitOptions}
                      value={state.genomeSizeUnit}
                      onValueChange={(unit) => {
                        if (unit) {
                          dispatch({ type: "set-unit", unit });
                          field.handleChange(unit === "M" ? 5000000 : 500000);
                        }
                      }}
                    >
                      <SelectTrigger
                        aria-label="Genome size unit"
                        className="service-card-select-trigger w-20"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {genomeSizeUnitOptions.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
          )}
          <AdvancedOptions
            form={form}
            open={state.showAdvanced}
            setOpen={(value) => {
              dispatch({ type: "set-advanced", value });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
function AdvancedOptions({
  form,
  open,
  setOpen,
}: {
  form: AssemblyForm;
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const switches = [
    ["normalize", "Normalize Illumina Reads"],
    ["trim", "Trim Short Reads"],
    ["filtlong", "Filter Long Reads"],
  ] as const;
  const numbers = [
    ["target_depth", "Target Genome Coverage", 100, 500, 50],
    ["racon_iter", "Racon Iterations", 0, 4, 1],
    ["pilon_iter", "Pilon Iterations", 0, 4, 1],
    ["min_contig_len", "Min. contig length", 100, 100000, 10],
    ["min_contig_cov", "Min. contig coverage", 0, 100000, 5],
  ] as const;
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="service-collapsible-container"
    >
      <CollapsibleTrigger className="service-collapsible-trigger">
        Advanced Options
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180 transform" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="service-collapsible-content">
        <div className="space-y-4">
          <Label className="service-card-label">Read Processing</Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {switches.map(([name, label]) => (
              <form.Field key={name} name={name}>
                {(field) => (
                  <FieldItem className="flex flex-col items-start justify-between">
                    <FieldLabel field={field} className="service-card-sublabel">
                      {label}
                    </FieldLabel>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </FieldItem>
                )}
              </form.Field>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {numbers.map(([name, label, min, max, stepper]) => (
            <form.Field key={name} name={name}>
              {(field) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-sublabel">
                    {label}
                  </FieldLabel>
                  <NumberInput
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    min={min}
                    max={max}
                    stepper={stepper}
                  />
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
