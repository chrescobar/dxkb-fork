import { z } from "zod";
import { DEFAULT_METADATA_FIELDS } from "./gene-protein-tree-constants";

// Sequence type enum
export const sequenceTypeSchema = z.enum([
  "feature_group",
  "aligned_dna_fasta",
  "aligned_protein_fasta",
  "feature_dna_fasta",
  "feature_protein_fasta",
]);

// Sequence item schema
export const sequenceItemSchema = z.object({
  filename: z.string().min(1, "Sequence path is required"),
  type: sequenceTypeSchema,
});

// Main form schema
export const geneProteinTreeFormSchema = z
  .object({
    alphabet: z.enum(["DNA", "Protein"], {
      required_error: "Alphabet must be selected",
    }),
    recipe: z.enum(["RAxML", "PhyML", "FastTree"], {
      required_error: "Recipe must be selected",
    }),
    substitution_model: z.string().min(1, "Substitution model is required"),
    trim_threshold: z
      .string()
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num >= 0 && num <= 1;
        },
        {
          message: "Trim threshold must be a number between 0 and 1",
        },
      ),
    gap_threshold: z
      .string()
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num >= 0 && num <= 1;
        },
        {
          message: "Gap threshold must be a number between 0 and 1",
        },
      ),
    sequences: z
      .array(sequenceItemSchema)
      .min(1, "At least one sequence must be selected")
      .max(5000, "Maximum of 5000 sequences allowed"),
    metadata_fields: z.array(z.string()).optional(),
    output_path: z.string().min(1, "Output folder is required"),
    output_file: z.string().min(1, "Output name is required"),
  })
  .superRefine((data, ctx) => {
    // Validate that sequences match the selected alphabet
    const isDNA = data.alphabet === "DNA";
    const validTypes = isDNA
      ? ["feature_group", "aligned_dna_fasta", "feature_dna_fasta"]
      : ["feature_group", "aligned_protein_fasta", "feature_protein_fasta"];

    data.sequences.forEach((seq, index) => {
      if (!validTypes.includes(seq.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Sequence type ${seq.type} does not match selected alphabet ${data.alphabet}`,
          path: ["sequences", index, "type"],
        });
      }
    });

    // Validate substitution model matches alphabet
    const dnaModels = ["GTR", "TN93", "HKY85", "F84", "F81", "K80", "JC69"];
    const proteinModels = [
      "LG",
      "WAG",
      "JTT",
      "Blosum62",
      "Dayhoff",
      "HIVw",
      "HIVb",
    ];

    const validModels = isDNA ? dnaModels : proteinModels;
    if (!validModels.includes(data.substitution_model)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Substitution model ${data.substitution_model} is not valid for ${data.alphabet} sequences`,
        path: ["substitution_model"],
      });
    }
  });

export type GeneProteinTreeFormData = z.infer<typeof geneProteinTreeFormSchema>;
export type SequenceItem = z.infer<typeof sequenceItemSchema>;

// Default form values
export const DEFAULT_GENE_PROTEIN_TREE_FORM_VALUES: GeneProteinTreeFormData = {
  alphabet: "DNA",
  recipe: "RAxML",
  substitution_model: "GTR",
  trim_threshold: "0",
  gap_threshold: "0",
  sequences: [],
  metadata_fields: DEFAULT_METADATA_FIELDS.filter((f) => f.selected).map((f) => f.id),
  output_path: "",
  output_file: "",
};

