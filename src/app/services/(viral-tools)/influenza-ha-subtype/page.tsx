"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { ServiceHeader } from "@/components/services/service-header";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SearchWorkspaceInput from "@/components/services/search-workspace-input";
import { HaReferenceTypes } from "@/types/services";

export default function HASubtypeNumbering() {
  // States for the form
  const [inputSequence, setInputSequence] = useState("sequence");
  const [inputSequenceValue, setInputSequenceValue] = useState("");
  const [outputFolder, setOutputFolder] = useState("");
  const [outputName, setOutputName] = useState("");
  const [selectedSchemes, setSelectedSchemes] = useState(["H1PDM34"]);

  const handleReset = () => {
    setInputSequence("");
    setOutputFolder("");
    setOutputName("");
    setSelectedSchemes(["H1PDM34"]);
  };

  return (
    <section>
      <ServiceHeader
        title="HA Subtype Numbering Conversion"
        tooltipContent="HA Subtype Numbering Conversion Information"
        description="The HA Subtype Numbering Conversion service allows user to renumber
          Influenza HA sequences according to a cross-subtype numbering scheme
          proposed by Burke and Smith in <a href='https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4100033/'>Burke DF, Smith DJ (2014). A
          recommended numbering scheme for influenza A HA subtypes. PLUS One
          9:e112302</a>. Burke and Smith's numbering scheme uses analysis of known
          HA structures to identify amino acids that are structurally and
          functionally equivalent across all HA subtypes, using a numbering
          system based on the mature HA sequence."
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      {/* Main Form Content */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Input Sequence
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="service-card-tooltip-icon" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter protein sequences for analysis</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>

          <CardContent className="service-card-content">
            <RadioGroup
              defaultValue="sequence"
              className="service-radio-group"
              onValueChange={setInputSequence}
            >
              <div className="service-radio-group-item">
                <RadioGroupItem value="sequence" id="sequence" />
                <Label htmlFor="sequence">Enter Sequence</Label>
              </div>
              <div className="service-radio-group-item">
                <RadioGroupItem value="fasta" id="fasta" />
                <Label htmlFor="fasta">Select FASTA File</Label>
              </div>
              <div className="service-radio-group-item">
                <RadioGroupItem value="feature-group" id="feature-group" />
                <Label htmlFor="feature-group">Feature Group</Label>
              </div>
            </RadioGroup>

            {inputSequence === "sequence" && (
              <Textarea
                placeholder="Enter one or more protein sequences..."
                className="service-card-textarea"
                value={inputSequenceValue}
                onChange={(e) => setInputSequenceValue(e.target.value)}
              />
            )}

            {inputSequence === "fasta" && (
              <SearchWorkspaceInput
                title="FASTA File"
                placeholder="Select FASTA File"
              />
            )}

            {inputSequence === "feature-group" && (
              <SearchWorkspaceInput
                title="Feature Group"
                placeholder="Select Feature Group"
              />
            )}
          </CardContent>
        </Card>

        {/* Conversion Sequence Numbering Scheme Section */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Conversion Sequence Numbering Scheme
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="service-card-tooltip-icon" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the numbering scheme to apply</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>

          <CardContent className="service-card-content">
            <div className="space-y-6">
              <div className="bg-background-100 grid grid-cols-2 gap-2 rounded-md border p-4 md:grid-cols-4">
                {HaReferenceTypes.map((scheme) => (
                  <div className="flex items-center gap-2" key={scheme.id}>
                    <Checkbox
                      id={scheme.id}
                      checked={selectedSchemes.includes(scheme.id)}
                      onCheckedChange={() =>
                        setSelectedSchemes(
                          selectedSchemes.includes(scheme.id)
                            ? selectedSchemes.filter((s) => s !== scheme.id)
                            : [...selectedSchemes, scheme.id],
                        )
                      }
                      className="bg-white"
                    />
                    <Label htmlFor={scheme.id} className="text-sm">
                      {scheme.label}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="service-card-content-row">
                <div className="w-full">
                  <SearchWorkspaceInput
                    title="Output Folder"
                    placeholder="Select Output Folder"
                    onChange={setOutputFolder}
                  />
                </div>

                <div className="w-full">
                  <Label className="service-card-label">Output Name</Label>
                  <Input
                    defaultValue=""
                    placeholder="Output Name"
                    onChange={(e) => setOutputName(e.target.value)}
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
