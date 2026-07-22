import { Card } from "@/components/ui/card";
import Link from "next/link";

const links: Record<string, string[]> = {
  viruses: [
    "Bunyavirales",
    "Coronaviridae",
    "Filoviridae",
    "Influenza",
    "Orthomyxoviridae",
    "Paramyxoviridae",
    "All Viruses",
  ],
  analyze: [
    "Assembly",
    "Annotation",
    "BLAST",
    "FastQ Utilities",
    "MSA Analysis",
    "Similar Genome Finder",
    "All Utilities",
  ],
  resources: [
    "Quick Start",
    "Documentation",
    "Downloads",
    "Overview",
    "Reference Guides",
    "Tutorials",
    "All Resources",
  ],
};

const QuickLinks = () => {
  return (
    <section className="px-4 py-8">
      <h3 className="mb-6 text-center text-2xl font-bold">Quick Links</h3>
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h4 className="mb-4 font-bold">Viruses</h4>
          <ul className="space-y-2">
            {links.viruses.map((link) => (
              <li key={link}>
                <Link
                  href={link === "All Viruses" ? "/viruses" : "#"}
                  className="text-primary hover:underline"
                >
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h4 className="mb-4 font-bold">Analyze</h4>
          <ul className="space-y-2">
            {links.analyze.map((link) => (
              <li key={link}>
                <Link href="#" className="text-primary hover:underline">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h4 className="mb-4 font-bold">Resources</h4>
          <ul className="space-y-2">
            {links.resources.map((link) => (
              <li key={link}>
                <Link href="#" className="text-primary hover:underline">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  )
}

export default QuickLinks;