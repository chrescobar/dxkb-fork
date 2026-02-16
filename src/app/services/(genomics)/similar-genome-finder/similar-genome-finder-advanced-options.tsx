"use client";

import type { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { similarGenomeFinderAdvancedParameters } from "@/lib/services/service-info";
import type { SimilarGenomeFinderFormData } from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-form-schema";
import {
  MAX_HITS_OPTIONS,
  PVALUE_OPTIONS,
  DISTANCE_OPTIONS,
} from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-form-schema";

interface SimilarGenomeFinderAdvancedOptionsProps {
  control: Control<SimilarGenomeFinderFormData>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimilarGenomeFinderAdvancedOptions({
  control,
  open,
  onOpenChange,
}: SimilarGenomeFinderAdvancedOptionsProps) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="service-collapsible-container"
    >
      <CollapsibleTrigger className="service-collapsible-trigger">
        Advanced Options
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180 transform" : ""}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="service-collapsible-content">
        <div className="flex w-full flex-col justify-between space-y-4">
          <div className="flex items-center">
            <Label className="service-card-label">Parameters</Label>
            <DialogInfoPopup
              title={similarGenomeFinderAdvancedParameters.title}
              description={
                similarGenomeFinderAdvancedParameters.description
              }
              sections={similarGenomeFinderAdvancedParameters.sections}
              className="mb-2 ml-2"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={control}
              name="max_hits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="service-card-sublabel">
                    Max Hits
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={(field.value ?? 50).toString()}
                      onValueChange={(value) =>
                        field.onChange(parseInt(value, 10))
                      }
                    >
                      <SelectTrigger className="service-card-select-trigger">
                        <SelectValue placeholder="Select max hits" />
                      </SelectTrigger>
                      <SelectContent>
                        {MAX_HITS_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value.toString()}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="max_pvalue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="service-card-sublabel">
                    P-Value Threshold
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value?.toString() ?? "1"}
                      onValueChange={(value) =>
                        field.onChange(parseFloat(value))
                      }
                    >
                      <SelectTrigger className="service-card-select-trigger">
                        <SelectValue placeholder="Select P-value" />
                      </SelectTrigger>
                      <SelectContent>
                        {PVALUE_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value.toString()}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="max_distance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="service-card-sublabel">
                    Distance
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value?.toString() ?? "1"}
                      onValueChange={(value) =>
                        field.onChange(parseFloat(value))
                      }
                    >
                      <SelectTrigger className="service-card-select-trigger">
                        <SelectValue placeholder="Select distance" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTANCE_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value.toString()}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="service-card-label">Organism Type</Label>

                <FormField
                  control={control}
                  name="include_bacterial"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Bacterial and Archaeal Genomes
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="include_viral"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Viral Genomes
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="service-card-label">Scope</Label>

                <FormField
                  control={control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="gap-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="reference"
                              id="scope-reference"
                            />
                            <FormLabel
                              htmlFor="scope-reference"
                              className="text-sm font-normal"
                            >
                              Reference and Representative Genomes
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="scope-all" />
                            <FormLabel
                              htmlFor="scope-all"
                              className="text-sm font-normal"
                            >
                              All Public Genomes
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
