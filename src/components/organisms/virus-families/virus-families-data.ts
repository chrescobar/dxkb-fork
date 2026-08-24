interface VirusFamily {
  name: string;
  taxonId: number;
}

interface VirusFamilyGroup {
  group: string;
  families: VirusFamily[];
}

interface VirusFamilySubGroup {
  label: string;
  families: VirusFamily[];
}

interface MixedVirusFamilyGroup {
  group: null;
  subGroups: VirusFamilySubGroup[];
}

export type VirusFamiliesColumn = VirusFamilyGroup | MixedVirusFamilyGroup;

export const virusFamilies: VirusFamiliesColumn[] = [
  {
    group: "Single-Stranded Positive-Sense RNA",
    families: [
      { name: "Caliciviridae", taxonId: 11974 },
      { name: "Coronaviridae", taxonId: 11118 },
      { name: "Flaviviridae", taxonId: 11050 },
      { name: "Hepeviridae", taxonId: 291484 },
      { name: "Picornaviridae", taxonId: 12058 },
      { name: "Togaviridae", taxonId: 11018 },
    ],
  },
  {
    group: "Single-Stranded Negative-Sense RNA",
    families: [
      { name: "Bunyaviricetes", taxonId: 3151693 },
      { name: "Filoviridae", taxonId: 11266 },
      { name: "Paramyxoviridae", taxonId: 11158 },
      { name: "Orthomyxoviridae", taxonId: 11308 },
      { name: "Pneumoviridae", taxonId: 11244 },
      { name: "Rhabdoviridae", taxonId: 11270 },
    ],
  },
  {
    group: "Double-Stranded DNA",
    families: [
      { name: "Adenoviridae", taxonId: 10508 },
      { name: "Asfarviridae", taxonId: 137992 },
      { name: "Herpesvirales", taxonId: 548681 },
      { name: "Polyomaviridae", taxonId: 151341 },
      { name: "Poxviridae", taxonId: 10240 },
    ],
  },
  {
    group: null,
    subGroups: [
      {
        label: "Double-Stranded RNA",
        families: [{ name: "Reovirales", taxonId: 2732541 }],
      },
      {
        label: "Single-Stranded DNA",
        families: [{ name: "Parvoviridae", taxonId: 10780 }],
      },
      {
        label: "Partially Double-Stranded DNA",
        families: [{ name: "Hepadnaviridae", taxonId: 10404 }],
      },
    ],
  },
];
