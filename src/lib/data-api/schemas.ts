import { z } from "zod";

const identifier = z.string().min(1);
const stringOrNumber = z.union([z.string(), z.number()]);
const optionalTaxonomy = {
  taxon_id: stringOrNumber.optional(),
  taxon_lineage_ids: z
    .union([z.array(stringOrNumber), stringOrNumber])
    .optional(),
};

export const genomeRecordSchema = z.looseObject({
  genome_id: identifier,
  genome_name: z.string().optional(),
  strain: z.string().optional(),
  ...optionalTaxonomy,
  genome_length: stringOrNumber.optional(),
  contigs: stringOrNumber.optional(),
  patric_cds: stringOrNumber.optional(),
});

export const genomeFeatureRecordSchema = z.looseObject({
  feature_id: identifier,
  patric_id: z.string().optional(),
  genome_id: z.string().optional(),
  ...optionalTaxonomy,
});

export const epitopeRecordSchema = z.looseObject({
  epitope_id: identifier,
  epitope_type: z.string().optional(),
  ...optionalTaxonomy,
});

export const epitopeAssayRecordSchema = z.looseObject({
  assay_id: identifier,
  epitope_id: z.string().optional(),
  assay_type: z.string().optional(),
});

export const surveillanceRecordSchema = z.looseObject({
  id: identifier,
  sample_identifier: z.string().optional(),
  pathogen_test_type: z.array(z.string()).optional(),
});

export const serologyRecordSchema = z.looseObject({
  id: identifier,
  sample_identifier: z.string().optional(),
  test_type: z.string().optional(),
});

export const strainRecordSchema = z.looseObject({
  id: identifier,
  strain: z.string().optional(),
  genome_ids: z.array(z.string()).optional(),
  ...optionalTaxonomy,
});

export const proteinFeatureRecordSchema = z.looseObject({
  id: identifier,
  feature_id: z.string().optional(),
  genome_id: z.string().optional(),
  ...optionalTaxonomy,
});

export const proteinStructureRecordSchema = z.looseObject({
  pdb_id: identifier,
  genome_id: z.string().optional(),
  patric_id: z.string().optional(),
  ...optionalTaxonomy,
});

export const experimentRecordSchema = z.looseObject({
  exp_id: identifier.regex(/^\d+$/),
  genome_id: z.string().optional(),
});

export const biosetRecordSchema = z.looseObject({
  bioset_id: identifier,
  exp_id: z.string().optional(),
});

export const genomeSequenceRecordSchema = z.looseObject({
  sequence_id: identifier,
  genome_id: z.string().optional(),
  ...optionalTaxonomy,
});

export const ppiRecordSchema = z.looseObject({
  id: identifier,
});
