import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { EntityViewShell } from "@/components/views";
import {
  surveillanceTabs,
  type SurveillanceViewRecord,
} from "@/lib/surveillance-view";
import { SurveillanceOverview } from "./surveillance-overview";

export function SurveillanceMember({
  surveillance,
}: {
  surveillance: SurveillanceViewRecord;
}) {
  return (
    <EntityViewShell
      viewLabel="Surveillance View"
      title={surveillance.sample_identifier}
      breadcrumbs={
        <div className="flex flex-wrap items-baseline gap-x-1 text-sm">
          <Link
            className="text-muted-foreground hover:text-foreground"
            href="/surveillance"
          >
            Surveillance
          </Link>
          <span className="text-muted-foreground/50">»</span>
          <h1 className="m-0 inline text-sm leading-none font-bold text-secondary">
            {surveillance.sample_identifier}
          </h1>
        </div>
      }
      headerContent={
        surveillance.pathogen_test_type?.join(", ") ??
        "Pathogen surveillance sample"
      }
      metadataSummary={
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 rounded-lg border bg-card px-4 py-3 text-sm">
          <span>
            <strong>Test type:</strong>{" "}
            {surveillance.pathogen_test_type?.join(", ") || "Not available"}
          </span>
          <span>
            <strong>Result:</strong>{" "}
            {displaySummary(surveillance.pathogen_test_result)}
          </span>
          <span>
            <strong>Collection year:</strong>{" "}
            {displaySummary(surveillance.collection_year)}
          </span>
        </div>
      }
      tabs={surveillanceTabs.map((tab) => ({
        ...tab,
        icon: <LayoutDashboard />,
      }))}
      activeTab="overview"
      defaultTab="overview"
      layout="scroll"
    >
      <SurveillanceOverview surveillance={surveillance} />
    </EntityViewShell>
  );
}

function displaySummary(value: unknown): string {
  if (Array.isArray(value)) {
    const values = value.filter(
      (item): item is string | number | boolean | bigint =>
        ["string", "number", "boolean", "bigint"].includes(typeof item),
    );
    return values.length > 0 ? values.map(String).join(", ") : "Not available";
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value === "" ? "Not available" : String(value);
  }
  return "Not available";
}
