import { TriangleAlert } from "lucide-react";

interface SectionErrorProps {
  title?: string;
  message: string;
}

export function SectionError({ title = "Couldn't load this section", message }: SectionErrorProps) {
  return (
    <div className="bacteria-section-error" role="alert">
      <div className="flex items-center gap-2 font-semibold">
        <TriangleAlert className="size-4" />
        {title}
      </div>
      <pre>{message}</pre>
    </div>
  );
}
