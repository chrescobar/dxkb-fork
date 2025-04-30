import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface SelectedItem {
  id: string;
  name: string;
  type?: string;
  description?: string;
}

interface SelectedItemsTableProps {
  title: string;
  description?: string;
  tooltipContent?: string;
  items: SelectedItem[];
  onRemove: (id: string) => void;
  emptyMessage?: string;
  className?: string;
}

const SelectedItemsTable = ({
  title,
  description = "Place items here using the arrow buttons.",
  tooltipContent = "Place items here using the arrow buttons",
  items,
  onRemove,
  emptyMessage = "No items selected",
  className = "",
}: SelectedItemsTableProps) => {
  return (
    <div className="overflow-hidden rounded-md border">
      {items.length === 0 ? (
        <div className="text-muted-foreground p-4 text-center text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white px-4 py-2 hover:bg-gray-50"
            >
              <div>
                <span className="text-sm">{item.name}</span>
                {item.type && (
                  <div className="text-xs text-muted-foreground">
                    {item.type}
                  </div>
                )}
                {item.description && (
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onRemove(item.id)}
              >
                <span className="text-gray-400 hover:text-gray-600">×</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectedItemsTable; 