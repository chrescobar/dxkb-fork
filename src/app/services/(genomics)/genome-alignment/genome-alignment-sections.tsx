import { useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
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
import { FieldErrors, FieldItem } from "@/components/ui/tanstack-form";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { GenomeNameSelector } from "@/components/services/genome-name-selector";
import OutputFolder from "@/components/services/output-folder";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import {
  genomeAlignmentAdvancedParameterOptions,
  genomeAlignmentSelectGenomes,
} from "@/lib/services/info/genome-alignment";
import {
  fetchGenomeGroupMembers,
  type GenomeSummary,
} from "@/lib/services/genome";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import type { GenomeAlignmentForm } from "./page";

const maxGenomes = 20;

interface GenomeSelectionProps {
  form: GenomeAlignmentForm;
  genomes: GenomeSummary[];
  setGenomes: React.Dispatch<React.SetStateAction<GenomeSummary[]>>;
}

export function GenomeSelection({
  form,
  genomes,
  setGenomes,
}: GenomeSelectionProps) {
  const [isFetchingGroup, setIsFetchingGroup] = useState(false);
  const [lastGroup, setLastGroup] = useState<string | null>(null);
  const [group, setGroup] = useState<WorkspaceObject | null>(null);
  const addGenome = (genome: GenomeSummary) => {
    if (genomes.length >= maxGenomes)
      return toast.error("You can add up to 20 genomes");
    if (genomes.some((item) => item.genome_id === genome.genome_id))
      return toast.error("Genome already added", {
        description: `${genome.genome_name} (${genome.genome_id}) is already in the selection`,
      });
    setGenomes([...genomes, genome]);
    toast.success(`Added ${genome.genome_name}`);
  };
  const addGroup = async (object: WorkspaceObject) => {
    if (!object.path) return toast.error("Invalid genome group selection");
    setIsFetchingGroup(true);
    try {
      const members = await fetchGenomeGroupMembers(object.path);
      if (!members.length) {
        setIsFetchingGroup(false);
        return toast.error("Selected genome group is empty");
      }
      const ids = new Set(genomes.map((item) => item.genome_id));
      const unique = members.filter((item) => !ids.has(item.genome_id));
      if (!unique.length) {
        setIsFetchingGroup(false);
        return toast.info("All genomes in this group are already selected");
      }
      const added = unique.slice(0, maxGenomes - genomes.length);
      if (!added.length) {
        setIsFetchingGroup(false);
        return toast.error("Genome selection limit reached (20 genomes)");
      }
      setGenomes([...genomes, ...added]);
      if (unique.length > added.length)
        toast.warning(
          "Some genomes were not added because the selection limit is 20",
        );
      toast.success(
        `Added ${String(added.length)} genome${added.length === 1 ? "" : "s"} from ${object.name}`,
      );
      form.setFieldValue("genome_group_path", object.path);
      setLastGroup(object.name || object.path);
      setIsFetchingGroup(false);
    } catch (error) {
      setIsFetchingGroup(false);
      toast.error(
        error instanceof Error ? error.message : "Failed to load genome group",
      );
    }
  };
  const items = genomes.map((genome, index) => ({
    id: genome.genome_id,
    name: genome.genome_name,
    description: genome.genome_id,
    type: index === 0 ? "Reference Genome" : "Genome",
  }));

  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Select Genomes
          <DialogInfoPopup
            title={genomeAlignmentSelectGenomes.title}
            description={genomeAlignmentSelectGenomes.description}
            sections={genomeAlignmentSelectGenomes.sections}
          />
        </RequiredFormCardTitle>
        <CardDescription>
          Add at least 2 and up to 20 genomes. The first genome selected becomes
          the reference (anchor) genome in the alignment.
        </CardDescription>
      </CardHeader>
      <CardContent className="service-card-content space-y-6">
        <GenomeNameSelector
          onSelect={addGenome}
          selectedGenomeIds={genomes.map((item) => item.genome_id)}
          maxSelections={maxGenomes}
          helperText="Use the search to add public or private genomes by name or genome ID."
        />
        <div className="space-y-2">
          <Label className="service-card-label">
            And/Or Select Genome Group
          </Label>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <WorkspaceObjectSelector
                preset="genomeGroup"
                placeholder="Select a genome group from your workspace"
                onObjectSelect={(object) => void addGroup(object)}
                onSelectedObjectChange={setGroup}
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Add genome group"
              disabled={!group}
              onClick={() => {
                if (group) {
                  void addGroup(group);
                  setGroup(null);
                }
              }}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {isFetchingGroup ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner className="size-3" />
              Loading genomes from workspace group...
            </div>
          ) : lastGroup ? (
            <p className="text-xs text-muted-foreground">
              Last group added: {lastGroup}
            </p>
          ) : null}
        </div>
        <form.Field name="genome_ids">
          {(field) => (
            <FieldItem>
              <div>
                <SelectedItemsTable
                  title="Selected Genomes"
                  description="Remove genomes as needed. The first entry is treated as the reference genome."
                  items={items}
                  onRemove={(id) => {
                    setGenomes((current) =>
                      current.filter((item) => item.genome_id !== id),
                    );
                  }}
                  emptyMessage="No genomes selected"
                  className="max-h-84 overflow-y-auto"
                />
                {genomes.length < 2 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Select at least two genomes to enable submission.
                  </p>
                )}
              </div>
              <FieldErrors field={field} />
            </FieldItem>
          )}
        </form.Field>
      </CardContent>
    </Card>
  );
}

interface ParametersProps {
  form: GenomeAlignmentForm;
  showAdvanced: boolean;
  setShowAdvanced: (open: boolean) => void;
  onOutputNameValidationChange: (valid: boolean) => void;
}
export function AlignmentParameters({
  form,
  showAdvanced,
  setShowAdvanced,
  onOutputNameValidationChange,
}: ParametersProps) {
  const manual = useSelector(
    form.store,
    (state) => state.values.manual_seed_weight,
  );
  const outputPath = useSelector(
    form.store,
    (state) => state.values.output_path,
  );
  return (
    <Card>
      <CardHeader className="service-card-header">
        <CardTitle className="service-card-title">
          Parameters
          <DialogInfoPopup
            title={genomeAlignmentAdvancedParameterOptions.title}
            description={genomeAlignmentAdvancedParameterOptions.description}
            sections={genomeAlignmentAdvancedParameterOptions.sections}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="service-card-content space-y-6">
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
                onValidationChange={onOutputNameValidationChange}
              />
              <FieldErrors field={field} />
            </FieldItem>
          )}
        </form.Field>
        <Collapsible
          open={showAdvanced}
          onOpenChange={setShowAdvanced}
          className="service-collapsible-container"
        >
          <CollapsibleTrigger className="service-collapsible-trigger">
            Advanced Options
            <ChevronDown
              className={`size-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="service-collapsible-content space-y-6">
            <form.Field name="manual_seed_weight">
              {(field) => (
                <FieldItem>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Label className="service-card-label">
                        Manually Set Seed Weight
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enable to specify the seed weight used by
                        progressiveMauve.
                      </p>
                    </div>
                    <Switch
                      id="manual-seed-weight"
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
            {manual && (
              <form.Field name="seed_weight">
                {(field) => (
                  <FieldItem>
                    <div className="flex items-center justify-between">
                      <Label className="service-card-label">Seed Weight</Label>
                      <span className="text-sm text-muted-foreground">
                        {field.state.value ?? 15}
                      </span>
                    </div>
                    <Slider
                      aria-label="Seed weight"
                      value={[field.state.value ?? 15]}
                      min={3}
                      max={21}
                      step={1}
                      onValueChange={(value) => {
                        field.handleChange(
                          (Array.isArray(value) ? value[0] : value) as number,
                        );
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>3</span>
                      <span>21</span>
                    </div>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>
            )}
            <form.Field name="weight">
              {(field) => (
                <FieldItem>
                  <Label className="service-card-label">Weight</Label>
                  <NumberInput
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    min={0}
                    max={1000000}
                    placeholder="Min pairwise LCB score"
                  />
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
