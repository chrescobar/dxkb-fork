import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceholderViewProps {
  title: string;
  description?: string;
}

export function PlaceholderView({ title, description }: PlaceholderViewProps) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description ??
            "This view is a placeholder while the Viruses landing page tabs are brought online."}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function TaxonomyView() {
  return <PlaceholderView title="Taxonomy" />;
}

export function GenomesView() {
  return <PlaceholderView title="Genomes" />;
}

export function FeaturesView() {
  return <PlaceholderView title="Features" />;
}

export function ProteinsView() {
  return <PlaceholderView title="Proteins" />;
}

export function ProteinStructuresView() {
  return <PlaceholderView title="Protein Structures" />;
}

export function DomainsAndMotifsView() {
  return <PlaceholderView title="Domains and Motifs" />;
}

export function EpitopesView() {
  return <PlaceholderView title="Epitopes" />;
}

export function ExperimentsView() {
  return <PlaceholderView title="Experiments" />;
}
