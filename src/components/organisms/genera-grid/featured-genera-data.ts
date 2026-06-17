import { taxonomyHref } from "@/lib/views/hrefs";

export interface FeaturedGenus {
  name: string;
  href: string;
}

export const featuredGenera: FeaturedGenus[] = [
  { name: "Acinetobacter", href: taxonomyHref(469) },
  { name: "Bacillus", href: taxonomyHref(1386) },
  { name: "Bartonella", href: taxonomyHref(773) },
  { name: "Borreliella", href: taxonomyHref(64895) },
  { name: "Brucella", href: taxonomyHref(234) },
  { name: "Burkholderia", href: taxonomyHref(32008) },
  { name: "Campylobacter", href: taxonomyHref(194) },
  { name: "Chlamydia", href: taxonomyHref(810) },
  { name: "Clostridium", href: taxonomyHref(1485) },
  { name: "Coxiella", href: taxonomyHref(776) },
  { name: "Ehrlichia", href: taxonomyHref(943) },
  { name: "Escherichia", href: taxonomyHref(561) },
  { name: "Francisella", href: taxonomyHref(262) },
  { name: "Helicobacter", href: taxonomyHref(209) },
  { name: "Listeria", href: taxonomyHref(1637) },
  { name: "Mycobacterium", href: taxonomyHref(1763) },
  { name: "Pseudomonas", href: taxonomyHref(286) },
  { name: "Rickettsia", href: taxonomyHref(780) },
  { name: "Salmonella", href: taxonomyHref(590) },
  { name: "Shigella", href: taxonomyHref(620) },
  { name: "Staphylococcus", href: taxonomyHref(1279) },
  { name: "Streptococcus", href: taxonomyHref(1301) },
  { name: "Vibrio", href: taxonomyHref(662) },
  { name: "Yersinia", href: taxonomyHref(629) },
];
