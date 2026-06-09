interface ChartStatusMessageProps {
  errorMessage?: string;
}

/**
 * Inline status line rendered inside a chart's Card when there is no data or
 * the fetch failed. Keeps the two messages visually distinct so an outage is
 * not mistaken for "no records exist for this taxon".
 */
export function ChartStatusMessage({ errorMessage }: ChartStatusMessageProps) {
  if (errorMessage) {
    return (
      <p className="text-destructive text-sm">
        Could not load: {errorMessage}
      </p>
    );
  }
  return (
    <p className="text-muted-foreground text-sm">
      No distribution data was returned.
    </p>
  );
}
