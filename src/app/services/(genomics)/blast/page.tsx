"use client";

import { useState, FormEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Info, ChevronDown, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function BlastServicePage() {
  const [searchProgram, setSearchProgram] = useState("");
  const [queryType, setQueryType] = useState("enterSequence");
  const [sequenceInput, setSequenceInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxHits, setMaxHits] = useState("10");
  const [eValueThreshold, setEValueThreshold] = useState("0.0001");
  const [outputFolder, setOutputFolder] = useState("");
  const [outputName, setOutputName] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted");
  };

  const handleReset = () => {
    setSearchProgram("");
    setQueryType("enterSequence");
    setSequenceInput("");
    setShowAdvanced(false);
    setMaxHits("10");
    setEValueThreshold("0.0001");
    setOutputFolder("");
    setOutputName("");
  };

  return (
    <div className="service-container container">
      <div className="service-header">
        <div className="service-header-title">
          <h1>BLAST</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="service-header-tooltip" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm">
                <p>
                  BLAST (Basic Local Alignment Search Tool) finds regions of
                  similarity between biological sequences.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="service-header-description">
          <div className="text-gray-600">
            <p>
              The BLAST service uses BLAST (Basic Local Alignment Search Tool)
              to search against public or private genomes or other databases
              using DNA or protein sequence(s).
            </p>
            <p>
              For further explanation, please see the{" "}
              <a href="/docs/blast-guide">
                BLAST Service Quick Reference Guide
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>{" "}
              and{" "}
              <a href="/tutorial/blast-video">
                Tutorial and Instructional Video
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="service-form-section">
        {/* Search Program Card */}
        <Card>
          <CardHeader>
            <CardTitle className="service-form-section-header">
              Search Program
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Select the appropriate BLAST program for your search.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={searchProgram}
              onValueChange={setSearchProgram}
              className="service-radio-group"
            >
              <div className="service-radio-group-item">
                <RadioGroupItem value="blastn" id="blastn" />
                <Label htmlFor="blastn" className="cursor-pointer">
                  BLASTN (nucleotide → nucleotide database)
                </Label>
              </div>
              <div className="service-radio-group-item">
                <RadioGroupItem value="blastp" id="blastp" />
                <Label htmlFor="blastp" className="cursor-pointer">
                  BLASTP (protein → protein database)
                </Label>
              </div>
              <div className="service-radio-group-item">
                <RadioGroupItem value="blastx" id="blastx" />
                <Label htmlFor="blastx" className="cursor-pointer">
                  BLASTX (translated nucleotide → protein database)
                </Label>
              </div>
              <div className="service-radio-group-item">
                <RadioGroupItem value="tblastn" id="tblastn" />
                <Label htmlFor="tblastn" className="cursor-pointer">
                  tBLASTn (protein → translated nucleotide database)
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Query Source Card */}
        <Card>
          <CardHeader>
            <CardTitle className="service-form-section-header">
              Query Source
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Provide the sequence data you want to search for.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <RadioGroup
                value={queryType}
                onValueChange={setQueryType}
                className="flex gap-6"
              >
                <div className="service-radio-group-item">
                  <RadioGroupItem value="enterSequence" id="enterSequence" />
                  <Label htmlFor="enterSequence" className="cursor-pointer">
                    Enter sequence
                  </Label>
                </div>
                <div className="service-radio-group-item">
                  <RadioGroupItem value="selectFasta" id="selectFasta" />
                  <Label htmlFor="selectFasta" className="cursor-pointer">
                    Select FASTA file
                  </Label>
                </div>
                <div className="service-radio-group-item">
                  <RadioGroupItem value="selectFeature" id="selectFeature" />
                  {/* TODO: Add feature group selector from Workspace */}
                  <Label htmlFor="selectFeature" className="cursor-pointer">
                    Select feature group
                  </Label>
                </div>
              </RadioGroup>

              {queryType === "enterSequence" && (
                <div className="service-card-content-grid-item">
                  <Label htmlFor="sequence-input">
                    Enter a FASTA formatted sequence.
                  </Label>
                  <Textarea
                    id="sequence-input"
                    placeholder="Enter one or more query nucleotide or protein sequences to search. Requires FASTA format."
                    value={sequenceInput}
                    onChange={(e) => setSequenceInput(e.target.value)}
                    className="max-h-96 min-h-40 font-mono"
                  />
                </div>
              )}

              {queryType === "selectFasta" && (
                <div className="service-card-content-grid-item">
                  <Label htmlFor="fasta-file">Upload a FASTA file</Label>
                  <Input
                    id="fasta-file"
                    type="file"
                    accept=".fasta,.fa,.fna,.ffn,.faa,.frn"
                  />
                </div>
              )}

              {queryType === "selectFeature" && (
                <div className="service-card-content-grid-item">
                  <Label htmlFor="feature-group">Select a feature group</Label>
                  <Select>
                    <SelectTrigger id="feature-group" className="w-full">
                      <SelectValue placeholder="Select a feature group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="genes">Genes</SelectItem>
                      <SelectItem value="proteins">Proteins</SelectItem>
                      <SelectItem value="exons">Exons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Database Selection Card */}
        <div className="service-card-content-grid">
          <Card>
            <CardHeader>
              <CardTitle className="service-form-section-header">
                Database Source
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the database to search against.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select database source" />
                </SelectTrigger>
                {/* TODO: Conditionally render based on query type */}
                <SelectContent>
                  <SelectItem value="reference">
                    Reference and representative genomes (bacteria, archaea)
                  </SelectItem>
                  <SelectItem value="reference-virus">
                    Reference and representative genomes (viruses)
                  </SelectItem>
                  <SelectItem value="search-genome-list">
                    Search within selected genome list
                  </SelectItem>
                  <SelectItem value="search-genome-group">
                    Search within selected genome group
                  </SelectItem>
                  <SelectItem value="search-feature-group">
                    Search within selected feature group
                  </SelectItem>
                  <SelectItem value="search-taxonomy">
                    Search within a taxon
                  </SelectItem>
                  <SelectItem value="search-fasta">
                    Search within selected FASTA file
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="service-form-section-header">
                Database Type
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the type of database.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="genome-sequences">
                    Genome sequences (NT)
                  </SelectItem>
                  <SelectItem value="genes">Genes (NT)</SelectItem>
                  <SelectItem value="rnas">RNAs (NT)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Output Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="service-form-section-header">
              Output Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="service-card-content-grid">
              {/* TODO: Add the workspace folder selector here */}
              <div className="service-card-content-grid-item">
                <Label htmlFor="output-folder">Output Folder</Label>
                <Input
                  id="output-folder"
                  value={outputFolder}
                  onChange={(e) => setOutputFolder(e.target.value)}
                  placeholder="Specify output folder"
                />
              </div>
              <div className="service-card-content-grid-item">
                <Label htmlFor="output-name">Output Name</Label>
                <Input
                  id="output-name"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  placeholder="Output Name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Parameters Card */}
        <Card>
          <Collapsible
            open={showAdvanced}
            onOpenChange={setShowAdvanced}
            className="service-collapsible"
          >
            <CardHeader className="service-collapsible-header">
              <CardTitle className="service-form-section-header">
                Advanced Options
              </CardTitle>
              <div>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="service-collapsible-trigger"
                  >
                    {showAdvanced ? "Hide" : "Show"}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <div className="service-card-content-grid">
                  <div className="service-card-content-grid-item">
                    <Label htmlFor="max-hits">Max Hits</Label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select max hits" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="1000">1000</SelectItem>
                        <SelectItem value="5000">5000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="service-card-content-grid-item">
                    <Label htmlFor="e-value">E-Value Threshold</Label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select E-Value Threshold" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.0001">0.0001</SelectItem>
                        <SelectItem value="0.001">0.001</SelectItem>
                        <SelectItem value="0.01">0.01</SelectItem>
                        <SelectItem value="0.1">0.1</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="1000">1000</SelectItem>
                        <SelectItem value="10000">10000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Form Controls */}
        <div className="service-form-controls">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit">Submit</Button>
          <Button type="button" variant="secondary">
            View Results
          </Button>
        </div>
      </form>
    </div>
  );
}
