/**
 * Sanitize and join genome IDs into a comma-separated string for RQL `in()` clauses.
 * Only allows IDs matching the BV-BRC genome ID format (e.g. "83332.12").
 */
export function buildGenomeInClause(ids: string[]): string {
  return ids
    .reduce<string[]>((validIds, id) => {
      const trimmedId = id.trim();
      if (/^\d+(\.\d+)?$/.test(trimmedId)) validIds.push(trimmedId);
      return validIds;
    }, [])
    .join(",");
}
