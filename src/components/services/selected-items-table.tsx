import React from "react";
import { Button } from "../ui/button";

interface SelectedItem {
  id: string;
  name: string;
  type?: string;
  description?: string;
  color?: string;
  shape?: string;
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
  const getShapeClass = (shape?: string) => {
    switch (shape) {
      case "circle":
        return "rounded-full";
      case "square":
        return "rounded-none";
      case "diamond":
        return "rotate-45";
      default:
        return "rounded-full";
    }
  };

  const renderShape = (color?: string, shape?: string) => {
    if (!color) return null;

    if (shape === "triangle") {
      return (
        <div className="inline-block w-0 h-0 border-[5px] border-transparent" style={{
          borderBottomWidth: "8px",
          borderBottomColor: color.replace("bg-", ""),
        }} />
      );
    }

    return (
      <div
        className={`h-2.5 w-2.5 ${color} ${getShapeClass(shape)}`}
      />
    );
  };

  return (
    <div className={`bg-background-100 rounded-md p-4 border overflow-auto ${className}`}>
      <div className="overflow-y-auto rounded-md border h-full">
        {items.length === 0 ? (
          <div className="text-muted-foreground p-4.5 text-center text-sm bg-white h-full">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white px-4 py-2 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-sm">{item.name}</span>
                    {(item.color || item.shape) && (
                      <div className="inline-flex items-center gap-2 ml-2">
                        {renderShape(item.color, item.shape)}
                      </div>
                    )}
                    {item.type && (
                      <div className="text-muted-foreground text-xs">
                        {item.type}
                      </div>
                    )}
                    {item.description && (
                      <div className="text-muted-foreground text-xs">
                        {item.description}
                      </div>
                    )}
                  </div>
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
    </div>
  );
};

export default SelectedItemsTable;