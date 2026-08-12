import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";

export function Choice({
  value,
  id,
  label,
}: {
  value: string;
  id: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}
