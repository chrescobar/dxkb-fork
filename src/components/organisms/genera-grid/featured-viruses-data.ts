export interface FeaturedVirus {
  name: string;
  href: string;
}

export const featuredViruses: FeaturedVirus[] = [
  {
    name: "Bacteriophages",
    href: "https://www.bv-brc.org/view/GenomeList/?and(eq(genome_name,phage),eq(superkingdom,Viruses))",
  },
  {
    name: "Dengue virus",
    href: "https://www.bv-brc.org/view/Taxonomy/3052464#view_tab=overview",
  },
  {
    name: "Ebolavirus",
    href: "https://www.bv-brc.org/view/GenomeList/?in(taxon_lineage_ids,(3044781,186536))",
  },
  {
    name: "Enteroviruses",
    href: "https://www.bv-brc.org/view/Taxonomy/12059#view_tab=overview",
  },
  {
    name: "Hepatitis C virus",
    href: "https://www.bv-brc.org/view/Taxonomy/3052230#view_tab=overview",
  },
  {
    name: "Influenza A virus",
    href: "https://www.bv-brc.org/view/Taxonomy/197911#view_tab=overview",
  },
  {
    name: "Lassa virus",
    href: "https://www.bv-brc.org/view/Taxonomy/3052310#view_tab=overview",
  },
  {
    name: "Measles virus",
    href: "https://www.bv-brc.org/view/Taxonomy/3052345#view_tab=overview",
  },
  {
    name: "Monkeypox Virus",
    href: "https://www.bv-brc.org/view/Taxonomy/10244#view_tab=overview",
  },
  {
    name: "SARS-CoV-2",
    href: "https://www.bv-brc.org/view/Taxonomy/2697049#view_tab=overview",
  },
  {
    name: "Zika Virus",
    href: "https://www.bv-brc.org/view/Taxonomy/3048459#view_tab=overview",
  },
];
