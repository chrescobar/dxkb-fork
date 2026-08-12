"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { ServiceHeader } from "@/components/services/service-header";
import { similarGenomeFinderInfo } from "@/lib/services/info/similar-genome-finder";
import { AdvancedOptionsSection } from "./advanced-options-section";
import { GenomeInputSection } from "./genome-input-section";
import { ResultsSection } from "./results-section";
import { useSimilarGenomeFinderForm } from "./use-similar-genome-finder-form";

const quickReference =
  "https://www.bv-brc.org/docs/quick_references/services/similar_genome_finder_service.html";
const tutorial =
  "https://www.bv-brc.org/docs/tutorial/similar_genome_finder/similar_genome_finder.html";
const video =
  "https://youtube.com/playlist?list=PLWfOyhOW_OashHfld0w1DUkO7rQz6s8SA&si=Enh6GME_i4LMcXL8";

export type { SimilarGenomeFinderResultRow } from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-result-utils";

export default function SimilarGenomeFinderServicePage() {
  const controller = useSimilarGenomeFinderForm();
  const { form, runtime, canSubmit, isSubmitting, handleReset } = controller;
  return (
    <section>
      <ServiceHeader
        title="Similar Genome Finder"
        description="The Similar Genome Finder Service will find similar public genomes in BV-BRC or compute genome distance estimation using Mash/MinHash. It returns a set of genomes matching the specified similarity criteria."
        infoPopupTitle={similarGenomeFinderInfo.title}
        infoPopupDescription={similarGenomeFinderInfo.description}
        quickReferenceGuide={quickReference}
        tutorial={tutorial}
        instructionalVideo={video}
      />
      <form
        action={() => form.handleSubmit()}
        className="grid grid-cols-1 gap-6 md:grid-cols-12"
      >
        <div className="md:col-span-12">
          <GenomeInputSection controller={controller}>
            <AdvancedOptionsSection controller={controller} />
          </GenomeInputSection>
          <div className="md:col-span-12">
            <div className="service-form-controls">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting || !canSubmit}>
                {isSubmitting ? <Spinner className="mr-2 size-4" /> : null}
                <Search className="mr-2 size-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </form>
      <ResultsSection controller={controller} />
      <JobParamsDialog {...runtime.jobParamsDialogProps} />
    </section>
  );
}
