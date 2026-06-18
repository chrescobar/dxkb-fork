import type { ReactElement } from "react";

import { PlaceholderList } from "./placeholder-list";
import { resolveListQuery, type SearchParamsRecord } from "./rql";
import type { ViewTypeEntry } from "./view-types";

/** Render a list view: translate the query to RQL, then render the (placeholder) grid. */
export function renderListShell(
  entry: ViewTypeEntry,
  searchParams: SearchParamsRecord,
): ReactElement {
  const rql = resolveListQuery(searchParams, entry.list.friendlyParams);
  return <PlaceholderList label={entry.label} rql={rql} />;
}
