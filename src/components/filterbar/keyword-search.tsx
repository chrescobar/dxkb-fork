import { Input } from "../ui/input";

interface KeywordSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function KeywordSearch({ value, onChange, placeholder = "Search keywords..." }: KeywordSearchProps) {
  return (
            <Input
              type="search"
              className="text-primary-background w-80 border border-primary px-2 py-1"
              placeholder={placeholder}
              value={value}
              onChange={(e) => { onChange(e.target.value); }}
            />

            
  );
}