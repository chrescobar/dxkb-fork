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
  lineageIds: number[];
  taxonRank: string;
  genomes: number | null;
}

export interface OrganismGenusFacet {
  name: string;
  count: number;
}

export type OrganismMetadataFacets = Record<string, OrganismGenusFacet[]>;

export interface OrganismFetchOptions {
  signal?: AbortSignal;
}

export interface OrganismGeoLocationMeta {
  count: number;
  genera: Record<string, number>;
  hosts: Record<string, number>;
}

export interface OrganismGeoDistribution {
  countryData: Record<string, number>;
  countryMeta: Record<string, OrganismGeoLocationMeta>;
  stateData: Record<string, number>;
  stateMeta: Record<string, OrganismGeoLocationMeta>;
  countyData: Record<string, number>;
  countyMeta: Record<string, OrganismGeoLocationMeta>;
  maxCount: number;
}
