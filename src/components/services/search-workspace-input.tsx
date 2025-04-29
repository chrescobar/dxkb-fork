import React from "react";
import { Button } from "../ui/button";
import { FolderSearch, Plus } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-label";

interface SearchWorkspaceInputProps {
  title?: string;
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
    <div>
      <Label className="mb-1 block text-sm font-medium">{title}</Label>
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
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
    </div>
  );
};

export default SearchWorkspaceInput;
