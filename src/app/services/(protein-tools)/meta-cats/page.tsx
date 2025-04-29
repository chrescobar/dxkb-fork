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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FolderInput, FolderSearch, Info, Plus, Search } from "lucide-react";
import { CiCircleInfo } from "react-icons/ci";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServiceHeader } from "@/components/services/service-header";

export default function MetaCATSPage() {
  const [groupingType, setGroupingType] = useState("auto");
  const [featureGroupType, setFeatureGroupType] = useState("dna");
  const [featureGroupInput, setFeatureGroupInput] = useState("");
  const [tableData, setTableData] = useState<
    Array<{
      id: string;
      genbankAccession: string;
      strain: string;
      metadata: string;
      group: string;
      srcId: string;
      genomeId: string;
    }>
  >([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedFeatureGroups, setSelectedFeatureGroups] = useState<Array<{
    id: string;
    name: string;
  }>>([]);

  const handleAddFeatureGroup = () => {
    if (!featureGroupInput.trim()) return;

    const newItem = {
      id: crypto.randomUUID(),
      genbankAccession: featureGroupInput,
      strain: "N/A",
      metadata: "N/A",
      group: "Default Group",
      srcId: "N/A",
      genomeId: "N/A",
    };

    setTableData((prev) => [...prev, newItem]);
    setFeatureGroupInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeatureGroupInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddFeatureGroupFeature();
    }
  };

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleDeleteRows = () => {
    if (selectedRows.length === 0) return;
    setTableData((prev) =>
      prev.filter((item) => !selectedRows.includes(item.id)),
    );
    setSelectedRows([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(tableData.map((item) => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleAddFeatureGroupFeature = () => {
    if (!featureGroupInput.trim()) return;

    const newGroup = {
      id: crypto.randomUUID(),
      name: featureGroupInput,
    };

    setSelectedFeatureGroups((prev) => [...prev, newGroup]);
    setFeatureGroupInput("");
  };

  const handleRemoveFeatureGroup = (id: string) => {
    setSelectedFeatureGroups((prev) => prev.filter((group) => group.id !== id));
  };

  return (
    <section>
      <ServiceHeader
        title="Metadata-driven Comparative Analysis Tool (Meta-CATS)"
        tooltipContent="Metadata-driven Comparative Analysis Tool (Meta-CATS) Information"
        description="The Meta-CATS tool looks for positions that significantly differ between user-defined groups of sequences.
          However, biological biases due to correlation, codon biases, and differences in genotype, geography, time of isolation,
          or others may affect the robustness of the underlying statistical assumptions."
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      {/* Main Content */}
      <div className="service-form-section">
        {/* Parameters Section */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Parameters
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={16} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure analysis parameters</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="service-card-label">P-Value</Label>
                <Input
                  type="number"
                  defaultValue="0.05"
                  step="0.01"
                  min="0"
                  max="1"
                />
              </div>

              <div>
                <Label className="service-card-label">Output Folder</Label>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Choose the output folder"
                  />
                  <Button size="icon" variant="outline">
                    <FolderInput size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="service-card-label">Output Name</Label>
                <Input placeholder="Output Name" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Input
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={16} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Specify input data for analysis</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="service-card-content">
            <RadioGroup
              defaultValue="auto"
              className="flex space-x-6"
              value={groupingType}
              onValueChange={setGroupingType}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto-grouping" />
                <Label htmlFor="auto-grouping">Auto Grouping</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feature" id="feature-groups" />
                <Label htmlFor="feature-groups">Feature Groups</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alignment" id="alignment-file" />
                <Label htmlFor="alignment-file">Alignment File</Label>
              </div>
            </RadioGroup>

            {groupingType === "auto" && (
              <>
                <div>
                  <Label className="service-card-label">Metadata</Label>
                  <Select defaultValue="host-name">
                    <SelectTrigger>
                      <SelectValue placeholder="Select metadata" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accession">Accession</SelectItem>
                      <SelectItem value="collection-date">
                        Collection Date
                      </SelectItem>
                      <SelectItem value="collection-year">
                        Collection Year
                      </SelectItem>
                      <SelectItem value="genome-group">Genome Group</SelectItem>
                      <SelectItem value="genome-id">Genome ID</SelectItem>
                      <SelectItem value="genome-length">
                        Genome Length
                      </SelectItem>
                      <SelectItem value="genome-name">Genome Name</SelectItem>
                      <SelectItem value="genus">Genus</SelectItem>
                      <SelectItem value="geographic-group">
                        Geographic Group
                      </SelectItem>
                      <SelectItem value="geographic-location">
                        Geographic Location
                      </SelectItem>
                      <SelectItem value="h1-clade-gobal">
                        H1 Clade Gobal
                      </SelectItem>
                      <SelectItem value="h1-clade-us">H1 Clade US</SelectItem>
                      <SelectItem value="h3-clade">H3 Clade</SelectItem>
                      <SelectItem value="h5-clade">H5 Clade</SelectItem>
                      <SelectItem value="host-group">Host Group</SelectItem>
                      <SelectItem value="host-common-name">
                        Host Common Name
                      </SelectItem>
                      <SelectItem value="host-name">Host Name</SelectItem>
                      <SelectItem value="isolation-country">
                        Isolation Country
                      </SelectItem>
                      <SelectItem value="lineage">Lineage</SelectItem>
                      <SelectItem value="species">Species</SelectItem>
                      <SelectItem value="strain">Strain</SelectItem>
                      <SelectItem value="subtype">Subtype</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="service-card-label">
                    Select Feature Group
                  </Label>

                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Select DNA or Protein Feature Group"
                      value={featureGroupInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                    />
                    <Button size="icon" variant="outline">
                      <FolderSearch size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleAddFeatureGroup}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  <RadioGroup
                    defaultValue="dna"
                    className="flex space-x-6"
                    value={featureGroupType}
                    onValueChange={setFeatureGroupType}
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

                <div>
                  <Label className="service-card-label">Group Names</Label>
                  <div className="flex gap-2">
                    <Select defaultValue="default">
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Group</SelectItem>
                        <SelectItem value="group1">Group 1</SelectItem>
                        <SelectItem value="group2">Group 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button>Change group</Button>
                  </div>
                </div>

                <div>
                  <Label className="service-card-label">Groups Grid</Label>
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                selectedRows.length === tableData.length &&
                                tableData.length > 0
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Genbank Accession</TableHead>
                          <TableHead>Strain</TableHead>
                          <TableHead>Metadata</TableHead>
                          <TableHead>Group</TableHead>
                          <TableHead>
                            SRC ID
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <CiCircleInfo
                                    size={14}
                                    className="text-muted-foreground ml-1 inline"
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Source ID information
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead>
                            Genome ID
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <CiCircleInfo
                                    size={14}
                                    className="text-muted-foreground ml-1 inline"
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Genome ID information
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-muted-foreground py-8 text-center"
                            >
                              No results found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          tableData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedRows.includes(item.id)}
                                  onCheckedChange={() =>
                                    handleRowSelect(item.id)
                                  }
                                />
                              </TableCell>
                              <TableCell>{item.genbankAccession}</TableCell>
                              <TableCell>{item.strain}</TableCell>
                              <TableCell>{item.metadata}</TableCell>
                              <TableCell>{item.group}</TableCell>
                              <TableCell>{item.srcId}</TableCell>
                              <TableCell>{item.genomeId}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-2 flex justify-between gap-2 align-top">
                    <div className="text-muted-foreground text-xs">
                      {tableData.length} - {tableData.length} of{" "}
                      {tableData.length} results
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleDeleteRows}
                      disabled={selectedRows.length === 0}
                    >
                      Delete Rows
                    </Button>
                  </div>
                </div>
              </>
            )}

            {groupingType === "feature" && (
              <>
                <div className="space-y-4">
                  <Label className="service-card-label">
                    Select Feature Group
                  </Label>

                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Select DNA or Protein Feature Group"
                      value={featureGroupInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                    />
                    <Button size="icon" variant="outline">
                      <FolderSearch size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleAddFeatureGroupFeature}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  <RadioGroup
                    defaultValue="dna"
                    className="flex space-x-6"
                    value={featureGroupType}
                    onValueChange={setFeatureGroupType}
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

                <div>
                  <Label className="service-card-label">Selected Groups Table</Label>
                  <div className="overflow-hidden rounded-md border">
                    {selectedFeatureGroups.length === 0 ? (
                      <div className="text-muted-foreground p-4 text-center text-sm">
                        No feature groups selected
                      </div>
                    ) : (
                      <div className="divide-y">
                        {selectedFeatureGroups.map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center justify-between bg-white px-4 py-2 hover:bg-gray-50"
                          >
                            <span className="text-sm">{group.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveFeatureGroup(group.id)}
                            >
                              <span className="text-gray-400 hover:text-gray-600">×</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {groupingType === "alignment" && (
              <div className="space-y-4">
                <div>
                  <Label className="service-card-label">
                    Select Alignment File
                  </Label>

                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Select Alignment File"
                    />
                    <Button size="icon" variant="outline">
                      <FolderSearch size={16} />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="service-card-label">
                    Select Group File
                  </Label>

                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Select Group File"
                    />
                    <Button size="icon" variant="outline">
                      <FolderSearch size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Controls */}
        <div className="service-form-controls">
          <Button variant="outline">Reset</Button>
          <Button>Submit</Button>
        </div>
      </div>
    </section>
  );
}
