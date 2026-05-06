import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function GenomesView() {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Genomes</CardTitle>
        <CardDescription>
          Genome table filtering and pagination are planned for a dedicated follow-up view.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
