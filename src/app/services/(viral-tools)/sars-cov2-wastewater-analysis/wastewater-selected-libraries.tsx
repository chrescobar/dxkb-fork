import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import SelectedItemsTable from "@/components/services/selected-items-table";
import { getLibraryTypeLabel } from "@/lib/forms/shared-schemas";
import type { Library } from "@/types/services";

export function WastewaterSelectedLibraries({
  libraries,
  onRemove,
}: {
  libraries: Library[];
  onRemove: (id: string) => void;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="service-card-header">
        <CardTitle className="service-card-title">
          Selected Libraries
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger aria-label="Help: place read files using arrow buttons">
                <HelpCircle className="service-card-tooltip-icon" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Place read files here using the arrow buttons</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="text-xs">
          Place read files here using the arrow buttons.
        </CardDescription>
      </CardHeader>
      <CardContent className="service-card-content">
        <SelectedItemsTable
          items={libraries.map((library) => ({
            id: library.id,
            name: library.name,
            type: getLibraryTypeLabel(library.type),
          }))}
          onRemove={onRemove}
          className="max-h-80 overflow-y-auto"
        />
      </CardContent>
    </Card>
  );
}
