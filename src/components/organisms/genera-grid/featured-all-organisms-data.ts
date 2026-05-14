export interface FeaturedOrganismEntry {
  name: string;
  href: string;
}

export interface FeaturedOrganismCategory {
  title: string;
  organisms: FeaturedOrganismEntry[];
}

function bvbrcTaxonUrl(taxonId: number): string {
  return `https://www.bv-brc.org/view/Taxonomy/${taxonId}#view_tab=overview`;
}

export const featuredAllOrganisms: FeaturedOrganismCategory[] = [
  {
    title: "The Three Domains",
    organisms: [
      { name: "Bacteria", href: bvbrcTaxonUrl(2) },
      { name: "Archaea", href: bvbrcTaxonUrl(2157) },
      { name: "Eukaryota", href: bvbrcTaxonUrl(2759) },
    ],
  },
  {
    title: "Animals",
    organisms: [
      { name: "Metazoa", href: bvbrcTaxonUrl(33208) },
      { name: "Vertebrata", href: bvbrcTaxonUrl(7742) },
      { name: "Mammalia", href: bvbrcTaxonUrl(40674) },
    ],
  },
  {
    title: "Bacteria",
    organisms: [
      { name: "Proteobacteria", href: bvbrcTaxonUrl(1224) },
      { name: "Firmicutes", href: bvbrcTaxonUrl(1239) },
      { name: "Actinomycetota", href: bvbrcTaxonUrl(201174) },
      { name: "Cyanobacteria", href: bvbrcTaxonUrl(1117) },
    ],
  },
  {
    title: "Archaea",
    organisms: [
      { name: "Euryarchaeota", href: bvbrcTaxonUrl(28890) },
      { name: "Crenarchaeota", href: bvbrcTaxonUrl(28889) },
    ],
  },
];
