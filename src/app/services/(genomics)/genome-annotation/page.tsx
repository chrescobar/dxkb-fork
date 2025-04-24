import { ServiceHeader } from "@/components/services/service-header";
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
  Info,
  Search,
  FileDown,
  Database,
  Dna,
  Upload,
  ExternalLink,
} from "lucide-react";

const GenomeAnnotationContent = () => {
  return (
    <section>
      <ServiceHeader
        title="Genome Annotation"
        tooltipContent="Genome Annotation Information"
        description="The Genome Annotation Service provides annotation of genomic features using the RAST tool kit (RASTtk) for bacteria and VirION for viruses. The service accepts a FASTA formatted file and an annotation recipe based on taxonomy to provide an annotated genome."
        quickReferenceGuide="#"
        tutorial="#"
      />

      <form className="service-form-section">
        {/* Contigs Upload */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="service-form-section-header">
                Parameters
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <Info className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-md">
                      Set parameters for genome annotation
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* TODO: Add file upload from Workspace */}
              <div className="space-y-2">
                <Label htmlFor="contigsFile" className="font-medium">
                  Contigs
                </Label>
                <div className="flex items-center">
                  <Input id="contigsFile" type="file" className="flex-1" />
                  <Button variant="outline" className="ml-2" size="icon">
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Annotation Recipe */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="text-lg">Annotation Recipe</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <Info className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-md">
                      Select a recipe for genome annotation
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="--- Select Recipe ---" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bacteria-archaea">
                  Bacteria / Archaea
                </SelectItem>
                <SelectItem value="viruses">Viruses</SelectItem>
                <SelectItem value="bacteriophage">Bacteriophage</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Taxonomy Information */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <CardTitle className="text-lg">Taxonomy Name</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Taxon must be specified at the genus level or below to
                        get the latest protein family predictions.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Input placeholder="e.g. Bacillus cereus" className="flex-1" />
                <Button variant="outline" className="ml-2" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <CardTitle className="text-lg">Taxonomy ID</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-md">NCBI Taxonomy ID</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <Input placeholder="Taxonomy ID" />
            </CardContent>
          </Card>
        </div>

        {/* My Label */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">My Label</CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="My identifier123" />
          </CardContent>
        </Card>

        {/* Output Options */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Output Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="Taxonomy + My Label" />
            </CardContent>
          </Card>

          <Card>
            {/* TODO: Add folder selector from Workspace */}
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Output Folder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Input
                  placeholder="Select an output folder"
                  className="flex-1"
                />
                <Button variant="outline" className="ml-2" size="icon">
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Buttons */}
        <div className="service-form-controls">
          <Button variant="outline" type="reset">
            Reset
          </Button>
          <Button type="submit">Annotate</Button>
        </div>
      </form>
    </section>
  );
};

export default GenomeAnnotationContent;
