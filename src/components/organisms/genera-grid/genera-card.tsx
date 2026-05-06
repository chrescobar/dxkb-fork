import Avatar from "boring-avatars";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const numberFormatter = new Intl.NumberFormat("en-US");

interface GeneraCardProps {
  name: string;
  count: number;
  taxonId: number;
}

export function GeneraCard({ name, count, taxonId }: GeneraCardProps) {
  const legacyHref = `https://www.bv-brc.org/view/Taxonomy/${taxonId}#view_tab=genomes&filter=genus:${encodeURIComponent(name)}`;

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="mb-3">
          <Avatar
            size={48}
            name={name}
            variant="beam"
            colors={["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"]}
          />
        </div>
        <CardTitle className="truncate" title={name}>
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {numberFormatter.format(count)} genomes
        </p>
      </CardContent>
      <CardFooter>
        <Link
          href={legacyHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View
          <ArrowRight />
        </Link>
      </CardFooter>
    </Card>
  );
}
