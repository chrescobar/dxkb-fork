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
              className="w-80 border border-primary bg-card px-2 py-1 text-card-foreground dark:bg-card"
              placeholder={placeholder}
              value={value}
              onChange={(e) => { onChange(e.target.value); }}
            />

            
  );
}