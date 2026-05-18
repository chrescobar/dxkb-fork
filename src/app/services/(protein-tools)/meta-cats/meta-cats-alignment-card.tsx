"use client";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import { Label } from "@/components/ui/label";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import type { WorkspaceObject } from "@/lib/services/workspace/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServiceForm { Field: any; setFieldValue: (...args: any[]) => void }

interface MetaCatsAlignmentCardProps {
  form: ServiceForm;
  onAlignmentFileChange: (object: WorkspaceObject | null) => void;
  onGroupFileChange: (object: WorkspaceObject | null) => void;
  alignmentFileValue: string;
  groupFileValue: string;
}

export function MetaCatsAlignmentCard({
  form,
  onAlignmentFileChange,
  onGroupFileChange,
  alignmentFileValue,
  groupFileValue,
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
                if (object?.path) {
                  field.handleChange(object.path);
                  form.setFieldValue("alignment_type", object.type || "");
                } else {
                  field.handleChange("");
                  form.setFieldValue("alignment_type", "");
                }
                onAlignmentFileChange(object);
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
                onGroupFileChange(object);
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
