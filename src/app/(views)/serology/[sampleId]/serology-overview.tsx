import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { serologyFields } from "@/constants/datafields/serology";
import {
  formatSerologyDate,
  type SerologyViewRecord,
} from "@/lib/serology-view";

const sections = [
  ["Sample Info", "Sample Info"],
  ["Host", "Host Info"],
  ["Collection", "Sample Collection"],
  ["Tests", "Sample Tests"],
  ["Other", "Other"],
] as const;

const dateFields = new Set([
  "collection_date",
  "date_inserted",
  "date_modified",
]);

interface SerologyOverviewProps {
  serology: SerologyViewRecord;
}

function displayValue(field: string, value: unknown): string | null {
  if (value == null || value === "") return null;
  if (Array.isArray(value)) {
    const values = value.filter(
      (item): item is string | number | boolean | bigint =>
        ["string", "number", "boolean", "bigint"].includes(typeof item),
    );
    return values.length > 0 ? values.map(String).join(", ") : null;
  }
  if (dateFields.has(field) && typeof value === "string")
    return formatSerologyDate(value);
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return null;
}

export function SerologyOverview({ serology }: SerologyOverviewProps) {
  return (
    <div className="grid gap-4 pb-6 xl:grid-cols-2">
      {sections.map(([title, sourceGroup]) => {
        const fields = Object.values(serologyFields).filter(
          ({ group }) => group === sourceGroup,
        );
        const values = fields.flatMap(({ field, label }) => {
          const value = displayValue(field, serology[field]);
          return value ? [{ field, label, value }] : [];
        });

        return (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              {values.length > 0 ? (
                <dl className="grid gap-4 sm:grid-cols-2">
                  {values.map(({ field, label, value }) => (
                    <div key={field}>
                      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        {label}
                      </dt>
                      <dd className="mt-0.5 wrap-break-word">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No data available.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
