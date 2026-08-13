"use client";

import { ArrowRight, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ViralGenomeTreeController } from "./use-viral-genome-tree";

export function ViralGenomeTreeMetadata({
  controller,
}: {
  controller: ViralGenomeTreeController;
}) {
  const {
    showAdvanced,
    setShowAdvanced,
    selectedMetadataField,
    handleMetadataSelection,
    addMetadataField,
    removeMetadataField,
    availableMetadataOptions,
    selectableMetadataOptions,
    selectedMetadataFields,
  } = controller;
  return (
    <Collapsible
      open={showAdvanced}
      onOpenChange={setShowAdvanced}
      className="service-collapsible-container col-span-2"
    >
      <CollapsibleTrigger className="service-collapsible-trigger">
        Metadata Options
        <ChevronDown
          className={`size-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="service-collapsible-content">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label>Metadata Table Fields</Label>
              <p className="text-muted-foreground pt-2 pb-4 text-sm">
                These fields will appear as options in the phyloxml
                visualization
              </p>
              <div className="flex gap-2">
                <Select
                  items={selectableMetadataOptions}
                  value={selectedMetadataField}
                  onValueChange={(value) => {
                    if (value != null) handleMetadataSelection(value);
                  }}
                >
                  <SelectTrigger
                    className="service-card-select-trigger"
                    aria-label="Metadata table field"
                  >
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent className="max-h-150">
                    <SelectGroup>
                      {availableMetadataOptions.map((field) =>
                        field.isLabel ? (
                          <SelectLabel
                            key={field.value}
                            className="border-border mb-1 border-b pb-1.5 font-medium"
                          >
                            {field.label}
                          </SelectLabel>
                        ) : (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Add metadata field"
                  onClick={addMetadataField}
                  disabled={!selectedMetadataField}
                >
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 py-1">Field</TableHead>
                  <TableHead className="h-8 w-24 py-1 text-center">
                    Remove
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedMetadataFields.map((field) => (
                  <TableRow key={field.id} className="h-8">
                    <TableCell className="py-1">{field.name}</TableCell>
                    <TableCell className="py-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove metadata field"
                        onClick={() => {
                          removeMetadataField(field.id);
                        }}
                        className="text-destructive hover:text-destructive/90 size-6"
                      >
                        <X size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
