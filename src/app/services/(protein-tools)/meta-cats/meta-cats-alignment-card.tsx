"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Label } from "@/components/ui/label";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import type { ServiceCardForm } from "@/lib/services/service-definition";
import type { MetaCatsFormData } from "@/lib/forms/(protein-tools)/meta-cats/meta-cats-form-schema";

interface MetaCatsAlignmentCardProps {
  form: ServiceCardForm<MetaCatsFormData>;
  alignmentFileValue: string;
  groupFileValue: string;
  onAlignmentFileChange: (path: string, type: string) => void;
}

export function MetaCatsAlignmentCard({
  form,
  alignmentFileValue,
  groupFileValue,
  onAlignmentFileChange,
}: MetaCatsAlignmentCardProps) {
  return (
    <div className="mt-4 space-y-4">
      <form.Field name="alignment_file">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => (
          <FieldItem>
            <Label className="service-card-label">Alignment File</Label>
            <WorkspaceObjectSelector
              preset="alignedFasta"
              placeholder="Select alignment file"
              onSelectedObjectChange={(object: WorkspaceObject | null) => {
                const path = object?.path ?? "";
                const type = object?.type ?? "";
                field.handleChange(path);
                onAlignmentFileChange(path, type);
              }}
              value={alignmentFileValue}
            />
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>

      <form.Field name="group_file">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => (
          <FieldItem>
            <Label className="service-card-label">Group File</Label>
            <WorkspaceObjectSelector
              preset="tsv"
              placeholder="Select group file (TSV)"
              onSelectedObjectChange={(object: WorkspaceObject | null) => {
                if (object?.path) {
                  field.handleChange(object.path);
                } else {
                  field.handleChange("");
                }
              }}
              value={groupFileValue}
            />
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>
    </div>
  );
}
