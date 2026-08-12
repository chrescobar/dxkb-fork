"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  FieldErrors,
  FieldItem,
  FieldLabel,
} from "@/components/ui/tanstack-form";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { markerLabels } from "@/lib/forms/(genomics)/primer-design/primer-design-form-utils";
import { primerDesignInputSequence } from "@/lib/services/info/primer-design";
import type { PrimerDesignController } from "./use-primer-design-form";

export function PrimerInputSection({
  controller,
  children,
}: {
  controller: PrimerDesignController;
  children: React.ReactNode;
}) {
  const {
    form,
    inputType,
    sequenceValidation,
    handleInputTypeChange,
    handleSequenceValueChange,
    handleSequenceSelect,
    updateSequenceWithMarkers,
    handleWorkspaceSelection,
    handleSelectedWorkspaceObjectChange,
    setSequenceTextId,
  } = controller;

  return (
    <Card className="gap-0">
      <CardHeader className="service-card-header pb-1">
        <CardTitle className="service-card-title">
          Input Sequence
          <DialogInfoPopup
            title={primerDesignInputSequence.title}
            description={primerDesignInputSequence.description}
            sections={primerDesignInputSequence.sections}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <Tabs
          value={inputType}
          onValueChange={handleInputTypeChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="sequence_text">Paste Sequence</TabsTrigger>
            <TabsTrigger value="workplace_fasta">Workspace FASTA</TabsTrigger>
          </TabsList>
          <TabsContent value="sequence_text" className="space-y-3">
            <form.Field name="SEQUENCE_ID">
              {(field) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    Sequence Identifier
                  </FieldLabel>
                  <Input
                    name={field.name}
                    id={field.name}
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                      setSequenceTextId(event.target.value);
                    }}
                    placeholder="Identifier for input sequence"
                    className="service-card-input"
                  />
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
            <form.Field name="sequence_input">
              {(field) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    Paste Sequence
                  </FieldLabel>
                  <Textarea
                    name={field.name}
                    id={field.name}
                    value={field.state.value}
                    onChange={(event) =>
                      { handleSequenceValueChange(event.target.value); }
                    }
                    onSelect={handleSequenceSelect}
                    onKeyUp={handleSequenceSelect}
                    onMouseUp={handleSequenceSelect}
                    placeholder="Enter nucleotide sequence"
                    className="service-card-textarea"
                  />
                  {sequenceValidation && !sequenceValidation.isValid ? (
                    <p className="text-sm text-destructive">
                      {sequenceValidation.message}
                    </p>
                  ) : null}
                  {sequenceValidation?.isValid ? (
                    <p className="text-sm text-green-600">
                      Sequence looks valid.
                    </p>
                  ) : null}
                </FieldItem>
              )}
            </form.Field>
            <div className="space-y-2">
              <Label className="service-card-sublabel">
                Mark Selected Region
              </Label>
              <div className="flex flex-wrap gap-2">
                {(
                  Object.keys(markerLabels) as (keyof typeof markerLabels)[]
                ).map((marker) => (
                  <Button
                    key={marker}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { updateSequenceWithMarkers(marker); }}
                  >
                    {markerLabels[marker]}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { updateSequenceWithMarkers("clear"); }}
                >
                  Clear markers
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="workplace_fasta" className="mt-0">
            <form.Field name="sequence_input">
              {(field) => (
                <FieldItem>
                  <FieldLabel field={field} className="service-card-label">
                    FASTA File
                  </FieldLabel>
                  <WorkspaceObjectSelector
                    preset="featureDnaFasta"
                    placeholder="Select FASTA file from workspace"
                    value={field.state.value}
                    onObjectSelect={handleWorkspaceSelection}
                    onSelectedObjectChange={handleSelectedWorkspaceObjectChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Note: only the first FASTA record will be used.
                  </p>
                  <FieldErrors field={field} />
                </FieldItem>
              )}
            </form.Field>
          </TabsContent>
        </Tabs>
        <form.Field name="PRIMER_PICK_INTERNAL_OLIGO">
          {(field) => (
            <FieldItem className="flex flex-row items-center gap-2">
              <FieldLabel field={field} className="service-card-sublabel">
                Pick Internal Oligo
              </FieldLabel>
              <Switch
                checked={Boolean(field.state.value)}
                onCheckedChange={field.handleChange}
              />
              <FieldErrors field={field} />
            </FieldItem>
          )}
        </form.Field>
        {children}
      </CardContent>
    </Card>
  );
}
