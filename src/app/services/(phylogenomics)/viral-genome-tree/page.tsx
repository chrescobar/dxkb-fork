"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Info, ExternalLink, Plus, ArrowRight } from "lucide-react";
import { CiCircleInfo } from "react-icons/ci";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function GeneProteinTreePage() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sequenceType, setSequenceType] = useState<"dna" | "protein">("dna");
  const [selectedModel, setSelectedModel] = useState<string>("gtr");
  const [metadataFields, setMetadataFields] = useState([
    { id: "genomeId", name: "Genome ID", selected: true },
    { id: "genomeName", name: "Genome Name", selected: true },
    { id: "species", name: "Species", selected: true },
    { id: "strain", name: "Strain", selected: true },
    { id: "accession", name: "Accession", selected: true },
    { id: "subtype", name: "Subtype", selected: true },
  ]);
  const [selectedMetadataField, setSelectedMetadataField] =
    useState<string>("");
  const [featureGroup, setFeatureGroup] = useState<string>("");
  const [alignedFasta, setAlignedFasta] = useState<string>("");
  const [unalignedFasta, setUnalignedFasta] = useState<string>("");

  const handleFileSelect = (fileName: string) => {
    setSelectedFiles([...selectedFiles, fileName]);
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(selectedFiles.filter((file) => file !== fileName));
  };

  const addMetadataField = () => {
    if (selectedMetadataField) {
      setMetadataFields(
        metadataFields.map((field) =>
          field.id === selectedMetadataField
            ? { ...field, selected: true }
            : field,
        ),
      );
      setSelectedMetadataField("");
    }
  };

  const removeMetadataField = (fieldId: string) => {
    setMetadataFields(
      metadataFields.map((field) =>
        field.id === fieldId ? { ...field, selected: false } : field,
      ),
    );
  };

  const handleFeatureGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeatureGroup(e.target.value);
  };

  const handleAlignedFastaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlignedFasta(e.target.value);
  };

  const handleUnalignedFastaChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setUnalignedFasta(e.target.value);
  };

  const addFeatureGroup = () => {
    if (featureGroup.trim()) {
      handleFileSelect(featureGroup);
      setFeatureGroup("");
    }
  };

  const addAlignedFasta = () => {
    if (alignedFasta.trim()) {
      handleFileSelect(alignedFasta);
      setAlignedFasta("");
    }
  };

  const addUnalignedFasta = () => {
    if (unalignedFasta.trim()) {
      handleFileSelect(unalignedFasta);
      setUnalignedFasta("");
    }
  };

  return (
    <section className="service-container container">
      {/* Header */}
      <div className="service-header">
        <div className="service-header-title">
          <h1>Viral Genome Tree</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="service-header-tooltip" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Information about Viral Genome Tree service
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="service-header-description">
          <p>
          The Viral Genome Tree Service enables construction of whole genome alignment
          based phylogenetic trees for user-selected viral genomes.
          For further explanation, please see the Viral Genome Tree Service: {" "}
            <a href="#">
              Quick Reference Guide
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            {", "}
            <a href="#">
              Tutorial
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            {" "}and{" "}
            <a href="#">
              Instructional Video
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            .
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="service-form-section-header">
              Input
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose FASTA file or genomes for the tree</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Choose fasta file or features for tree.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center">
                  <Label>Feature Group</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="ml-2">
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select a feature group</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Optional"
                    value={featureGroup}
                    onChange={handleFeatureGroupChange}
                  />
                  <Button size="icon" variant="outline">
                    <Upload size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={addFeatureGroup}
                  >
                    <Plus className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center">
                  <Label>Uploaded Aligned Fasta</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="ml-2">
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upload already aligned FASTA files</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Optional"
                    value={alignedFasta}
                    onChange={handleAlignedFastaChange}
                  />
                  <Button size="icon" variant="outline">
                    <Upload size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={addAlignedFasta}
                  >
                    <Plus className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center">
                  <Label>Submitted Unaligned Fasta</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="ml-2">
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upload unaligned FASTA files</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Optional"
                    value={unalignedFasta}
                    onChange={handleUnalignedFastaChange}
                  />
                  <Button size="icon" variant="outline">
                    <Upload size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={addUnalignedFasta}
                  >
                    <Plus className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>

              <div className="flex-grow space-y-2">
                <Label>Selected Files/Feature Group</Label>
                <div className="flex max-h-96 min-h-48 flex-col overflow-y-auto rounded-md border bg-gray-50 p-2">
                  {selectedFiles.length > 0 ? (
                    <div className="flex-grow space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded bg-white px-2 py-1"
                        >
                          <span className="truncate text-sm">{file}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(file)}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground flex flex-grow items-center justify-center text-sm">
                      No files or features selected
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Parameters */}
        <div className="space-y-4">
          {/* Alignment Parameters */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="service-form-section-header">
                Alignment Parameters
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Set parameters for sequence alignment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Trim Ends of Alignment Threshold</Label>
                  <Select defaultValue="0">
                    <SelectTrigger id="trim-threshold" className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="0.1">0.1</SelectItem>
                      <SelectItem value="0.2">0.2</SelectItem>
                      <SelectItem value="0.3">0.3</SelectItem>
                      <SelectItem value="0.4">0.4</SelectItem>
                      <SelectItem value="0.5">0.5</SelectItem>
                      <SelectItem value="0.6">0.6</SelectItem>
                      <SelectItem value="0.7">0.7</SelectItem>
                      <SelectItem value="0.8">0.8</SelectItem>
                      <SelectItem value="0.9">0.9</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Remove Gappy Sequences Threshold</Label>
                  <Select defaultValue="0">
                    <SelectTrigger id="gappy-threshold" className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="0.1">0.1</SelectItem>
                      <SelectItem value="0.2">0.2</SelectItem>
                      <SelectItem value="0.3">0.3</SelectItem>
                      <SelectItem value="0.4">0.4</SelectItem>
                      <SelectItem value="0.5">0.5</SelectItem>
                      <SelectItem value="0.6">0.6</SelectItem>
                      <SelectItem value="0.7">0.7</SelectItem>
                      <SelectItem value="0.8">0.8</SelectItem>
                      <SelectItem value="0.9">0.9</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tree Parameters */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="service-form-section-header">
                Tree Parameters
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Set parameters for the phylogenetic tree</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <RadioGroup
                    defaultValue="raxml"
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <RadioGroupItem value="raxml" id="raxml" />
                      <Label htmlFor="raxml" className="ml-2">
                        RAxML
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="phyml" id="phyml" />
                      <Label htmlFor="phyml" className="ml-2">
                        PhyML
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="fasttree" id="fasttree" />
                      <Label htmlFor="fasttree" className="ml-2">
                        FastTree
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Model</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger id="model" className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gtr">GTR</SelectItem>
                      <SelectItem value="tn93">TN93</SelectItem>
                      <SelectItem value="hky85">HKY85</SelectItem>
                      <SelectItem value="f84">F84</SelectItem>
                      <SelectItem value="f81">F81</SelectItem>
                      <SelectItem value="k80">K80</SelectItem>
                      <SelectItem value="jc96">JC96</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Output Folder</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Output Folder" />
                    <Button size="icon" variant="outline">
                      <Upload size={16} />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Output Name</Label>
                  <Input placeholder="Output Name" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Metadata Options */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="service-form-section-header">
            Metadata Options
            <Badge variant="outline">
              {metadataFields.filter((f) => f.selected).length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label>Metadata Table</Label>
                <p className="text-muted-foreground pt-2 pb-4 text-sm">
                  These fields will appear as options in the phylogeny
                  visualization
                </p>

                <div className="flex gap-2">
                  <Select
                    value={selectedMetadataField}
                    onValueChange={setSelectedMetadataField}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {metadataFields
                        .filter((field) => !field.selected)
                        .map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={addMetadataField}
                    disabled={!selectedMetadataField}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Metadata Table</Label>
              <Table className="mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead className="w-24 text-center">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metadataFields
                    .filter((field) => field.selected)
                    .map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>{field.name}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMetadataField(field.id)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <X size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Controls */}
      <div className="service-form-controls">
        <Button variant="outline">Reset</Button>
        <Button>Submit</Button>
      </div>
    </section>
  );
}
