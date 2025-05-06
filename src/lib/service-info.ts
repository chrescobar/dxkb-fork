import { ServiceInfoPopup } from "@/types/services";

// ------------------------------------------------ //
// ------------- Generic Service Info ------------- //
// ------------------------------------------------ //
export const readInputFileInfo: ServiceInfoPopup = {
    title: "Read Input File",
    description: "Upload your paired-end reads, single reads, or provide SRA accession numbers",
    sections: [
        {
            header: "Paired read library",
            subsections: [
                {
                    subheader: "Read File 1 & 2",
                    subdescription: "Many paired read libraries are given as file pairs, with each file containing half of each read pair. Paired read files are expected to be sorted such that each read in a pair occurs in the same Nth position as its mate in their respective files. These files are specified as READ FILE 1 and READ FILE 2. For a given file pair, the selection of which file is READ 1 and which is READ 2 does not matter."
                }
            ]
        },
        {
            header: "Single read library",
            subsections: [
                {
                    subheader: "Read File",
                    subdescription: "The fastq file containing the reads."
                }
            ]
        },
        {
            header: "SRA run accession",
            description: "Allows direct upload of read files from the <a href='https://www.ncbi.nlm.nih.gov/sra'>NCBI Sequence Read Archive</a> to the BV-BRC Assembly Service. Entering the SRR accession number and clicking the arrow will add the file to the selected libraries box for use in the assembly."
        }
    ]
};

// ---------------------------------------------- //
// ------------- BLAST Service Info ------------- //
// ---------------------------------------------- //
export const blastServiceInfo: ServiceInfoPopup = {
    title: "BLAST Overview",
    description:
      "The BLAST service integrates the BLAST (Basic Local Aligment Search Tool) algorithms to perform searches against against public or private genomes in BV-BRC or other reference databases using a DNA or protein sequence and find matching genomes, genes, RNAs, or proteins.",
};

export const blastServiceSearchProgram: ServiceInfoPopup = {
    title: "Search Program",
    description: "There are four BLAST programs provided by BV-BRC, and each has a specific query sequence and database. Clicking on the button in front of the program name will select it and will also select the appropriate databases.",
    sections: [
        {
            header: "BLASTN",
            description: "The query sequence is DNA (nucleotide), and when enabled the program will search against DNA databases of contig or gene sequences.",
        },
        {
            header: "BLASTX",
            description: "The query sequence is DNA (nucleotide), and when enabled the program will search against the protein sequence database."
        },
        {
            header: "BLASTP",
            description: "The query sequence is protein (amino acid), and when enabled the program will search against the protein sequence database."
        },
        {
            header: "tBLASTn",
            description: "The query sequence is protein (amino acid), and when enabled the program will search against DNA databases of contig or gene sequences."
        }
    ]
};

export const blastServiceQuerySource: ServiceInfoPopup = {
    title: "Query Source",
    description: "There are three types of Query sources that are provided by BV-BRC:",
    sections: [
        {
            header: "Enter sequence",
            description: "Paste the query sequence into the box."
        },
        {
            header: "Select FASTA file",
            description: "Choose FASTA file that has been uploaded to the Workspace."
        },
        {
            header: "Select feature group",
            description: "Choose a feature (gene/protein) that has been saved in the Workspace."
        }
    ]
};

export const blastServiceDatabaseSource: ServiceInfoPopup = {
    title: "Database Source",
    description: "DXKB / BV-BRC have different databases to choose from for the source to search wihin:",
    sections: [
        {
            header: "Reference and representative genomes (bacteria, archaea)",
            description: "Those designated by the NCBI. This is the default."
        },
        {
            header: "Reference and representative genomes (virus)",
            description: "Those designated by the NCBI."
        },
        {
            header: "Selected genome list",
            description: "Clicking on 'Search within genome list' in the drop-down box will open a new source box where desired genomes can be added."
        },
        {
            header: "Selected genome group",
            description: "Genome group saved in the Workspace."
        },
        {
            header: "Selected feature group",
            description: "Feature (gene/protein) group saved in the workspace."
        },
        {
            header: "Taxon",
            description: "Selected taxonomic level from the database."
        },
        {
            header: "Selected fasta file",
            description: "FASTA file that has been uploaded to the Workspace."
        }
    ]
};

export const blastServiceDatabaseType: ServiceInfoPopup = {
    title: "Database Type",
    description: "There are three database types:",
    sections: [
        {
            header: "Genome Sequences (NT)",
            description: "Genomic sequences from bacterial and viral genomes in DXKB / BV-BRC, i.e. chromosomes, contigs, plasmids, segments, and partial genomic sequences"
        },
        {
            header: "Genes (NT)",
            description: "Gene sequences from bacterial and viral genomes in DXKB / BV-BRC."
        },
        {
            header: "Proteins (AA)",
            description: "Protein sequences from bacterial and viral genomes in DXKB / BV-BRC."
        }
    ]
};

// ----------------------------------------------------------------- //
// ------------- Genome Alignment (Mauve) Service Info ------------- //
// ----------------------------------------------------------------- //
export const genomeAlignmentMauveInfo: ServiceInfoPopup = {
    title: "Genome Alignment (Mauve) Overview",
    description: "The bacterial Genome Alignment Service uses progressiveMauve to produce a whole genome alignment of two or more genomes. The resulting alignment can be visualized within the BV-BRC website, providing insight into homologous regions and changes due to DNA recombination. It should be noted that this service is currently released as beta. As always, we appreciate your feedback."
};

export const genomeAlignmentSelectGenomes: ServiceInfoPopup = {
    title: "Select Genomes",
    description: "Specifies the genomes (at least 2) to have aligned.",
    sections: [
        {
            header: "Select Genomes",
            description: "Genomes for inclusion in the ingroup for the tree. Type or select a genome name from the genome list. Use the “+ Add” button to add to the Selected Genome Table."
        },
        {
            header: "Or Select Genome Group",
            description: "Option for including a genome group from the workspace. Can be included with, or instead of, the Selected Genomes."
        }
    ]
};

export const genomeAlignmentAdvancedParamaterOptions: ServiceInfoPopup = {
    title: "Advanced Parameter options",
    sections: [
        {
            header: "Manually set seed weight",
            description: "The seed size parameter sets the minimum weight of the seed pattern used to generate local multiple alignments (matches) during the first pass of anchoring the alignment. When aligning divergent genomes or aligning more genomes simultaneously, lower seed weights may provide better sensitivity. However, because Mauve also requires the matching seeds must to be unique in each genome, setting this value too low will reduce sensitivity."
        },
        {
            header: "Weight",
            description: "Minimum pairwise LCB score, refers to the minimum score for Locally Collinear Blocks (LCBs) to be considered in the alignment. The LCB weight sets the minimum number of matching nucleotides identified in a collinear region for that region to be considered true homology versus random similarity. Mauve uses an algorithm called greedy breakpoint elimination to compute a set of Locally Collinear Blocks (LCBs) that have the given minimum weight. By default an LCB weight of 3 times the seed size will be used. The default value is often too low, however, and this value should be set manually."
        }
    ]
};



// ------------------------------------------------------------ //
// ------------- Genome Annotation Service Info ------------- //
// ------------------------------------------------------------ //
// TODO: Fix embedded links support in the Pop-up
export const genomeAnnotationInfo: ServiceInfoPopup = {
    title: "Genome Annotation Overview",
    description: "The Genome Annotation Service uses the RAST tool kit, <a href='https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4322359/'>RASTtk</a>, for bacteria and the <a href='https://github.com/JCVenterInstitute/VIGOR4'>Viral Genome ORF Reader (VIGOR4)</a> for viruses. \
    The service accepts a FASTA formatted contig file and an annotation recipe based on taxonomy to provide an annotated genome, to provide annotation of genomic features. \
    Once the annotation process has started by clicking the “Annotate” button, the genome is queued as a “job” for the Annotation Service to process, and will increment the count in the Jobs information box \
    on the bottom right of the page. Once the annotation job has successfully completed, the output file will appear in the workspace, available for use in the BV-BRC comparative tools and/or can be downloaded if desired."
};

export const genomeAnnotationParameters: ServiceInfoPopup = {
    title: "Genome Annotation Parameters",
    sections: [
        {
            header: "Contigs",
            description: "The target FASTA file containing the genome sequence to annotate."
        },
        {
            header: "Annotation Recipe",
            description: "The method of annotation, which will be determined by the type of microorganism chosen. Note: You MUST select this or jobs may fail."
        },
        {
            header: "Domain",
            description: "The taxonomic domain of the target organism: bacteria or archaea."
        },
        {
            header: "Taxonomy Name",
            description: "The user-entered or selected taxonomic name for the organism. If the target species or strain is not listed, select the most specific, accurate taxonomic level available."
        },
        {
            header: "Taxonomy ID",
            description: "A unique numerical identifier assigned by the NCBI to the source organism of the protein."
        },
        {
            header: "My Label",
            description: "The user-provided name to identify the annotation result."
        },
        {
            header: "Output Name",
            description: "The taxonomy name concatenated with the chosen label. This name will appear in the workspace when the annotation job is complete."
        },
        {
            header: "Output Folder",
            description: "The workspace folder where results will be placed."
        }
    ]
};

// -------------------------------------------------------- //
// ------------- Genome Assembly Service Info ------------- //
// -------------------------------------------------------- //
export const genomeAssemblyInfo: ServiceInfoPopup = {
    title: "Genome Assembly Overview",
    description: "The bacterial Genome Assembly Service allows single or multiple assemblers to be invoked to compare results. Several assembly workflows or “strategies” are available that have been tuned to fit certain data types or desired analysis criteria such as throughput or rigor. Once the assembly process has started by clicking the Assemble button, the genome is queued as a “job” for the Assembly Service to process, and will increment the count in the Jobs information box on the bottom right of the page. Once the assembly job has successfully completed, the output file will appear in the workspace, available for use in the BV-BRC comparative tools and downloaded if desired."
};

export const genomeAssemblyParameters: ServiceInfoPopup = {
    title: "Parameter Options",
    sections: [
        {
            header: "Assembly Strategy",
            subsections: [
                {
                    subheader: "Auto",
                    subdescription: "Will use Canu if only long reads are submitted. If long and short reads, as or short reads alone are submitted, Unicycler is selected."
                },
                {
                    subheader: "Unicycler",
                    subdescription: "Can assemble Illumina-only read sets where it functions as a SPAdes-optimizer. It can also assembly long-read-only sets (PacBio or Nanopore) where it runs a miniasm plus Racon pipeline. For the best possible assemblies, give it both Illumina reads and long reads, and it will conduct a hybrid assembly."
                },
                {
                    subheader: "SPAdes",
                    subdescription: "Designed to assemble small genomes, such as those from bacteria, and uses a multi-sized De Bruijn graph to guide assembly."
                },
                {
                    subheader: "Canu",
                    subdescription: "Long-read assembler which works on both third and fourth generation reads. It is a successor of the old Celera Assembler that is specifically designed for noisy single-molecule sequences. It supports nanopore sequencing, halves depth-of-coverage requirements, and improves assembly continuity. It was designed for high-noise single-molecule sequencing (such as the PacBio RS II/Sequel or Oxford Nanopore MinION)."
                },
                {
                    subheader: "metaSPAdes",
                    subdescription: "Combines new algorithmic ideas with proven solutions from the SPAdes toolkit to address various challenges of metagenomic assembly."
                },
                {
                    subheader: "plasmidSPAdes",
                    subdescription: "For assembling plasmids from whole genome sequencing data and benchmark its performance on a diverse set of bacterial genomes."
                },
                {
                    subheader: "MDA (single-cell)",
                    subdescription: "A new assembler for both single-cell and standard (multicell) assembly, and it improves on the recently released E+V−SC assembler (specialized for single-cell data)."
                },
            ]
        },
        {
            header: "Output Folder",
            description: "The workspace folder where results will be placed."
        },
        {
            header: "Output Name",
            description: "User-provided name used to uniquely identify results."
        },
        {
            header: "Benchmark Contigs",
            description: "This optional parameter can be used to specify a FASTA contigs file to evaluate the assembly against."
        },
        {
            header: "Advanced",
            description: "Trim reads before assembly: Trim reads using TrimGalore (True/False)",
            subsections: [
                {
                    subheader: "Racon iternations and Pilon iterations",
                    subdescription: "Correct assembly errors (or “polish”) using racon and/or Pilon. \
                        Both racon and Pilon take the contigs and the reads mapped to those contigs, and look for discrepancies between the assembly \
                        and the majority of the reads. Where there is a discrepancy, racon or pilon will correct the assembly if the majority of the reads call for that."
                },
                {
                    subheader: "Minimal output contig length",
                    subdescription: "Filter out short contigs in final assembly"
                },
                {
                    subheader: "Minimal output contig coverage",
                    subdescription: "Filter out contigs with low read depth in final assembly"
                }
            ]
        }
    ]
};


// ------------------------------------------------------ //
// ------------- Primer Design Service Info ------------- //
// ------------------------------------------------------ //
export const primerDesignInfo: ServiceInfoPopup = {
    title: "Primer Design Overview",
    description: "The Primer Design Service utilizes Primer3[1-5] to design primers from a given input \
        sequence under a variety of temperature, size, and concentration constraints. Primer3 can be used to design primers \
        for several uses including, PCR (Polymerase Chain Reaction) primers, hybridization probes, and sequencing primers. \
        The service accepts a nucleotide sequence (pasted in, or select a FASTA formatted file from the workspace) \
        and allows users to specify design. After specifying an appropriate output folder and clicking “submit”, \
        the primer design is queued as a “job” to process in the Jobs information box on the bottom right of the page. \
        Once the job has successfully completed, the output file will appear in the workspace, allowing the user to choose from a list of appropriate primers."
};


export const primerDesignInputSequence: ServiceInfoPopup = {
    title: "Input Sequence",
    description: "Users may select one of two input options.",
    sections: [
        {
            header: "Pasting in a relevant sequence",
            subsections: [
                {
                    subheader: "Sequence Identifier",
                    subdescription: "The user-provided name to identify the input sequence. If using a FASTA formatted file, this field will automatically be populated with the sequence name.",
                },
                {
                    subheader: "Paste Sequence",
                    subdescription: "Choosing this option allows users to paste in an input sequence.",
                }
            ]
        },
        {
            header: "Choosing a workspace sequence",
            subsections: [
                {
                    subheader: "Workspace FASTA",
                    subdescription: "Choosing this option allows users to specify the FASTA file from their workspace. \
                        Users will also need to select appropriate target, inclusion and exclusion positions using options shown below. \
                        Selections can either be denoted by highlighting the desired regions and clicking the appropriate buttons (red box), \
                        or by manually typing in a list of coordinates in the appropriate boxes below. \
                        If you would like to design a hybridization probe to detect the PCR product after amplification (real-time PCR applications) you may select the “PICK INTERNAL OLIGO” option as shown above.",
                },
                {
                    subheader: "Excluded Regions",
                    subdescription: "Values should be one or a space-separated list of start, length pairs. Primers will not overlap these regions. These values will be denoted with “< >” symbols.",
                },
                {
                    subheader: "Targets",
                    subdescription: "Values should be one or a space-separated list of start, length pairs. Primers will flank one or more regions. These values will be denoted with “[ ]” symbols.",
                },
                {
                    subheader: "Included Regions",
                    subdescription: "Values should be a single start, length pair. Primers will be picked within this range. These values will be denoted with “{ }” symbols.",
                },
                {
                    subheader: "Primer Overlap Positions",
                    subdescription: "Values should be space separated list of positions, The forward OR reverse primer will overlap one of these positions. These values will be denoted with “-” symbol.",
                }

            ]
        }
    ]
};



// -------------------------------------------------------------- //
// ------------- Similar Genome Finder Service Info ------------- //
// -------------------------------------------------------------- //
export const similarGenomeFinderInfo: ServiceInfoPopup = {
    title: "Similar Genome Finder Overview",
    description: "The bacterial Similar Genome Finder Service will find similar public genomes in BV-BRC or compute genome distance estimation using <a href='https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4915045/'>Mash/MinHash</a>. It returns a set of genomes matching the specified similarity criteria."
};


export const similarGenomeFinderSelectGenome: ServiceInfoPopup = {
    title: "Select a Genome",
    description: "Specifies the genome to use as the basis for finding other similar genomes.",
    sections: [
        {
            header: "Search by Genome Name or Genome ID",
            description: "Selection box for specifying genome in BV-BRC to use as the basis of comparison."
        },
        {
            header: "Or Upload FASTA",
            description: "Alternate option for uploading a FASTA file to use as the basis of comparison. Note: You must be logged into BV-BRC to use this option."
        }
    ]
};

export const similarGenomeFinderAdvancedParameters: ServiceInfoPopup = {
    title: "Parameters",
    sections: [
        {
            header: "Max Hits",
            description: "The maximum number of matching genomes to return."
        },
        {
            header: "P-Value Threshold",
            description: "Sets the maximum allowable p-value associated with the Mash Jaccard estimate used in calculating the distance."
        },
        {
            header: "Distance",
            description: "Mash distance, which estimates the rate of sequence mutation under as simple evolutionary model using k-mers. The Distance parameter sets the maximum Mash distance to include in the Similar Genome Finder Service results. Mash distances are probabilistic estimates associated with p-values."
        },
        {
            header: "Scope",
            description: "Option for limiting the search to only Reference and Representative genomes, or all genomes in BV-BRC."
        }
    ]
};


// ------------------------------------------------------------ //
// ------------- Variation Analysis Service Info ------------- //
// ------------------------------------------------------------ //
export const variationAnalysisInfo: ServiceInfoPopup = {
    title: "Variation Analysis Overview",
    description: "The Variation Analysis Service can be used to identify and annotate sequence variations. \
        The service enables users to upload one or multiple short read samples and compare them to a closely related \
        reference genome. For each sample, the service computes the variations against the reference and presents a detailed list of SNPs, \
        MNPs, insertions and deletions with confidence scores and effects such as “synonymous mutation” and “frameshift.” \
        High confidence variations are downloadable in the standard VCF format augmented by SNP annotation. \
        A summary table illustrating how the variations are shared across the samples is also available."
};

export const variationAnalysisParameters: ServiceInfoPopup = {
    title: "Variation Analysis Parameters",
    sections: [
        {
            header: "Aligner",
            subsections: [
                {
                    subheader: "BWA-mem",
                    subdescription: "BWA-mem is well-rounded aligner for mapping short sequence reads or long query sequences against a large reference genome. It automatically chooses between local and end-to-end alignments, supports paired-end reads and performs chimeric alignment. The algorithm is robust to sequencing errors and applicable to a wide range of sequence lengths from 70bp to a few megabases."
                },
                {
                    subheader: "BWA-mem-strict",
                    subdescription: "BWA-mem-strict is BWA-mem with the default parameters plus “-B9 -O16” to increase the gap extension and clipping penalty. These strict mapping parameters are recommended for cases where contigs and references are known to be very close to each other."
                },
                {
                    subheader: "Bowtie2",
                    subdescription: "Bowtie2 is an aligner that combines the advantages of the full-text minute index and SIMD dynamic programming, achieves very fast and memory-efficient gapped alignment of sequencing reads. It improves on the previous Bowtie method in terms of speed and fraction of reads aligned and is substantially faster than non-“full-text minute index“-based approaches while aligning a comparable fraction of reads. Bowtie 2 performs sensitive gapped alignment without incurring serious computational penalties."
                },
                {
                    subheader: "LAST",
                    subdescription: "LAST can handle big sequence data, like comparing two vertebrate genomes. It can align billions of DNA reads to a genome, and will indicate reliability of each aligned column. In addition, it can compare DNA to proteins, with frameshifts, compare PSSMs to sequences, calculates the likelihood of chance similarities between random sequences, does split and spliced alignment, and can be trained for unusual kinds of sequences (like nanopore)."
                },
                {
                    subheader: "minimap2",
                    subdescription: "minimap2 is a versatile sequence mapping and alignment program for the most popular long read sequencing platforms like Oxford Nanopore Technologies (ONT) and Pacific Biosciences (PacBio). It is very fast and accurate compared to other long-read mappers. minimap2 works efficiently with query sequences from a few kilobases to ~100 megabases in length at an error rate ~15%. It also works with accurate short reads of ≥100 bp in length. Currently, this option uses minimap2 default parameters."
                }
            ]
        },
        {
            header: "SNP Caller",
            subsections: [
                {
                    subheader: "FreeBayes",
                    subdescription: "FreeBayes is an accurate method for sequence organization that includes fragment clustering, paralogue identification and multiple alignment. It calculates the probability that a given site is polymorphic and has an automated evaluation of the full length of all sequences, without limitations on alignment depth."
                },
                {
                    subheader: "BCFtools",
                    subdescription: "BCFtools implements various utilities that manipulate variant calls in the Variant Call Format (VCF) and its binary counterpart BCF. This option invokes the BCFtools’ SNP calling algorithm on top of BCFtools’ mpileup result."
                }
            ]
        },
        {
            header: "Target Genome",
            description: "A target genome to align the reads against. If this genome is a private genome, the search can be narrowed by clicking on the filter icon under the words Target Genome."
        },
        {
            header: "Output Folder",
            description: "The workspace folder where results will be placed."
        },
        {
            header: "Output Name",
            description: "Name used to uniquely identify results."
        }
    ]
};

// ------------------------------------------------------------ //
// ------------- Wastewater Analysis Service Info ------------- //
// ------------------------------------------------------------ //
export const wastewaterAnalysisInputLib: ServiceInfoPopup = {
    title: "Input Library Selection",
    description:
    "This Service accepts read files uploaded to the workspace and SRA run accession values. This service is designed for short amplicon sequenced wastewater samples.",
    sections: [
        {
      header: "Paired Read Library",
      description: "",
      subsections: [
        {
          subheader: "Read File 1 & 2",
          subdescription:
            "Many paired read libraries are given as file pairs, with each file containing half of each read pair. Paired read files are expected to be sorted such that each read in a pair occurs in the same Nth position as its mate in their respective files. These files are specified as READ FILE 1 and READ FILE 2. For a given file pair, the selection of which file is READ 1 and which is READ 2 does not matter.",
        },
      ],
    },
    {
      header: "SRA Run Accession",
      description:
        "Allows direct upload of read files from the NCBI Sequence Read Archive to the Assembly Service. Entering the SRR accession number and clicking the arrow will add the file to the selected libraries box for use in the assembly.",
    },
    {
      header: "Primers / Version",
      description:
        "Primer sequences play a crucial role in amplicon-based sequencing, a method used to analyze a specific region of DNA or RNA. These short, synthetic sequences of nucleotides are designed to bind (or anneal) to specific target sequences in the DNA that flank the region of interest. Once bound, primers initiate DNA amplification. The primers are specific to the target sequence. It is important to select the correct primer type and version so that the synthetic sequences can be removed from your sample.",
    },
    {
      header: "Sample Identifier",
      description:
        "The sample identifier Field will auto populate with the file name. Edit the field by clicking into the text box. The text entered to this the sample identifier fields will be used throughout the output files for the service. This documentation refers to this field as a sample id.",
    },
    {
      header: "Sample Date",
      description:
        "Type the corresponding sample date if it is available to you. Take caution to format your date as Month, Day, Year, MM/DD/YYYY. You must type the “/” between Month and Day / Day and Year. For SRA samples the date may be available in the BioSample data.",
    },
  ],
};

// ------------------------------------------------------------------ //
// ------------- Subspecies Classification Service Info ------------- //
// ------------------------------------------------------------------ //
export const subspeciesClassificationQuerySource: ServiceInfoPopup = {
  title: "Query Source",
  description:
    "Users may enter their input sequence in this box, either by directly pasting in a nucleotide sequence, or by selecting a FASTA file from the BV-BRC or uploading it to the site.",
  sections: [
    {
      header: "Enter Sequence",
      description:
        "Users may enter custom sequences here by pasting in FASTA formatted sequences.",
    },
    {
      header: "Select FASTA file",
      description: "Choose FASTA file that has been uploaded to the Workspace.",
    },
  ],
};

export const subspeciesClassificationSpecies: ServiceInfoPopup = {
  title: "Species",
  description:
    "Select the viral species desired for classification. Current species available for subspecies classification include: Hepatitis C Virus (HCV), Dengue Virus, Saint Louis Encephalitis Virus, West Nile Virus, Japanese Encephalitis Virus, tickborne Encephalitis Virus, Yellow Fever virus, Bovine diarrheal virus 1, Murray Valley Encephalitis virus, and Zika virus.",
};

