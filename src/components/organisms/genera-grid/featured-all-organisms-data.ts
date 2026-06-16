export interface FeaturedOrganismEntry {
  name: string;
  href: string;
}

export interface FeaturedOrganismCategory {
  title: string;
  organisms: FeaturedOrganismEntry[];
}

function taxonUrl(taxonId: number): string {
  return `/taxonomy/${String(taxonId)}`;
}

export const featuredAllOrganisms: FeaturedOrganismCategory[] = [
  {
    title: "The Three Domains",
    organisms: [
      { name: "Bacteria", href: taxonUrl(2) },
      { name: "Archaea", href: taxonUrl(2157) },
      { name: "Eukaryota", href: taxonUrl(2759) },
    ],
  },
  {
    title: "Animals",
    organisms: [
      { name: "Metazoa", href: taxonUrl(33208) },
      { name: "Vertebrata", href: taxonUrl(7742) },
      { name: "Mammalia", href: taxonUrl(40674) },
    ],
  },
  {
    title: "Bacteria",
    organisms: [
      { name: "Proteobacteria", href: taxonUrl(1224) },
      { name: "Firmicutes", href: taxonUrl(1239) },
      { name: "Actinomycetota", href: taxonUrl(201174) },
      { name: "Cyanobacteria", href: taxonUrl(1117) },
    ],
  },
  {
    title: "Archaea",
    organisms: [
      { name: "Euryarchaeota", href: taxonUrl(28890) },
      { name: "Crenarchaeota", href: taxonUrl(28889) },
    ],
  },
];
