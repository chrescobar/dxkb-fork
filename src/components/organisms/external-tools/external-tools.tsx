import { ExternalLink } from "lucide-react";
import Link from "next/link";

import type { ExternalToolResource } from "@/components/organisms/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ExternalTools({
  resources,
}: {
  resources: readonly ExternalToolResource[];
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>External Tools</CardTitle>
        <CardDescription>Related organism resources.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {resources.map((resource) => (
            <li key={resource.href} className="rounded-md border p-3">
              <Link
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
              >
                {resource.label}
                <ExternalLink />
              </Link>
              {resource.description && (
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {resource.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
