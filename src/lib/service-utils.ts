import type { FormEvent } from "react";
import { Library, Genome } from "@/types/services";

export interface FileInput {
  first: string;
  second?: string;
}

export function handlePairedLibraryAdd(
  files: FileInput,
  currentLibraries: Library[],
): Library[] {
  if (!files.second) return currentLibraries;
  const newId = Date.now();
  return [
    ...currentLibraries,
    {
      id: `paired-${newId}`,
      name: `${files.first} / ${files.second}`,
      type: "paired",
    },
  ];
}

export function handleSingleLibraryAdd(
  files: FileInput,
  currentLibraries: Library[],
): Library[] {
  const newId = Date.now();
  return [
    ...currentLibraries,
    {
      id: `single-${newId}`,
      name: files.first,
      type: "single",
    },
  ];
}

export function handleSraAdd(
  sraAccession: string,
  currentLibraries: Library[],
): Library[] | null {
  if (
    !sraAccession.trim() ||
    currentLibraries.some((lib) => lib.name === sraAccession)
  ) {
    return null;
  }

  return [
    ...currentLibraries,
    {
      id: `sra-${Date.now()}`,
      name: sraAccession,
      type: "sra",
    },
  ];
}

export function removeFromSelectedLibraries(
  id: string,
  selectedLibraries: Library[],
) {
  return selectedLibraries.filter((lib) => lib.id !== id);
}

export function removeFromSelectedGenomes(
  id: string,
  selectedGenomes: Genome[],
) {
  return selectedGenomes.filter((genome) => genome.id !== id);
}

export function addGenome(
  genome: Genome,
  selectedGenomes: Genome[],
) {
  return [...selectedGenomes, genome];
}

export function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  console.log("Form submitted");
}