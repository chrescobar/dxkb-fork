export interface SearchType {
  id: string;
  typeTitle: string;
}

export const searchTypes: readonly SearchType[] = [
  {
    id: "everything",
    typeTitle: "All Data Types",
  },
  {
    id: "genome",
    typeTitle: "Genomes",
  },
  {
    id: "strain",
    typeTitle: "Strains",
  },
  {
    id: "genome_feature",
    typeTitle: "Features",
  },
  /*
  {
    id: "protein",
    typeTitle: "Proteins",
  },
  */
  /*
  {
    id: "sp_gene",
    typeTitle: "Specialty Genes",
  },
  */
  {
    id: "protein_feature",
    typeTitle: "Domains and Motifs",
  },
  {
    id: "epitope",
    typeTitle: "Epitopes",
  },
  {
    id: "protein_structure",
    typeTitle: "Protein Structures",
  },
  /*
  {
    id: "pathway",
    typeTitle: "Pathways",
  },
  {
    id: "subsystem",
    typeTitle: "Subsystems",
  },
  */
  {
    id: "surveillance",
    typeTitle: "Surveillance",
  },
  {
    id: "serology",
    typeTitle: "Serology",
  },
  {
    id: "taxonomy",
    typeTitle: "Taxa",
  },
  {
    id: "experiment",
    typeTitle: "Experiments",
  },
  /*
  {
    id: "antibiotic",
    typeTitle: "Antibiotic",
  },
  */
];
