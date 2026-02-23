import { useState } from "react";

import { handleSraAdd } from "@/lib/services/service-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Library } from "@/types/services";

import { ChevronRight } from "lucide-react";

interface SraRunAccessionProps {
  title?: string;
  placeholder?: string;
  selectedLibraries: Library[];
  setSelectedLibraries: (libraries: Library[]) => void;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  allowDuplicates?: boolean;
}

const SraRunAccession = ({
  title = "SRA Run Accession",
  placeholder = "Select SRA File...",
  selectedLibraries,
  setSelectedLibraries,
  disabled = false,
  onValueChange,
  allowDuplicates = false,
}: SraRunAccessionProps) => {
  const [sraAccession, setSraAccession] = useState("");

  const handleAdd = () => {
    const newLibraries = handleSraAdd(
      sraAccession,
      selectedLibraries,
      allowDuplicates,
    );
    if (newLibraries) {
      setSelectedLibraries(newLibraries);
      setSraAccession("");
      if (onValueChange) onValueChange("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="service-card-label">{title}</Label>
        <div className="bg-border mx-4 h-[1px] flex-1" />
        <Button
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={!sraAccession.trim() || disabled}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          className="service-card-input"
          placeholder={placeholder}
          value={sraAccession}
          onChange={(e) => {
            setSraAccession(e.target.value);
            if (onValueChange) onValueChange(e.target.value);
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default SraRunAccession;
