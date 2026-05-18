export interface BacteriaTab {
  label: string;
  href: string;
  active?: boolean;
}

export const bacteriaTabs: BacteriaTab[] = [
  { label: "Overview", href: "#overview", active: true },
  { label: "Phylogeny", href: "#phylogeny" },
  { label: "Taxonomy", href: "#taxonomy" },
  { label: "Genomes", href: "#genomes" },
  { label: "AMR Phenotypes", href: "#amr" },
  { label: "Sequences", href: "#sequences" },
  { label: "Features", href: "#features" },
  { label: "Proteins", href: "#proteins" },
  { label: "Protein Structures", href: "#protein-structures" },
  { label: "Specialty Genes", href: "#specialty-genes" },
  { label: "Domains & Motifs", href: "#domains-motifs" },
  { label: "Epitopes", href: "#epitopes" },
  { label: "Pathways", href: "#pathways" },
  { label: "Subsystems", href: "#subsystems" },
  { label: "Experiments", href: "#experiments" },
  { label: "Interactions", href: "#interactions" },
];
