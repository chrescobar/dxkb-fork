"use client";

import { Button } from "@/components/ui/button";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ArrowRight, X } from "lucide-react";

interface MetadataOption {
  value: string;
  label: string;
  isLabel?: boolean;
}

interface MetadataField {
  id: string;
  name: string;
  selected: boolean;
}

interface GeneProteinTreeMetadataOptionsProps {
  showAdvanced: boolean;
  onShowAdvancedChange: (open: boolean) => void;
  metadataFields: MetadataField[];
  selectedMetadataField: string;
  availableMetadataOptions: MetadataOption[];
  onMetadataSelection: (value: string) => void;
  onAddMetadataField: () => void;
  onRemoveMetadataField: (fieldId: string) => void;
}

export function GeneProteinTreeMetadataOptions({
  showAdvanced,
  onShowAdvancedChange,
  metadataFields,
  selectedMetadataField,
  availableMetadataOptions,
  onMetadataSelection,
  onAddMetadataField,
  onRemoveMetadataField,
}: GeneProteinTreeMetadataOptionsProps) {
  return (
    <Collapsible
      open={showAdvanced}
      onOpenChange={onShowAdvancedChange}
      className="service-collapsible-container col-span-2"
    >
      <CollapsibleTrigger className="service-collapsible-trigger">
        Metadata Options
        <ChevronDown
          className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="service-collapsible-content">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label>Metadata Table Fields</Label>
              <p className="text-muted-foreground pt-2 pb-4 text-sm">
                These fields will appear as options in the phyloxml visualization
              </p>

              <div className="flex gap-2">
                <Select
                  items={availableMetadataOptions
                    .filter((f) => !f.isLabel)
                    .map((f) => ({ value: f.value, label: f.label }))}
                  value={selectedMetadataField}
                  onValueChange={(value) =>
                    value != null && onMetadataSelection(value)
                  }
                >
                  <SelectTrigger className="service-card-select-trigger">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent className="max-h-150">
                    <SelectGroup>
                      {availableMetadataOptions.map((field) => {
                        if (field.isLabel) {
                          return (
                            <SelectLabel
                              key={field.value}
                              className="border-border mb-1 border-b pb-1.5 font-medium"
                            >
                              {field.label}
                            </SelectLabel>
                          );
                        }
                        return (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={onAddMetadataField}
                  disabled={!selectedMetadataField}
                >
                  <ArrowRight className="h-4 w-4" />
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
                {metadataFields
                  .filter((field) => field.selected)
                  .map((field) => (
                    <TableRow key={field.id} className="h-8">
                      <TableCell className="py-1">{field.name}</TableCell>
                      <TableCell className="py-1 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveMetadataField(field.id)}
                          className="text-destructive hover:text-destructive/90 h-6 w-6"
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
