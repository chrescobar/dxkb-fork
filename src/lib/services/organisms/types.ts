export interface OrganismSummary {
  count: number | null;
  uniqueFamily: number | null;
  uniqueGenus: number | null;
  uniqueSpecies: number | null;
  cds: number | null;
  matPeptide: number | null;
  pdb: number | null;
}

export interface OrganismTaxonomy {
  taxonId: number;
  taxonName: string;
  lineageNames: string[];
  taxonRank: string;
  genomes: number | null;
}

export interface OrganismGenusFacet {
  name: string;
  count: number;
}

export type OrganismMetadataFacets = Record<string, OrganismGenusFacet[]>;

export interface OrganismPubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  date: string;
  url: string;
}

export interface OrganismFetchOptions {
  signal?: AbortSignal;
}
