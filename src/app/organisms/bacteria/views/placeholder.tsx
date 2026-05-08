import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceholderViewProps {
  title: string;
}

export function PlaceholderView({ title }: PlaceholderViewProps) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          This view is a placeholder while the Bacteria landing page tabs are
          brought online.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
