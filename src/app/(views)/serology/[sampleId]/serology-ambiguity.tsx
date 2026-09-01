import { AmbiguityChoice } from "@/components/views/ambiguity-choice";
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
    <AmbiguityChoice
      sampleId={sampleId}
      testTypes={testTypes}
      title="Choose a serology test"
      titleId="serology-choice-title"
      recordType="serology"
      browseHref="/serology"
      getChoiceHref={serologyHref}
    />
  );
}
