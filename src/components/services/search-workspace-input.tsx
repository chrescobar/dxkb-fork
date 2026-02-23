import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FolderSearch, Plus } from "lucide-react";

interface SearchWorkspaceInputProps {
  title?: string | null;
  placeholder?: string;
  icon?: React.ReactNode;
  variant?: "default" | "add";
  value?: string;
  onChange?: (value: string) => void;
  onAdd?: () => void;
  disabled?: boolean;
}

const SearchWorkspaceInput = ({
  title = "Search Workspace",
  placeholder = "Select Workspace Folder...",
  icon = <FolderSearch size={16} />,
  variant = "default",
  value = "",
  onChange,
  onAdd,
  disabled = false,
}: SearchWorkspaceInputProps) => {
  return (
    <>
      {title && <Label className="service-card-label">{title}</Label>}
      <div className="flex gap-2">
        <Input
          className="service-card-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAdd?.();
            }
          }}
        />
        <Button size="icon" variant="outline">
          {icon}
        </Button>
        {variant === "add" && (
          <Button
            size="icon"
            variant="outline"
            onClick={onAdd}
            disabled={disabled}
          >
            <Plus size={16} />
          </Button>
        )}
      </div>
    </>
  );
};

export default SearchWorkspaceInput;
