import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { surveillanceFields } from "@/constants/datafields/surveillance";
import {
  formatCoordinates,
  formatSourceDate,
  type SurveillanceViewRecord,
} from "@/lib/surveillance-view";

const sections = [
  ["Sample Info", "Sample Info"],
  ["Collection", "Sample Collection"],
  ["Tests", "Sample Tests"],
  ["Host", "Host Info"],
  ["Environmental Exposure", "Environmental Exposure"],
  ["Clinical Data", "Clinical Data"],
  ["Symptoms/Diagnosis", "Symptoms/Diagnosis"],
  ["Treatment", "Treatment"],
  ["Vaccination", "Vaccination"],
  ["Other", "Other"],
] as const;

const dateFields = new Set([
  "collection_date",
  "sample_receipt_date",
  "submission_date",
  "last_update_date",
  "embargo_end_date",
  "date_inserted",
  "date_updated",
]);

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
    return formatSourceDate(value);
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

export function SurveillanceOverview({
  surveillance,
}: {
  surveillance: SurveillanceViewRecord;
}) {
  const coordinates = formatCoordinates(
    surveillance.collection_latitude,
    surveillance.collection_longitude,
  );

  return (
    <div className="grid gap-4 pb-6 xl:grid-cols-2">
      {sections.map(([title, sourceGroup]) => {
        const fields = Object.values(surveillanceFields).filter(
          ({ group, field }) =>
            group === sourceGroup &&
            field !== "collection_latitude" &&
            field !== "collection_longitude",
        );
        const values = fields.flatMap(({ field, label }) => {
          const value = displayValue(field, surveillance[field]);
          return value ? [{ field, label, value }] : [];
        });
        if (title === "Collection" && coordinates) {
          values.push({
            field: "coordinates",
            label: "Coordinates",
            value: coordinates,
          });
        }

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
