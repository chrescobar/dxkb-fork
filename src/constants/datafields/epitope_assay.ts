import type { DataFieldMap } from "./types";

export const epitopeAssayFields = {
  assay_id: { label: "Assay ID", field: "assay_id", hidden: false, group: "Assay", facet: false, search: true },
  epitope_id: { label: "Epitope ID", field: "epitope_id", hidden: true, group: "Assay", facet: false, search: true },
  assay_type: { label: "Assay Type", field: "assay_type", hidden: false, group: "Assay", facet: true, facet_hidden: false, search: true },
  assay_method: { label: "Assay Method", field: "assay_method", hidden: false, group: "Assay", facet: true, facet_hidden: false, search: true },
  assay_group: { label: "Assay Group", field: "assay_group", hidden: false, group: "Assay", facet: true, facet_hidden: false, search: true },
  assay_result: { label: "Assay Result", field: "assay_result", hidden: false, group: "Assay", facet: true, facet_hidden: false, search: true },
  host_name: { label: "Host Name", field: "host_name", hidden: false, group: "Host", facet: true, facet_hidden: false, search: true },
  pmid: { label: "PubMed ID", field: "pmid", hidden: false, group: "Publication", facet: false, search: true, link: "https://pubmed.ncbi.nlm.nih.gov/{value}/" },
  title: { label: "Title", field: "title", hidden: true, group: "Publication", facet: false, search: true, sortable: false },
  protein_name: { label: "Protein Name", field: "protein_name", hidden: true, group: "Protein", facet: false, search: true },
  epitope_type: { label: "Epitope Type", field: "epitope_type", hidden: true, group: "Epitope", facet: true, facet_hidden: false, search: true },
} satisfies DataFieldMap;
