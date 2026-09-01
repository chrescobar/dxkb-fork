import { AmbiguityChoice } from "@/components/views/ambiguity-choice";
import { surveillanceHref } from "@/lib/views/hrefs";

interface SurveillanceAmbiguityProps {
  sampleId: string;
  testTypes: readonly string[];
}

export function SurveillanceAmbiguity({
  sampleId,
  testTypes,
}: SurveillanceAmbiguityProps) {
  return (
    <AmbiguityChoice
      sampleId={sampleId}
      testTypes={testTypes}
      title="Choose a pathogen test"
      titleId="surveillance-choice-title"
      recordType="surveillance"
      browseHref="/surveillance"
      getChoiceHref={surveillanceHref}
    />
  );
}
