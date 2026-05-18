"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ServiceHeader } from "@/components/services/service-header";
import { OutputLocationFields } from "@/components/services/output-location-fields";
import { Spinner } from "@/components/ui/spinner";
import { primerDesignInfo } from "@/lib/services/info/primer-design";
import {
  defaultPrimerDesignFormValues,
  primerDesignFormSchema,
  type PrimerDesignFormData,
} from "@/lib/forms/(genomics)/primer-design/primer-design-form-schema";
import {
  primerAdvancedFields,
  primerArrayFields,
  primerScalarFields,
  stripPrimerMarkers,
  validatePrimerDesignSequence,
  type MarkerType,
} from "@/lib/forms/(genomics)/primer-design/primer-design-form-utils";
import { primerDesignService } from "@/lib/forms/(genomics)/primer-design/primer-design-service";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import type { WorkspaceObject } from "@/lib/services/workspace/types";
import { PrimerDesignInputSequenceCard } from "./primer-design-input-sequence-card";

export default function PrimerDesignServicePage() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sequenceTextValue, setSequenceTextValue] = useState("");
  const [sequenceTextId, setSequenceTextId] = useState("");
  const [workspaceFastaValue, setWorkspaceFastaValue] = useState("");
  const isRestoringValueRef = useRef(false);
  const selectionRangeRef = useRef<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  const form = useForm({
    defaultValues: defaultPrimerDesignFormValues as PrimerDesignFormData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: { onChange: primerDesignFormSchema as any },
    onSubmit: async ({ value }) => {
      const data = value as PrimerDesignFormData;

      if (data.input_type === "sequence_text") {
        const validation = validatePrimerDesignSequence(data.sequence_input);
        if (!validation.isValid) {
          toast.error(validation.message);
          form.setFieldMeta("sequence_input", (prev) => ({
            ...prev,
            errorMap: { ...prev.errorMap, onChange: validation.message },
          }));
          return;
        }
      }

      await runtime.submitFormData(data);
    },
  });

  const inputType = useStore(form.store, (s) => s.values.input_type);
  const sequenceInput = useStore(form.store, (s) => s.values.sequence_input);
  const canSubmit = useStore(form.store, (s) => s.canSubmit);

  const sequenceValidation = useMemo(() => {
    if (inputType === "workplace_fasta" || !sequenceInput) return null;
    return validatePrimerDesignSequence(sequenceInput);
  }, [inputType, sequenceInput]);

  useEffect(() => {
    if (!sequenceValidation || sequenceValidation.isValid) {
      form.setFieldMeta("sequence_input", (prev) => ({
        ...prev,
        errorMap: { ...prev.errorMap, onChange: undefined },
      }));
    } else {
      form.setFieldMeta("sequence_input", (prev) => ({
        ...prev,
        errorMap: { ...prev.errorMap, onChange: sequenceValidation.message },
      }));
    }
  }, [sequenceValidation, form]);

  function handleSequenceValueChange(value: string) {
    form.setFieldValue("sequence_input", value);
    if (inputType === "sequence_text") setSequenceTextValue(value);

    const validation = validatePrimerDesignSequence(value);
    if (validation.isValid) {
      form.setFieldMeta("sequence_input", (prev) => ({
        ...prev,
        errorMap: { ...prev.errorMap, onChange: undefined },
      }));
      const sanitized = validation.sanitizedSequence;
      if (sanitized !== value) {
        form.setFieldValue("sequence_input", sanitized);
        if (inputType === "sequence_text") setSequenceTextValue(sanitized);
      }
      if (validation.header) {
        const currentIdentifier = form.state.values.SEQUENCE_ID?.trim() || "";
        if (!currentIdentifier) {
          form.setFieldValue("SEQUENCE_ID", validation.header);
          setSequenceTextId(validation.header);
        }
      }
    } else {
      form.setFieldMeta("sequence_input", (prev) => ({
        ...prev,
        errorMap: { ...prev.errorMap, onChange: validation.message },
      }));
    }
  }

  function handleSequenceSelect(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget;
    selectionRangeRef.current = {
      start: target.selectionStart ?? 0,
      end: target.selectionEnd ?? 0,
    };
  }

  function updateSequenceWithMarkers(marker: MarkerType) {
    const currentSequence = form.state.values.sequence_input ?? "";
    if (!currentSequence) return;

    if (marker === "clear") {
      handleSequenceValueChange(stripPrimerMarkers(currentSequence));
      return;
    }

    const { start, end } = selectionRangeRef.current;
    if (start === end) {
      toast.error("Select a region in the sequence before applying markers.");
      return;
    }

    if (currentSequence.startsWith(">")) {
      const headerEndIndex = currentSequence.indexOf("\n");
      if (headerEndIndex >= 0 && start <= headerEndIndex) {
        toast.error("Markers cannot be added to the FASTA header.");
        return;
      }
    }

    const markers = {
      exclude: ["<", ">"],
      target: ["[", "]"],
      include: ["{", "}"],
    } as const;

    const [openMarker, closeMarker] = markers[marker as keyof typeof markers];
    const markedSequence =
      currentSequence.slice(0, start) +
      openMarker +
      currentSequence.slice(start, end) +
      closeMarker +
      currentSequence.slice(end);

    handleSequenceValueChange(markedSequence);
  }

  function handleWorkspaceSelection(object: WorkspaceObject) {
    const path = object.path || "";
    form.setFieldValue("sequence_input", path);
    if (inputType === "workplace_fasta") setWorkspaceFastaValue(path);
  }

  function restoreWorkspaceFasta() {
    if (workspaceFastaValue) {
      isRestoringValueRef.current = true;
      form.setFieldValue("sequence_input", workspaceFastaValue);
      setTimeout(() => { isRestoringValueRef.current = false; }, 200);
    } else {
      form.setFieldValue("sequence_input", "");
    }
  }

  function restoreSequenceText() {
    form.setFieldValue("sequence_input", sequenceTextValue);
    form.setFieldValue("SEQUENCE_ID", sequenceTextId);
  }

  function handleInputTypeChange(
    newInputType: PrimerDesignFormData["input_type"],
    previousInputType: PrimerDesignFormData["input_type"],
  ) {
    const currentSequenceInput = form.state.values.sequence_input || "";
    if (previousInputType === "sequence_text") {
      setSequenceTextValue(currentSequenceInput);
      setSequenceTextId(form.state.values.SEQUENCE_ID || "");
    } else if (previousInputType === "workplace_fasta") {
      setWorkspaceFastaValue(currentSequenceInput);
    }
    form.setFieldValue("input_type", newInputType);
    if (newInputType === "sequence_text") restoreSequenceText();
    else if (newInputType === "workplace_fasta") restoreWorkspaceFasta();
  }

  const runtime = useServiceRuntime({
    definition: primerDesignService,
    form,
    rerun: {
      onApply: (rerunData, form) => {
        const d = rerunData;
        const inputTypeVal = d.input_type as PrimerDesignFormData["input_type"] | undefined;
        if (inputTypeVal === "sequence_text" || inputTypeVal === "workplace_fasta") {
          form.setFieldValue("input_type", inputTypeVal as never);
        }
        if (inputTypeVal === "workplace_fasta") {
          const path = typeof d.sequence_input === "string" ? d.sequence_input : "";
          isRestoringValueRef.current = true;
          form.setFieldValue("sequence_input", path as never);
          setWorkspaceFastaValue(path);
          setTimeout(() => { isRestoringValueRef.current = false; }, 200);
        } else {
          const seq = typeof d.sequence_input === "string" ? d.sequence_input : "";
          const seqId = typeof d.SEQUENCE_ID === "string" ? d.SEQUENCE_ID : "";
          form.setFieldValue("sequence_input", seq as never);
          form.setFieldValue("SEQUENCE_ID", seqId as never);
          setSequenceTextValue(seq);
          setSequenceTextId(seqId);
        }
        if (typeof d.PRIMER_PICK_INTERNAL_OLIGO === "boolean") {
          form.setFieldValue("PRIMER_PICK_INTERNAL_OLIGO", d.PRIMER_PICK_INTERNAL_OLIGO as never);
        }
        for (const field of primerArrayFields) {
          if (d[field] !== undefined) {
            const val = Array.isArray(d[field])
              ? (d[field] as string[])
              : typeof d[field] === "string"
                ? (d[field] as string).trim().split(/\s+/).filter(Boolean)
                : undefined;
            if (val !== undefined) form.setFieldValue(field, val as never);
          }
        }
        for (const field of primerScalarFields) {
          if (d[field] !== undefined) {
            form.setFieldValue(field, String(d[field]) as never);
          }
        }
        const hasAdvancedField = primerAdvancedFields.some((f) => d[f] !== undefined);
        if (hasAdvancedField) setShowAdvanced(true);
      },
    },
  });

  const handleReset = () => {
    form.reset(defaultPrimerDesignFormValues);
    setShowAdvanced(false);
  };

  return (
    <section>
      <ServiceHeader
        title="Primer Design"
        description="The Primer Design Service utilizes Primer3 to design primers from a given input sequence under a variety of temperature, size, and concentration constraints."
        infoPopupTitle={primerDesignInfo.title}
        infoPopupDescription={primerDesignInfo.description}
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <PrimerDesignInputSequenceCard
          form={form}
          inputType={inputType}
          sequenceValidation={sequenceValidation}
          showAdvanced={showAdvanced}
          isRestoringValueRef={isRestoringValueRef}
          onShowAdvancedChange={setShowAdvanced}
          onInputTypeChange={handleInputTypeChange}
          onSequenceValueChange={handleSequenceValueChange}
          onSequenceSelect={handleSequenceSelect}
          onUpdateSequenceWithMarkers={updateSequenceWithMarkers}
          onWorkspaceSelection={handleWorkspaceSelection}
        />

        <Card className="gap-0">
          <CardHeader className="service-card-header pb-1">
            <CardTitle className="service-card-title">Output</CardTitle>
          </CardHeader>
          <CardContent className="service-card-content space-y-3 pt-1">
            <OutputLocationFields form={form} required />
          </CardContent>
        </Card>

        <div className="mt-3! flex flex-row justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit" disabled={runtime.isSubmitting || !canSubmit}>
            {runtime.isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            Submit
          </Button>
        </div>
      </form>

      <JobParamsDialog
        {...runtime.jobParamsDialogProps}
        serviceName="Primer Design"
      />
    </section>
  );
}
