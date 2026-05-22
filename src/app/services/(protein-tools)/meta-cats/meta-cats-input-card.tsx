"use client";

import { useMemo } from "react";
import { useStore } from "@tanstack/react-form";
import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { metaCATSInput } from "@/lib/services/info/meta-cats";
import {
  metadataOptions,
  maxGroups,
  minGroups,
  type MetaCatsFormData,
  type AutoGroupItem,
} from "@/lib/forms/(protein-tools)/meta-cats/meta-cats-form-schema";
import { getMetaCatsDisplayName, countUniqueGroups } from "@/lib/forms/(protein-tools)/meta-cats/meta-cats-form-utils";
import type { UseMetaCatsYearRangesReturn } from "@/hooks/services/use-meta-cats-year-ranges";
import type { UseMetaCatsAutoGroupingReturn } from "@/hooks/services/use-meta-cats-auto-grouping";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import { MetaCatsAlignmentCard } from "./meta-cats-alignment-card";
import type { ServiceCardForm } from "@/lib/services/service-definition";

interface MetaCatsInputCardProps {
  form: ServiceCardForm<MetaCatsFormData>;
  yearRanges: UseMetaCatsYearRangesReturn;
  autoGrouping: UseMetaCatsAutoGroupingReturn;
  selectedFeatureGroupObject: WorkspaceObject | null;
  setSelectedFeatureGroupObject: (object: WorkspaceObject | null) => void;
  onSelectAllRows: (checked: boolean) => void;
  onRowSelect: (id: string) => void;
  onAddFeatureGroup: () => void;
  onRemoveFeatureGroup: (path: string) => void;
}

export function MetaCatsInputCard({
  form,
  yearRanges,
  autoGrouping,
  selectedFeatureGroupObject,
  setSelectedFeatureGroupObject,
  onSelectAllRows,
  onRowSelect,
  onAddFeatureGroup,
  onRemoveFeatureGroup,
}: MetaCatsInputCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputType = useStore(form.store, (s: any) => s.values.input_type as string);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadataGroup = useStore(form.store, (s: any) => s.values.metadata_group as string);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAutoGroups = useStore(form.store, (s: any) => s.values.auto_groups);
  const autoGroups = useMemo(() => rawAutoGroups || [], [rawAutoGroups]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawFeatureGroups = useStore(form.store, (s: any) => s.values.groups);
  const featureGroups = useMemo(() => rawFeatureGroups || [], [rawFeatureGroups]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alignmentFileValue = useStore(form.store, (s: any) => (s.values.alignment_file as string) ?? "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupFileValue = useStore(form.store, (s: any) => (s.values.group_file as string) ?? "");

  const showYearRanges = metadataGroup === "collection_year";
  const uniqueGroupCount = useMemo(() => countUniqueGroups(autoGroups), [autoGroups]);

  return (
    <Card>
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          Input
          <DialogInfoPopup
            title={metaCATSInput.title}
            description={metaCATSInput.description}
            sections={metaCATSInput.sections}
          />
        </RequiredFormCardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-1">
        <div className="flex flex-col gap-6">
          {/* Input Type Selection */}
          <form.Field name="input_type">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <FieldItem>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(value: string | null) =>
                    value != null &&
                    field.handleChange(
                      value as MetaCatsFormData["input_type"],
                    )
                  }
                  className="service-radio-group-horizontal"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto">Auto Grouping</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="groups" id="groups" />
                    <Label htmlFor="groups">Feature Groups</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="files" id="files" />
                    <Label htmlFor="files">Alignment File</Label>
                  </div>
                </RadioGroup>
                <FieldErrors field={field} />
              </FieldItem>
            )}
          </form.Field>

          {/* Auto Grouping Section */}
          {inputType === "auto" && (
            <div className="space-y-4">
              {/* Metadata Selection */}
              <div className="flex flex-wrap gap-4">
                <form.Field name="metadata_group">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem className="min-w-48">
                      <Label className="service-card-label">Metadata</Label>
                      <Select
                        items={metadataOptions.map((o) => ({
                          value: o.value,
                          label: o.label,
                        }))}
                        value={field.state.value}
                        onValueChange={(value: string | null) => {
                          if (value == null) return;
                          field.handleChange(value);
                          if (value !== "collection_year") {
                            yearRanges.reset();
                          }
                        }}
                      >
                        <SelectTrigger className="service-card-select-trigger">
                          <SelectValue placeholder="Select metadata" />
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={true}
                          side="bottom"
                          sideOffset={4}
                        >
                          <SelectGroup>
                            {metadataOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>

                {/* Year Ranges (only for collection_year) */}
                {showYearRanges && (
                  <div className="min-w-64 flex-1">
                    <Label className="service-card-label">Year Ranges</Label>
                    <Input
                      value={yearRanges.yearRangesInput}
                      onChange={(e) =>
                        yearRanges.handleYearRangesChange(e.target.value)
                      }
                      placeholder="1998,1999-2005,2006"
                      className="service-card-input"
                    />
                    {yearRanges.yearRangesValidation && (
                      <p
                        className={`mt-1 text-xs ${
                          yearRanges.yearRangesValidation.valid
                            ? "text-muted-foreground"
                            : "text-destructive"
                        }`}
                      >
                        {yearRanges.yearRangesValidation.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Feature Group Selector */}
              <div className="space-y-2">
                <Label className="service-card-label">
                  Select Feature Group
                </Label>
                <div className="flex gap-2">
                  <WorkspaceObjectSelector
                    preset="featureGroup"
                    placeholder="Select feature group"
                    onSelectedObjectChange={(object: WorkspaceObject | null) => {
                      autoGrouping.setSelectedFeatureGroupObject(object);
                    }}
                    value={autoGrouping.selectedFeatureGroupObject?.path}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={autoGrouping.addSelectedFeatureGroup}
                    disabled={
                      !autoGrouping.selectedFeatureGroupObject ||
                      autoGrouping.isLoadingAutoGroup
                    }
                  >
                    {autoGrouping.isLoadingAutoGroup ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Alphabet Selection */}
              <form.Field name="auto_alphabet">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <RadioGroup
                      value={field.state.value}
                      onValueChange={(value: string | null) =>
                        value != null && field.handleChange(value as "na" | "aa")
                      }
                      className="service-radio-group-horizontal"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="na" id="auto_dna" />
                        <Label htmlFor="auto_dna">DNA</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="aa" id="auto_protein" />
                        <Label htmlFor="auto_protein">Protein</Label>
                      </div>
                    </RadioGroup>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>

              {/* Group Names ComboBox and Change Group Button */}
              <div className="space-y-2">
                <Label className="service-card-label">Group Names</Label>
                <div className="flex gap-2">
                  <Select
                    items={autoGrouping.groupNames.map((name) => ({
                      value: name,
                      label: name,
                    }))}
                    value={autoGrouping.selectedGroupName}
                    onValueChange={(value: string | null) =>
                      autoGrouping.setSelectedGroupName(value ?? "")
                    }
                  >
                    <SelectTrigger className="service-card-select-trigger flex-1">
                      <SelectValue placeholder="Select or enter group name" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {autoGrouping.groupNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={autoGrouping.changeSelectedRowsGroup}
                    disabled={
                      autoGrouping.selectedGridRows.size === 0 ||
                      !autoGrouping.selectedGroupName
                    }
                  >
                    Change group
                  </Button>
                </div>
              </div>

              {/* Groups Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="service-card-label">Groups Grid</Label>
                  <span
                    className={`text-sm ${
                      uniqueGroupCount >= minGroups &&
                      uniqueGroupCount <= maxGroups
                        ? "text-muted-foreground"
                        : "text-destructive"
                    }`}
                  >
                    {autoGroups.length > 0 &&
                      `Max groups ${maxGroups}. Current ${uniqueGroupCount} group(s).`}
                  </span>
                </div>

                <div className="overflow-hidden rounded-md border">
                  <Table className="service-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            id="select-all-meta-cats"
                            name="select-all-meta-cats"
                            checked={
                              autoGrouping.selectedGridRows.size ===
                                autoGroups.length && autoGroups.length > 0
                            }
                            onCheckedChange={onSelectAllRows}
                          />
                        </TableHead>
                        <TableHead>Patric ID</TableHead>
                        <TableHead>Strain</TableHead>
                        <TableHead>Metadata</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Genome ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {autoGroups.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-muted-foreground py-8 text-center"
                          >
                            No features added. Select a feature group and click
                            + to add.
                          </TableCell>
                        </TableRow>
                      ) : (
                        (autoGroups as AutoGroupItem[]).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                id={`row-${item.id}-checkbox`}
                                name={`row-${item.id}-checkbox`}
                                checked={autoGrouping.selectedGridRows.has(item.id)}
                                onCheckedChange={() => onRowSelect(item.id)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {getMetaCatsDisplayName(item.patric_id, 24)}
                            </TableCell>
                            <TableCell>{item.strain || "-"}</TableCell>
                            <TableCell>{item.metadata || "-"}</TableCell>
                            <TableCell>{item.group || "-"}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.genome_id}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    {autoGroups.length} item(s),{" "}
                    {autoGrouping.selectedGridRows.size} selected
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={autoGrouping.deleteSelectedRows}
                    disabled={autoGrouping.selectedGridRows.size === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Rows
                  </Button>
                </div>

                <form.Field name="auto_groups">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>
            </div>
          )}

          {/* Feature Groups Section */}
          {inputType === "groups" && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="service-card-label">
                  Select Feature Group
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <WorkspaceObjectSelector
                      preset="featureGroup"
                      placeholder="Select feature group"
                      onSelectedObjectChange={(object: WorkspaceObject | null) => {
                        setSelectedFeatureGroupObject(object);
                      }}
                      value={selectedFeatureGroupObject?.path}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onAddFeatureGroup}
                    disabled={!selectedFeatureGroupObject}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <form.Field name="group_alphabet">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(field: any) => (
                  <FieldItem>
                    <RadioGroup
                      value={field.state.value}
                      onValueChange={(value: string | null) =>
                        value != null && field.handleChange(value as "na" | "aa")
                      }
                      className="service-radio-group-horizontal"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="na" id="group_dna" />
                        <Label htmlFor="group_dna">DNA</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="aa" id="group_protein" />
                        <Label htmlFor="group_protein">Protein</Label>
                      </div>
                    </RadioGroup>
                    <FieldErrors field={field} />
                  </FieldItem>
                )}
              </form.Field>

              <div className="space-y-2">
                <Label className="service-card-label">
                  Selected Feature Groups ({featureGroups.length}/{maxGroups})
                </Label>
                <SelectedItemsTable
                  title=""
                  items={featureGroups.map((path: string) => ({
                    id: path,
                    name: path.split("/").pop() || path,
                    type: "file",
                  }))}
                  onRemove={onRemoveFeatureGroup}
                  className="max-h-64 overflow-y-auto"
                />
                {featureGroups.length < minGroups && (
                  <Alert variant="default">
                    <AlertDescription className="text-sm">
                      At least {minGroups} feature groups are required.
                    </AlertDescription>
                  </Alert>
                )}

                <form.Field name="groups">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(field: any) => (
                    <FieldItem>
                      <FieldErrors field={field} />
                    </FieldItem>
                  )}
                </form.Field>
              </div>
            </div>
          )}

          {/* Alignment File Section */}
          {inputType === "files" && (
            <MetaCatsAlignmentCard
              form={form}
              alignmentFileValue={alignmentFileValue}
              groupFileValue={groupFileValue}
              onAlignmentFileChange={(path, type) => {
                form.setFieldValue("alignment_type", type as never);
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
