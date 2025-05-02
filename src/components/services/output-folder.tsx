import React from "react";
import { Button } from "../ui/button";
import { FolderSearch, HelpCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

interface OutputFolderProps {
  title?: string | null;
  tooltipContent?: boolean;
  placeholder?: string;
  buttonIcon?: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

const OutputFolder = ({
  title = "Output Folder",
  tooltipContent = true,
  placeholder = "Select Output Folder...",
  buttonIcon = <FolderSearch size={16} />,
  value = "",
  onChange,
  disabled = false,
}: OutputFolderProps) => {
  return (
    <div className="space-y-0">
      {title &&
        <div className="flex flex-row items-center gap-2">
          <Label className="service-card-label">{title}</Label>
          {tooltipContent && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="service-card-tooltip-icon mb-2" />
              </TooltipTrigger>
              <TooltipContent>The workspace folder where results will be placed.</TooltipContent>
            </Tooltip>
          )}
        </div>
      }
      <div className="flex gap-2">
        <Input
          className="service-card-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
        />
        <Button size="icon" variant="outline">
          {buttonIcon}
        </Button>
      </div>
    </div>
  );
};

export default OutputFolder;
