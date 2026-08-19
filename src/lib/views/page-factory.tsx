import type { ReactElement } from "react";

import { renderListShell } from "./render-list";
import { renderSingularShell } from "./render-singular";
import type { SearchParamsRecord } from "./rql";
import type { ViewTypeEntry } from "./view-types";

type ListPage = (args: {
  searchParams: Promise<SearchParamsRecord>;
}) => Promise<ReactElement>;

type SingularPage = (args: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<SearchParamsRecord>;
}) => Promise<ReactElement>;

/** Build a list route page bound to a registry entry. */
export function makeListPage(entry: ViewTypeEntry): ListPage {
  return async ({ searchParams }) => renderListShell(entry, await searchParams);
}

/** Build a singular route page bound to a registry entry and its dynamic param name. */
export function makeSingularPage(entry: ViewTypeEntry, paramName: string): SingularPage {
  return async ({ params, searchParams }) => {
    const id = (await params)[paramName];
    return renderSingularShell(entry, id, await searchParams);
  };
}
