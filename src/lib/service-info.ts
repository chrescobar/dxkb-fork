import { ServiceInfoPopup } from "@/types/services";

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
