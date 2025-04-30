"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import {
  Info,
  FileDown,
  Search,
  Plus,
  Settings,
  ExternalLink,
  AlignJustify,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Genome {
  id: string;
  name: string;
}

const GenomeAlignmentInterface = () => {
  const [selectedGenomes, setSelectedGenomes] = useState<Genome[]>([]);
  const [isManualSeedWeight, setIsManualSeedWeight] = useState(false);
  const [seedWeight, setSeedWeight] = useState([11]); // Default value centered
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addGenome = () => {
    const newGenome: Genome = {
      id: `genome_${selectedGenomes.length + 1}`,
      name: `Mycobacterium tuberculosis CDC${Math.floor(Math.random() * 9000) + 1000}`,
    };

    setSelectedGenomes([...selectedGenomes, newGenome]);
  };

  const removeGenome = (id: string) => {
    setSelectedGenomes(selectedGenomes.filter((genome) => genome.id !== id));
  };

  return (
    <div className="service-container container">
      <div className="service-header">
        <div className="service-header-title">
          <h1>Genome Alignment (Mauve)</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="service-header-tooltip" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-md">
                  Multiple genome alignment using progressiveMauve
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <a href="#">
            <ExternalLink className="service-header-tooltip" />
          </a>
        </div>
        <div className="service-header-description">
          <p>
            The Whole Genome Alignment Service aligns genomes using
            progressiveMauve. For further explanation, please see the Genome
            Alignment (Mauve) Service <a href="#">Quick Reference Guide</a>,{" "}
            <a href="#">Tutorial</a> and <a href="#">Instructional Video</a>.
          </p>
        </div>
      </div>

      <form className="service-form-section">
        {/* Select Genomes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="service-form-section-header">
              Select Genomes
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Add at least 2 (up to 20) genomes. Note the first genome
                      selected will be the reference (anchor) genome.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Add at least 2 (up to 20) genomes. Note the first genome selected
              will be the reference (anchor) genome.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Genome Search */}
            <div className="service-card-content-grid-item">
              <Label>Select Genome</Label>
              <div className="service-card-input-group">
                <div className="service-card-input-search">
                  <Input
                    placeholder="e.g. M. tuberculosis CDC1551"
                    className="pr-10"
                  />
                  <Search className="service-card-input-search-icon" />
                </div>
                <Button type="button" onClick={addGenome} variant="outline">
                  <Plus />
                  Add
                </Button>
              </div>
            </div>

            {/* Select Genome Group */}
            <div className="service-card-content-grid-item">
              <Label>And/Or Select Genome Group</Label>
              <div className="service-card-input-group">
                <Input placeholder="Optional" />
                <Button type="button" variant="outline" size="icon">
                  <FileDown />
                </Button>
                <Button type="button" variant="outline">
                  <Plus />
                  Add
                </Button>
              </div>
            </div>

            {/* Selected Genomes List */}
            <div className="service-card-content-grid-item">
              <Label>Selected Genomes</Label>

              {selectedGenomes.length === 0 ? (
                <div className="rounded-md border bg-gray-50 p-4 text-center text-gray-500 italic">
                  No genomes selected
                </div>
              ) : (
                <div className="service-table">
                  <div className="service-table-header">
                    <div>Name</div>
                    <div>ID</div>
                    <div></div>
                  </div>
                  <div className="service-table-body">
                    {selectedGenomes.map((genome, index) => (
                      <div key={genome.id} className="service-table-row">
                        <div>
                          {genome.name}
                          {index === 0 && (
                            <span className="bg-secondary-100 text-secondary-600 ml-2 rounded-full px-1.5 py-0.5 text-xs">
                              Reference
                            </span>
                          )}
                        </div>
                        <div>{genome.id}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-black"
                          onClick={() => removeGenome(genome.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Parameters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="service-form-section-header">
              Parameters
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-md">
                      Configure alignment output parameters
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="service-card-content-grid-item">
              <Label className="font-medium text-gray-700">OUTPUT FOLDER</Label>
              <div className="service-card-input-group">
                <Input placeholder="Select output folder" />
                <Button variant="outline" size="icon">
                  <FileDown />
                </Button>
              </div>
            </div>

            <div className="service-card-content-grid-item">
              <Label>Output Name</Label>
              <Input placeholder="Output Name" />
            </div>

            <Collapsible
              open={showAdvanced}
              onOpenChange={setShowAdvanced}
              className="service-collapsible-container"
            >
              <CollapsibleTrigger className="service-collapsible-trigger">
                Advanced Options
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
                />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                  <div className="space-y-4 sm:min-w-fit">
                    <Label>Manually Set Seed Weight</Label>
                    <Switch
                      id="manual-seed-weight"
                      checked={isManualSeedWeight}
                      onCheckedChange={setIsManualSeedWeight}
                    />
                  </div>
                  {isManualSeedWeight && (
                    <div className="w-full space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Seed Weight</Label>
                          <span className="text-muted-foreground text-sm">
                            {seedWeight[0]}
                          </span>
                        </div>
                        <Slider
                          value={seedWeight}
                          onValueChange={setSeedWeight}
                          min={3}
                          max={21}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-muted-foreground flex justify-between text-xs">
                          <span>3</span>
                          <span>21</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* TODO: Change to NumberInput component */}
                <div className="w-full space-y-2">
                  <Label>Weight</Label>
                  <Input type="number" placeholder="Min pairwise LCB score" />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" type="reset">
            Reset
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </div>
  );
};

export default GenomeAlignmentInterface;
