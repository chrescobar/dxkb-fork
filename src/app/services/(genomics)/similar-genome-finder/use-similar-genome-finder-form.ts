"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";
import { useServiceDebugging } from "@/contexts/service-debugging-context";
import { useServiceRuntime } from "@/hooks/services/use-service-runtime";
import {
  defaultSimilarGenomeFinderFormValues,
  similarGenomeFinderFormSchema,
} from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-form-schema";
import { buildMinhashServicePayload } from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-form-utils";
import type { SimilarGenomeFinderResultRow } from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-result-utils";
import { similarGenomeFinderService } from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-service";
import { submitSimilarGenomes } from "./actions";

export function useSimilarGenomeFinderForm() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState<SimilarGenomeFinderResultRow[]>([]);
  const [isCustomSubmitting, setIsCustomSubmitting] = useState(false);
  const { isDebugMode } = useServiceDebugging();

  const form = useForm({
    defaultValues: defaultSimilarGenomeFinderFormValues,
    validators: { onChange: similarGenomeFinderFormSchema },
    onSubmit: async ({ value }) => {
      if (isDebugMode) {
        await runtime.previewOrSubmit(
          buildMinhashServicePayload(value) as unknown as Record<
            string,
            unknown
          >,
        );
        return;
      }
      setIsCustomSubmitting(true);
      try {
        const response = await submitSimilarGenomes(value);
        if (response.success) {
          setResults(response.rows);
          toast.success("Similar Genome Finder completed successfully!", {
            description:
              response.rows.length > 0
                ? `Results returned from Minhash service (${String(response.rows.length)} genome${response.rows.length === 1 ? "" : "s"})`
                : "Results returned from Minhash service",
            closeButton: true,
          });
        } else {
          toast.error("Submission failed", {
            description: response.error,
            closeButton: true,
          });
        }
      } catch (error) {
        toast.error("Submission failed", {
          description:
            error instanceof Error ? error.message : "Failed to submit",
          closeButton: true,
        });
      }
      setIsCustomSubmitting(false);
    },
  });

  const canSubmit = useSelector(form.store, (state) => state.canSubmit);
  const runtime = useServiceRuntime({
    definition: similarGenomeFinderService,
    form,
  });
  const isSubmitting = runtime.isSubmitting || isCustomSubmitting;

  function handleReset() {
    form.reset(defaultSimilarGenomeFinderFormValues);
    setShowAdvanced(false);
    setResults([]);
  }

  return {
    form,
    runtime,
    results,
    canSubmit,
    isSubmitting,
    showAdvanced,
    setShowAdvanced,
    handleReset,
  };
}

export type SimilarGenomeFinderController = ReturnType<
  typeof useSimilarGenomeFinderForm
>;
