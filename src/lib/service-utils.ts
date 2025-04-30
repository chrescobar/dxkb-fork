import { Library } from "@/types/services";

export interface FileInput {
  first: string;
  second?: string;
}

export function handlePairedLibraryAdd(
  files: FileInput,
  currentLibraries: Library[]
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
  currentLibraries: Library[]
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
  currentLibraries: Library[]
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