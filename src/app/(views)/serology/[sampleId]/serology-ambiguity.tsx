import Link from "next/link";
import { serologyHref } from "@/lib/views/hrefs";

interface SerologyAmbiguityProps {
  sampleId: string;
  testTypes: readonly string[];
}

export function SerologyAmbiguity({
  sampleId,
  testTypes,
}: SerologyAmbiguityProps) {
  return (
    <section
      className="m-4 max-w-3xl rounded-lg border bg-card p-6"
      aria-labelledby="serology-choice-title"
    >
      <h1 id="serology-choice-title" className="text-xl font-semibold">
        Choose a serology test
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sample <strong className="text-foreground">{sampleId}</strong> has
        multiple serology records. Select a test type to open the intended
        record.
      </p>
      {testTypes.length > 0 ? (
        <ul className="mt-5 grid gap-2">
          {testTypes.map((testType) => (
            <li key={testType}>
              <Link
                className="block rounded-md border px-4 py-3 text-primary underline-offset-4 hover:bg-muted hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                href={serologyHref(sampleId, testType)}
              >
                {testType}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-md bg-muted p-4 text-sm">
          No test-type labels are available for these records.
        </p>
      )}
      <Link
        className="mt-6 inline-block text-sm text-primary underline underline-offset-2"
        href="/serology"
      >
        Browse serology records
      </Link>
    </section>
  );
}
