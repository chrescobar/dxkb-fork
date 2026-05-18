"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useCachedFeatureGroupLoader } from "@/hooks/services/use-cached-feature-group-loader";
import {
  createGenomeIdMapFromFeatures,
  buildMetaCatsAutoGroupsFromGenomes,
  removeAutoGroupsByRowIds,
  updateAutoGroupsGroupByRowIds,
  getUniqueGroupNames,
} from "@/lib/forms/(protein-tools)/meta-cats/meta-cats-form-utils";
import { fetchGenomesByIds, type GenomeSummary } from "@/lib/services/genome";
import type { AutoGroupItem } from "@/lib/forms/(protein-tools)/meta-cats/meta-cats-form-schema";
import type { WorkspaceObject } from "@/lib/services/workspace/types";

interface UseMetaCatsAutoGroupingOptions {
  form: {
    setFieldValue: (...args: any[]) => void;
    state: { values: Record<string, unknown> };
  };
  fields: {
    autoGroups: string;
    metadataGroup: string;
    yearRanges: string;
  };
}

export interface UseMetaCatsAutoGroupingReturn {
  selectedFeatureGroupObject: WorkspaceObject | null;
  setSelectedFeatureGroupObject: (object: WorkspaceObject | null) => void;
  isLoadingAutoGroup: boolean;
  selectedGridRows: Set<string>;
  setSelectedGridRows: (rows: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  groupNames: string[];
  selectedGroupName: string;
  setSelectedGroupName: (name: string) => void;
  addSelectedFeatureGroup: () => Promise<void>;
  deleteSelectedRows: () => void;
  changeSelectedRowsGroup: () => void;
  reset: () => void;
}

export function useMetaCatsAutoGrouping({
  form,
  fields,
}: UseMetaCatsAutoGroupingOptions): UseMetaCatsAutoGroupingReturn {
  const [selectedFeatureGroupObject, setSelectedFeatureGroupObject] =
    useState<WorkspaceObject | null>(null);
  const [isLoadingAutoGroup, setIsLoadingAutoGroup] = useState(false);
  const [selectedGridRows, setSelectedGridRows] = useState<Set<string>>(
    new Set(),
  );
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [selectedGroupName, setSelectedGroupName] = useState<string>("");

  const featureLoader = useCachedFeatureGroupLoader();

  const addSelectedFeatureGroup = useCallback(async () => {
    if (!selectedFeatureGroupObject?.path) {
      toast.error("No feature group selected", {
        description: "Please select a feature group before adding.",
        closeButton: true,
      });
      return;
    }

    const featureGroupPath = selectedFeatureGroupObject.path;
    const currentMetadataGroup =
      (form.state.values[fields.metadataGroup] as string) || "host_name";
    const yearRanges =
      (form.state.values[fields.yearRanges] as string) || "";

    setIsLoadingAutoGroup(true);

    try {
      const features = await featureLoader.load(featureGroupPath);

      if (features.length === 0) {
        toast.error("Empty feature group", {
          description: "The selected feature group has no features.",
          closeButton: true,
        });
        setIsLoadingAutoGroup(false);
        return;
      }

      const genomeIdMap = createGenomeIdMapFromFeatures(features);
      const genomeIds = Array.from(genomeIdMap.keys());

      const genomes = await fetchGenomesByIds(genomeIds);

      const currentAutoGroups =
        (form.state.values[fields.autoGroups] as AutoGroupItem[]) || [];

      const { newAutoGroups, nextGroupNames } =
        buildMetaCatsAutoGroupsFromGenomes({
          genomes: genomes as unknown as (GenomeSummary &
            Record<string, unknown>)[],
          genomeIdMap,
          metadataGroup: currentMetadataGroup,
          yearRanges,
          existingAutoGroups: currentAutoGroups,
          existingGroupNames: groupNames,
        });

      form.setFieldValue(fields.autoGroups, [
        ...currentAutoGroups,
        ...newAutoGroups,
      ]);
      setGroupNames(nextGroupNames);
      setSelectedFeatureGroupObject(null);

      if (newAutoGroups.length > 0) {
        toast.success(`Added ${newAutoGroups.length} feature(s)`, {
          closeButton: true,
        });
      } else {
        toast.info("No new features added", {
          description: "All features from this group are already in the grid.",
          closeButton: true,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add feature group";
      toast.error("Failed to add feature group", {
        description: errorMessage,
        closeButton: true,
      });
    } finally {
      setIsLoadingAutoGroup(false);
    }
  }, [selectedFeatureGroupObject, form, fields, groupNames, featureLoader]);

  const deleteSelectedRows = useCallback(() => {
    if (selectedGridRows.size === 0) return;

    const currentAutoGroups =
      (form.state.values[fields.autoGroups] as AutoGroupItem[]) || [];
    const updatedAutoGroups = removeAutoGroupsByRowIds(
      currentAutoGroups,
      selectedGridRows,
    );
    form.setFieldValue(fields.autoGroups, updatedAutoGroups);

    const remainingGroupNames = getUniqueGroupNames(updatedAutoGroups);
    setGroupNames(remainingGroupNames);
    setSelectedGridRows(new Set());

    toast.success(`Deleted ${selectedGridRows.size} row(s)`, {
      closeButton: true,
    });
  }, [selectedGridRows, form, fields]);

  const changeSelectedRowsGroup = useCallback(() => {
    if (!selectedGroupName || selectedGridRows.size === 0) {
      toast.error("Select rows and enter a group name", { closeButton: true });
      return;
    }

    const currentAutoGroups =
      (form.state.values[fields.autoGroups] as AutoGroupItem[]) || [];
    const updatedAutoGroups = updateAutoGroupsGroupByRowIds(
      currentAutoGroups,
      selectedGridRows,
      selectedGroupName,
    );

    form.setFieldValue(fields.autoGroups, updatedAutoGroups);

    const newGroupNames = new Set(groupNames);
    newGroupNames.add(selectedGroupName);
    setGroupNames(Array.from(newGroupNames));

    toast.success(`Changed group for ${selectedGridRows.size} row(s)`, {
      closeButton: true,
    });
  }, [selectedGroupName, selectedGridRows, form, fields, groupNames]);

  const reset = useCallback(() => {
    setSelectedFeatureGroupObject(null);
    setSelectedGridRows(new Set());
    setGroupNames([]);
    setSelectedGroupName("");
  }, []);

  return {
    selectedFeatureGroupObject,
    setSelectedFeatureGroupObject,
    isLoadingAutoGroup,
    selectedGridRows,
    setSelectedGridRows,
    groupNames,
    selectedGroupName,
    setSelectedGroupName,
    addSelectedFeatureGroup,
    deleteSelectedRows,
    changeSelectedRowsGroup,
    reset,
  };
}
