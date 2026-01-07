import type { GeneProteinTreeFormData } from "./gene-protein-tree-form-schema";

/**
 * Transform gene/protein tree form data to API parameters
 */
export function transformGeneProteinTreeParams(
  data: GeneProteinTreeFormData,
): Record<string, any> {
  // Split metadata fields into feature and genome fields
  // For now, all current metadata fields appear to be genome-related
  // Feature metadata fields would be things like gene_id, gene_name, etc.
  const metadataFields = data.metadata_fields || [];
  const featureMetadataFields: string[] = [];
  const genomeMetadataFields: string[] = [];
  
  // Common genome metadata fields
  const genomeFields = [
    "genome_id",
    "genome_name",
    "genome_length",
    "species",
    "strain",
    "accession",
    "subtype",
    "lineage",
    "host_group",
    "host_common_name",
    "collection_date",
    "collection_year",
    "geographic_group",
    "isolation_country",
    "geographic_location",
  ];
  
  metadataFields.forEach((field) => {
    if (genomeFields.includes(field)) {
      genomeMetadataFields.push(field);
    } else {
      // Assume other fields are feature-related
      featureMetadataFields.push(field);
    }
  });
  
  return {
    alphabet: data.alphabet, // API expects "DNA" or "Protein" (uppercase)
    tree_type: "gene",
    recipe: data.recipe,
    substitution_model: data.substitution_model,
    trim_threshold: parseFloat(data.trim_threshold) || 0,
    gap_threshold: parseFloat(data.gap_threshold) || 0,
    sequences: data.sequences.map((seq) => ({
      filename: seq.filename,
      type: seq.type,
    })),
    ...(featureMetadataFields.length > 0 && {
      feature_metadata_fields: featureMetadataFields,
    }),
    ...(genomeMetadataFields.length > 0 && {
      genome_metadata_fields: genomeMetadataFields,
    }),
    output_path: data.output_path,
    output_file: data.output_file.trim(),
  };
}

