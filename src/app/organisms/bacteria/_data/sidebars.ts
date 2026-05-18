export interface PubMedItem {
  journal: string;
  date: string;
  title: string;
  titleEm?: string;
  titleEmAfter?: string;
  authors: string;
}

export const pubmedItems: PubMedItem[] = [
  {
    journal: "Env Technol",
    date: "2026-05-05",
    title: "Synergistic integration of cadmium sulphide and Mn(III)O(IV) nanozymes on ",
    titleEm: "Shewanella oneidensis",
    titleEmAfter: " for photocatalytic hydrogen production with reduced ROS toxicity.",
    authors: "Zhu M, et al.",
  },
  {
    journal: "Cancer Control",
    date: "2026-04-22",
    title:
      "Barriers and facilitators of programmatic HPV testing: lessons learnt from two in-depth provincial case studies ten years after the Jujuy demonstration project in Argentina.",
    authors: "Paolino M, et al.",
  },
  {
    journal: "Environ Microbiol Rep",
    date: "2026-04-18",
    title: "Plasma-Activated Water (PAW) in organic cultivation: an experimental study on soil properties and plant responses.",
    authors: "Islam Z, et al.",
  },
  {
    journal: "J Eukaryot Microbiol",
    date: "2026-04-04",
    title: "Life cycle plasticity of ",
    titleEm: "Colpoda aspera",
    titleEmAfter: " fed with petroleum-tolerant Gram-positive and Gram-negative bacteria.",
    authors: "Mondragón-Camarillo L, et al.",
  },
  {
    journal: "Virulence",
    date: "2026-03-29",
    title: "Bacterial extracellular vesicles as emerging platforms to combat multidrug-resistant bacterial infections.",
    authors: "Zhou Z, et al.",
  },
];

export interface ExternalTool {
  label: string;
  href: string;
}

export const externalTools: ExternalTool[] = [
  { label: "BEI Resources", href: "#" },
  { label: "PATRIC Genome Annotation", href: "#" },
  { label: "NCBI Taxonomy Browser", href: "#" },
  { label: "UniProt KB", href: "#" },
];

export interface FeaturedWorkflow {
  title: string;
  description: string;
  iconType: "layers" | "clock" | "activity" | "trend";
}

export const featuredWorkflows: FeaturedWorkflow[] = [
  { title: "Bacterial Genome Assembly", description: "SPAdes / Unicycler pipeline", iconType: "layers" },
  { title: "Phylogenetic Tree", description: "Build a viral genome tree", iconType: "clock" },
  { title: "AMR Profiling", description: "CARD / ResFinder annotation", iconType: "activity" },
  { title: "Comparative Genomics", description: "SNP & ortholog analysis", iconType: "trend" },
];
