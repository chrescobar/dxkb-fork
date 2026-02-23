import {
  Folder,
  File,
  FileText,
  FileCode,
  FileImage,
  Dna,
  FlaskConical,
  Layers,
  BriefcaseMedical,
  FileArchive,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeIconMap: Record<string, LucideIcon> = {
  folder: Folder,
  job_result: BriefcaseMedical,
  contigs: Dna,
  reads: Dna,
  feature_group: FlaskConical,
  genome_group: Layers,
  experiment_group: FlaskConical,
  feature_dna_fasta: Dna,
  feature_protein_fasta: Dna,
  aligned_dna_fasta: Dna,
  aligned_protein_fasta: Dna,
  modelfolder: Folder,
  csv: FileSpreadsheet,
  tsv: FileSpreadsheet,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  json: FileCode,
  html: FileCode,
  xml: FileCode,
  txt: FileText,
  pdf: FileText,
  png: FileImage,
  jpg: FileImage,
  gif: FileImage,
  svg: FileImage,
  nwk: FileCode,
  pdb: FileCode,
  vcf: FileText,
  tar_gz: FileArchive,
};

const typeFolderLike = new Set([
  "folder",
  "job_result",
  "modelfolder",
  "genome_group",
  "feature_group",
  "experiment_group",
]);

interface WorkspaceItemIconProps {
  type: string;
  className?: string;
}

export function WorkspaceItemIcon({ type, className }: WorkspaceItemIconProps) {
  const Icon = typeIconMap[type] ?? File;
  const isFolderLike = typeFolderLike.has(type);

  return (
    <Icon
      className={cn(
        "h-4 w-4 shrink-0",
        isFolderLike ? "text-amber-500" : "text-muted-foreground",
        className,
      )}
    />
  );
}

export function isFolderType(type: string): boolean {
  return typeFolderLike.has(type);
}
