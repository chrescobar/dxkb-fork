"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import {
  HelpCircle,
} from "lucide-react";
import { ServiceHeader } from "@/components/services/service-header";
import {
  subspeciesClassificationQuerySource,
  subspeciesClassificationSpecies as subspeciesClassificationSpeciesInfo,
} from "@/lib/service-info";
import { subspeciesClassificationSpecies } from "@/types/services";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SearchWorkspaceInput from "@/components/services/search-workspace-input";
import OutputFolder from "@/components/services/output-folder";

export default function SubspeciesClassification() {
  // States for the form
  const [querySequence, setQuerySequence] = useState("");
  const [species, setSpecies] = useState(
    subspeciesClassificationSpecies[0].id,
  );
  const [outputFolder, setOutputFolder] = useState("");
  const [outputName, setOutputName] = useState("");
  const [querySource, setQuerySource] = useState("sequence");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({ querySequence, species, outputFolder, outputName });
  };

  const handleReset = () => {
    setQuerySequence("");
    setOutputFolder("");
    setOutputName("");
  };

  return (
    <section>
      <ServiceHeader
        title="Subspecies Classification"
        tooltipContent="Subspecies Classification Information"
        description='The Subspecies Classification tool assigns the genotype/subtype of a
          virus, based on the genotype/subtype assignments maintained by the
          International Committee on Taxonomy of Viruses (ICTV). This tool
          infers the genotype/subtype for a query sequence from its position
          within a reference tree. The service uses the pplacer tool with a
          reference tree and reference alignment and includes the query sequence
          as input. Interpretation of the pplacer result is handled by
          Cladinator. Link to <a href="#" className="text-primary-600 hover:underline">pplacer</a>{" "}
          and <a href="#" className="text-primary-600 hover:underline">Cladinator</a>'
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      {/* Main Form Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Query Source Section */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Query Source
              <DialogInfoPopup
                title={subspeciesClassificationQuerySource.title}
                description={subspeciesClassificationQuerySource.description}
                sections={subspeciesClassificationQuerySource.sections}
              />
            </CardTitle>
          </CardHeader>

          <CardContent className="service-card-content">
            <RadioGroup
              defaultValue="sequence"
              className="service-radio-group"
              onValueChange={setQuerySource}
            >
              <div className="service-radio-group-item">
                <RadioGroupItem value="sequence" id="sequence" />
                <Label htmlFor="sequence">Enter Sequence</Label>
              </div>
              <div className="service-radio-group-item">
                <RadioGroupItem value="fasta" id="fasta" />
                <Label htmlFor="fasta">Select FASTA File</Label>
              </div>
            </RadioGroup>

            {querySource === "sequence" && (
              <Textarea
                placeholder="Enter one or more protein sequences..."
                className="service-card-textarea"
                value={querySequence}
                onChange={(e) => setQuerySequence(e.target.value)}
              />
            )}

            {querySource === "fasta" && (
              <SearchWorkspaceInput
                title="FASTA File"
                placeholder="Select FASTA File"
              />
            )}
          </CardContent>
        </Card>

        {/* Species Selection */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Species
              <DialogInfoPopup
                title={subspeciesClassificationSpeciesInfo.title}
                description={subspeciesClassificationSpeciesInfo.description}
              />
            </CardTitle>
          </CardHeader>

          <CardContent className="service-card-content">
            <div className="space-y-6">
              <div className="w-full">
                <Label className="service-card-label">Select Species</Label>

                <Select defaultValue={species}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent className="max-h-128 overflow-y-auto">
                    {subspeciesClassificationSpecies.map((species) => (
                      <SelectItem key={species.id} value={species.id}>
                        {species.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="service-card-row">
                <div className="w-full">
                  <OutputFolder
                    onChange={setOutputFolder}
                  />
                </div>

                <div className="w-full">
                  <div className="flex flex-row items-center gap-2">
                    <Label className="service-card-label">Output Name</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="service-card-tooltip-icon mb-2" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">The name of the output file. This will appear in the specified output folder when the annotation job is complete.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    defaultValue=""
                    placeholder="Output Name"
                    onChange={(e) => setOutputName(e.target.value)}
                    className="service-card-input"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="service-form-controls">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </section>
  );
}
