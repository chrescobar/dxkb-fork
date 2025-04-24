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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, Info, ChevronDown } from "lucide-react";
import { CiCircleInfo } from "react-icons/ci";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ServiceHeader } from "@/components/services/service-header";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

export default function MSAandSNPAnalysisPage() {
  const [alignmentType, setAlignmentType] = useState("unaligned");
  const [sequenceType, setSequenceType] = useState("feature");
  const [featureGroupType, setFeatureGroupType] = useState("dna");
  const [refSeqType, setRefSeqType] = useState("none");
  const [showStrategy, setShowStrategy] = useState(false);
  // TODO: There is probably a better way to do all this conditional rendering.
  return (
    <section>
      <ServiceHeader
        title="Multiple Sequence Alignment and SNP / Variation Analysis"
        tooltipContent="Multiple Sequence Alignment and SNP / Variation Analysis Information"
        description="The Multiple Sequence Alignment and SNP / Variation Analysis Service allows users to choose an alignment algorithm to align sequences selected from a search result, a FASTA file saved to the workspace, or through simply cutting and pasting. The service can also be used for variation and SNP analysis with feature groups, FASTA files, aligned FASTA files, and user input FASTA records."
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      {/* Main Content */}
      <div className="service-form-section">
        {/* Start with */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              Start with:
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="text-muted-foreground h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose your starting point</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              onValueChange={setAlignmentType}
              defaultValue="unaligned"
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unaligned" id="unaligned" />
                <Label htmlFor="unaligned">Unaligned Sequences</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aligned" id="aligned" />
                <Label htmlFor="aligned">Aligned Sequences</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Select sequences conditional */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              Select sequences:
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="text-muted-foreground h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose sequences for alignment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {alignmentType === "unaligned" ? (
              <div className="space-y-6">
                <RadioGroup
                  onValueChange={setFeatureGroupType}
                  defaultValue="feature"
                  className="flex flex-wrap gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feature" id="feature-group" />
                    <Label htmlFor="feature-group">Feature Group</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="viral" id="viral-genome-group" />
                    <Label htmlFor="viral-genome-group">
                      Viral Genome Group
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dna" id="dna-protein-file" />
                    <Label htmlFor="dna-protein-file">
                      DNA or Protein FASTA File
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="input" id="input-sequence" />
                    <Label htmlFor="input-sequence">Input Sequence</Label>
                  </div>
                </RadioGroup>

                {featureGroupType === "feature" && (
                  <>
                    <div className="flex gap-2">
                      <Input placeholder="Feature group" className="flex-1" />
                      <Button size="icon" variant="outline">
                        <Search size={16} />
                      </Button>
                    </div>

                    <div className="flex items-center">
                      <RadioGroup
                        onValueChange={setSequenceType}
                        defaultValue="dna"
                        className="flex flex-row items-center space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="dna" id="dna" />
                          <Label htmlFor="dna">DNA</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="protein" id="protein" />
                          <Label htmlFor="protein">Protein</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}
                {featureGroupType === "viral" && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Viral genome group"
                      className="flex-1"
                    />
                    <Button size="icon" variant="outline">
                      <Search size={16} />
                    </Button>
                  </div>
                )}
                {featureGroupType === "dna" && (
                  <div className="flex gap-2">
                    <Input placeholder="FASTA File" className="flex-1" />
                    <Button size="icon" variant="outline">
                      <Upload size={16} />
                    </Button>
                  </div>
                )}
                {featureGroupType === "input" && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Enter FASTA records of sequences to align"
                      className="h-24 max-h-72 flex-1"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label htmlFor="aligned-sequences">Aligned FASTA File</Label>
                <div className="flex gap-2">
                  <Input placeholder="Aligned FASTA File" className="flex-1" />
                  <Button size="icon" variant="outline">
                    <Upload size={16} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Select a reference sequence */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              Select a reference sequence:
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="text-muted-foreground h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose a reference sequence for alignment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              <RadioGroup
                onValueChange={setRefSeqType}
                defaultValue="none"
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none">None</Label>
                </div>
                {featureGroupType === "feature" && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feature-id" id="feature-id" />
                    <Label htmlFor="feature-id">Feature ID</Label>
                  </div>
                )}
                {featureGroupType === "viral" && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="genome-id" id="genome-id" />
                    <Label htmlFor="genome-id">Genome ID</Label>
                  </div>
                )}
                {(featureGroupType === "dna" ||
                  featureGroupType === "input") && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="first-sequence"
                      id="first-sequence"
                    />
                    <Label htmlFor="first-sequence">First Sequence</Label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="input-ref-seq" id="input-ref-seq" />
                  <Label htmlFor="input-ref-seq">
                    Input Reference Sequence
                  </Label>
                </div>
              </RadioGroup>

              {refSeqType === "feature-id" && (
                <div className="flex gap-2">
                  <Input placeholder="Feature ID" className="flex-1" />
                  <Button size="icon" variant="outline">
                    <Search size={16} />
                  </Button>
                </div>
              )}
              {refSeqType === "genome-id" && (
                <div className="flex gap-2">
                  <Input placeholder="Genome ID" className="flex-1" />
                  <Button size="icon" variant="outline">
                    <Search size={16} />
                  </Button>
                </div>
              )}
              {refSeqType === "first-sequence" && <></>}
              {refSeqType === "input-ref-seq" && (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Enter a FASTA record of a reference sequence to align"
                    className="h-24 max-h-72 flex-1"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Parameters */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              Parameters:
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="text-muted-foreground h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure alignment parameters</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="w-full space-y-2">
                <Label>Aligner</Label>
                <Select defaultValue="mafft">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select aligner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mafft">Mafft</SelectItem>
                    <SelectItem value="muscle">Muscle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Collapsible
                open={showStrategy}
                onOpenChange={setShowStrategy}
                className="service-collapsible-container"
              >
                <CollapsibleTrigger className="service-collapsible-trigger text-sm font-medium">
                  Strategy Options
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showStrategy ? "rotate-180 transform" : ""}`}
                  />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="space-y-4 px-4 py-2">
                    <RadioGroup defaultValue="auto">
                      <div className="space-y-2">
                        <Label>Automatic</Label>
                        <div className="flex items-center space-x-2 pl-4">
                          <RadioGroupItem value="auto" id="auto" />
                          <Label htmlFor="auto" className="font-normal">
                            Auto (FFT-NS-1, FFT-NS-2, FFT-NS-i, L-INS-i depends on
                            data size)
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Progressive Methods</Label>
                        <div className="space-y-2 pl-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fft-ns-1" id="fft-ns-1" />
                            <Label htmlFor="fft-ns-1" className="font-normal">
                              FFT-NS-1 (very fast, recommended for {"<"}2,000
                              sequences, progressive method)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fft-ns-2" id="fft-ns-2" />
                            <Label htmlFor="fft-ns-2" className="font-normal">
                              FFT-NS-2 (fast, progressive method)
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Iterative Refinement Methods</Label>
                        <div className="space-y-2 pl-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fft-ns-i" id="fft-ns-i" />
                            <Label htmlFor="fft-ns-i" className="font-normal">
                              FFT-NS-i (iterative refinement method)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="e-ins-i" id="e-ins-i" />
                            <Label htmlFor="e-ins-i" className="font-normal">
                              E-INS-i (very slow, recommended for {"<"}200
                              sequences with multiple conserved domains and long
                              gaps, 5 iterative cycles only)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="l-ins-i" id="l-ins-i" />
                            <Label htmlFor="l-ins-i" className="font-normal">
                              L-INS-i (very slow, recommended for {"<"}200
                              sequences with one conserved domain and long gaps,
                              2 iterative cycles only)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="g-ins-i" id="g-ins-i" />
                            <Label htmlFor="g-ins-i" className="font-normal">
                              G-INS-i (very slow, recommended for {"<"}200
                              sequences with global homology, 2 iterative cycles
                              only)
                            </Label>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Output Folder
                </Label>
                <div className="flex gap-2">
                  <Input className="flex-1" placeholder="Output Folder" />
                  <Button size="icon" variant="outline">
                    <Upload size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Output Name
                </Label>
                <Input placeholder="Output Name" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Controls */}
        <div className="flex justify-end gap-2">
          <Button variant="outline">Reset</Button>
          <Button>Submit</Button>
        </div>
      </div>
    </section>
  );
}
