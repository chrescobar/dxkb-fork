import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ChevronRight, FolderSearch } from "lucide-react";
import { Label } from "../ui/label";

interface SearchPairInputProps {
  title?: string | null;
  firstPlaceholder?: string;
  secondPlaceholder?: string;
  icon?: React.ReactNode;
  variant?: "single" | "pair";
  justInput?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onAdd?: (files: { first: string; second?: string }) => void;
  disabled?: boolean;
}

const SearchReadLibrary = ({
  title = "Search Pair Read Library",
  firstPlaceholder = "Select File 1...",
  secondPlaceholder = "Select File 2...",
  icon = <FolderSearch size={16} />,
  variant = "single",
  justInput = false,
  value = "",
  onChange,
  onAdd,
  disabled = false,
}: SearchPairInputProps) => {
  const [firstInput, setFirstInput] = useState("");
  const [secondInput, setSecondInput] = useState("");

  const handleFirstInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstInput(e.target.value);
    onChange?.(e.target.value);
  };

  const handleSecondInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondInput(e.target.value);
  };

  const handleAdd = () => {
    if (variant === "pair") {
      if (firstInput && secondInput) {
        onAdd?.({ first: firstInput, second: secondInput });
        setFirstInput("");
        setSecondInput("");
      }
    } else {
      if (firstInput) {
        onAdd?.({ first: firstInput });
        setFirstInput("");
      }
    }
  };

  const canAdd = variant === "pair" ? firstInput && secondInput : firstInput;

  return (
    <div className="space-y-2">
      {!justInput && (
        <div className="flex items-center justify-between">
          {title && (
            <Label className="mb-1 block text-sm font-medium">{title}</Label>
          )}
          <div className="bg-border mx-4 h-[1px] flex-1" />
          <Button
            variant="outline"
            size="icon"
            onClick={handleAdd}
            disabled={!canAdd || disabled}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder={firstPlaceholder}
          value={firstInput}
          onChange={handleFirstInputChange}
          disabled={disabled}
        />
        <Button size="icon" variant="outline" disabled={disabled}>
          {icon}
        </Button>
      </div>

      {variant === "pair" && (
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder={secondPlaceholder}
            value={secondInput}
            onChange={handleSecondInputChange}
            disabled={disabled}
          />
          <Button size="icon" variant="outline" disabled={disabled}>
            {icon}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchReadLibrary;
