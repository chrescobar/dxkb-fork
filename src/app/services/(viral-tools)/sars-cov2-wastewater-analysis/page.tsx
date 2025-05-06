"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";
import {
  Info,
  Upload,
  FileText,
  ArrowRight,
  X,
  HelpCircle,
  Droplets,
  Link2,
  ChevronRight,
} from "lucide-react";
import { ServiceHeader } from "@/components/services/service-header";
import SearchReadLibrary from "@/components/services/search-read-library";
import {
  handlePairedLibraryAdd,
  handleSingleLibraryAdd,
  handleSraAdd,
  removeFromSelectedLibraries,
} from "@/lib/service-utils";
import { Library, primerOptions } from "@/types/services";
import { DatePicker } from "@/components/ui/date-picker";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { wastewaterAnalysisInputLib } from "@/lib/service-info";
import SelectedItemsTable from "@/components/services/selected-items-table";

export default function WastewaterAnalysis() {
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>([]);
  const [sraAccession, setSraAccession] = useState("");
  const [primer, setPrimer] = useState<string>("artic");
  const [version, setVersion] = useState<string>(
    primerOptions.find((option) => option.id === primer)?.versions[0] ?? "",
  );

  return (
    <section>
      <ServiceHeader
        title="SARS-CoV-2 Wastewater Analysis"
        tooltipContent="SARS-CoV-2 Wastewater Analysis Information"
        description="The SARS-CoV-2 Wastewater Analysis assembles raw reads with the Sara
          One Codex pipeline and performs variant analysis with Freyja."
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Library Section */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Input Library Selection
              <DialogInfoPopup
                title={wastewaterAnalysisInputLib.title}
                description={wastewaterAnalysisInputLib.description}
                sections={wastewaterAnalysisInputLib.sections}
              />
            </CardTitle>
            <CardDescription>
              Send to selected libraries using the arrow buttons
            </CardDescription>
          </CardHeader>

          <CardContent className="service-card-content">
            <SearchReadLibrary
              title="Paired Read Library"
              firstPlaceholder="Select File 1..."
              secondPlaceholder="Select File 2..."
              variant="pair"
              onAdd={(files) => {
                const newLibraries = handlePairedLibraryAdd(
                  files,
                  selectedLibraries,
                );
                setSelectedLibraries(newLibraries);
              }}
            />

            <SearchReadLibrary
              title="Single Read Library"
              firstPlaceholder="Select File 1..."
              variant="single"
              onAdd={(files) => {
                const newLibraries = handleSingleLibraryAdd(
                  files,
                  selectedLibraries,
                );
                setSelectedLibraries(newLibraries);
              }}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="service-card-label">SRA Run Accession</Label>
                <div className="bg-border mx-4 h-[1px] flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newLibraries = handleSraAdd(
                      sraAccession,
                      selectedLibraries,
                    );
                    if (newLibraries) {
                      setSelectedLibraries(newLibraries);
                      setSraAccession("");
                    }
                  }}
                  disabled={!sraAccession.trim()}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  className="service-card-input"
                  placeholder="SRR"
                  value={sraAccession}
                  onChange={(e) => setSraAccession(e.target.value)}
                />
              </div>
            </div>

            <div className="service-card-row">
              <div className="flex w-full flex-col gap-2">
                <Label className="service-card-label">Primers</Label>
                <Select
                  defaultValue="artic"
                  onValueChange={(value) => {
                    setPrimer(value);
                    const selectedPrimer = primerOptions.find(
                      (option) => option.id === value,
                    );
                    setVersion(selectedPrimer?.versions[0] ?? "");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select primer" />
                  </SelectTrigger>
                  <SelectContent>
                    {primerOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex w-full flex-col gap-2">
                <Label className="service-card-label">Version</Label>

                <Select value={version} onValueChange={setVersion}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {primerOptions
                      .find((option) => option.id === primer)
                      ?.versions.map((version) => (
                        <SelectItem key={version} value={version}>
                          {version}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="service-card-label">Sample Identifier</Label>
              <Input className="service-card-input" placeholder="SAMPLE ID" />
            </div>

            {/* TODO: Change to date picker with text input */}
            <div className="space-y-3">
              <Label className="service-card-label">Sample Date</Label>
              <DatePicker className="w-full bg-white" />
            </div>
          </CardContent>
        </Card>

        {/* Selected Libraries Section */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Selected Libraries
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="service-card-tooltip-icon" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Place read files here using the arrow buttons</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <SelectedItemsTable
              title="Selected Libraries"
              items={selectedLibraries.map((lib) => ({
                id: lib.id,
                name: lib.name,
                type:
                  lib.type === "paired"
                    ? "Paired Read"
                    : lib.type === "single"
                      ? "Single Read"
                      : "SRA Accession",
              }))}
              onRemove={(id) => {
                const newLibraries = removeFromSelectedLibraries(
                  id,
                  selectedLibraries,
                );
                setSelectedLibraries(newLibraries);
              }}
              className="max-h-84 overflow-y-auto"
            />
          </CardContent>
        </Card>

        {/* Parameters Section */}
        <Card className="lg:col-span-2">
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Parameters
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="service-card-tooltip-icon" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure analysis parameters</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>

          <CardContent className="service-card-content">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="service-card-label">Strategy</Label>
                <Select defaultValue="codex">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="codex">One Codex</SelectItem>
                    <SelectItem value="other">Other Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="service-card-row">
              <div className="w-full space-y-3">
                <Label className="service-card-label">Output Folder</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Select output folder"
                    className="service-card-input"
                  />
                  <Button variant="outline" size="icon">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="w-full space-y-3">
                <Label className="service-card-label">Output Name</Label>
                <Input
                  className="service-card-input"
                  placeholder="Output Name"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="service-form-controls">
        <Button variant="outline">Reset</Button>
        <Button>Submit</Button>
      </div>
    </section>
  );
}
