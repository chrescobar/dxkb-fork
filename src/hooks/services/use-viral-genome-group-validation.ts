"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  fetchGenomeGroupMembers,
  validateViralGenomes,
} from "@/lib/services/genome";

export interface ViralGenomeGroupValidationOptions {
  maxGenomes: number;
  maxGenomeLength: number;
}

export type ViralGenomeGroupValidationResult =
  | { status: "ok"; genomeIds: string[] }
  | { status: "empty" | "too-large" | "invalid" | "error"; errorMessage?: string };

export function useViralGenomeGroupValidation(options: ViralGenomeGroupValidationOptions) {
  const [isValidating, setIsValidating] = useState(false);

  async function validate(groupPath: string): Promise<ViralGenomeGroupValidationResult> {
    setIsValidating(true);
    try {
      const genomes = await fetchGenomeGroupMembers(groupPath);
      if (genomes.length === 0) {
        toast.error("Empty genome group", {
          description: "The selected genome group is empty.",
          closeButton: true,
        });
        return { status: "empty" };
      }
      if (genomes.length > options.maxGenomes) {
        toast.error("Genome group too large", {
          description: `The genome group has ${genomes.length} genomes, but the maximum is ${options.maxGenomes}.`,
          closeButton: true,
        });
        return { status: "too-large" };
      }
      const genomeIds = genomes.map((g) => g.genome_id);
      const validation = await validateViralGenomes(genomeIds, {
        maxGenomeLength: options.maxGenomeLength,
      });
      if (!validation.allValid) {
        const errors = Object.values(validation.errors).filter(Boolean);
        const errorMsg =
          errors.length > 0
            ? errors.join("\n")
            : "Invalid genome group. Please check that all genomes are viruses with single contigs.";
        toast.error("Genome group validation failed", {
          description: errorMsg,
          duration: 10000,
          closeButton: true,
        });
        return { status: "invalid", errorMessage: errorMsg };
      }
      return { status: "ok", genomeIds };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to validate genome group";
      toast.error("Validation error", { description: errorMessage, closeButton: true });
      return { status: "error", errorMessage };
    } finally {
      setIsValidating(false);
    }
  }

  return { validate, isValidating };
}
