export interface FeaturedVirus {
  name: string;
  href: string;
}

export const featuredViruses: FeaturedVirus[] = [
  {
    name: "Bacteriophages",
    href: "/genome?rql=and(eq(genome_name,phage),eq(superkingdom,Viruses))",
  },
  { name: "Dengue virus", href: "/taxonomy/3052464" },
  {
    name: "Ebolavirus",
    href: "/genome?rql=in(taxon_lineage_ids,(3044781,186536))",
  },
  { name: "Enteroviruses", href: "/taxonomy/12059" },
  { name: "Hepatitis C virus", href: "/taxonomy/3052230" },
  { name: "Influenza A virus", href: "/taxonomy/197911" },
  { name: "Lassa virus", href: "/taxonomy/3052310" },
  { name: "Measles virus", href: "/taxonomy/3052345" },
  { name: "Monkeypox Virus", href: "/taxonomy/10244" },
  { name: "SARS-CoV-2", href: "/taxonomy/2697049" },
  { name: "Zika Virus", href: "/taxonomy/3048459" },
];
