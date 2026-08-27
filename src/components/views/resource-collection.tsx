"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InfoPanel } from "@/components/detail-panel/info-panel";
import { SearchActionBar } from "@/components/search/search-action-bar";
import { ResourceFilterBar } from "./resource-filter-bar";
import { downloadResourceExport } from "./resource-export";
import { ResourceWorkspace } from "./resource-workspace";
import {
  DataTable,
  type DataTableColumn,
  type DataTableRow,
} from "@/components/shared/data-table";
import { useResourceCollection } from "@/hooks/views/use-resource-collection";
import type { CollectionState } from "@/lib/views/collection-state";
import { resourceCollectionPageSize } from "@/hooks/views/collection-state";
import type { DataRepository, DataResource } from "@/lib/data-api";
import { genomeHref, genomeIdFromRow } from "@/lib/views/hrefs";

export interface ResourceCollectionFacet {
  field: string;
  label: string;
  initiallyVisible?: boolean;
}

export interface ResourceCollectionProfile<Row extends DataTableRow> {
  resource: DataResource;
  label: string;
  idField: string;
  columns: readonly DataTableColumn[];
  detailFields?: readonly string[];
  defaultSort: string;
  guideUrl?: string;
  basePredicate?: string;
  buildStructuralRql?: (state: CollectionState) => string | undefined;
  facets?: readonly ResourceCollectionFacet[];
  rowHref?: (row: Row) => string | undefined;
  rowLinkField?: string;
}

function combinePredicates(...predicates: (string | undefined)[]) {
  const active = predicates.filter((predicate): predicate is string =>
    Boolean(predicate),
  );
  if (active.length === 0) return undefined;
  if (active.length === 1) return active[0];
  return `and(${active.join(",")})`;
}

export interface ResourceCollectionExportRequest {
  format: "csv" | "txt";
  selectedIds?: readonly string[];
  fields: readonly string[] | null;
}

export interface ResourceCollectionProps<Row extends DataTableRow> {
  profile: ResourceCollectionProfile<Row>;
  repository: DataRepository;
  state: CollectionState;
  onStateChange: (state: CollectionState) => void;
  baseRql?: string;
  enableRowLinks?: boolean;
  renderDetail?: (row: Row) => ReactNode;
  showHeader?: boolean;
  onExport?: (request: ResourceCollectionExportRequest) => void | Promise<void>;
}

export function ResourceCollection<Row extends DataTableRow>({
  profile,
  repository,
  state,
  onStateChange,
  baseRql,
  enableRowLinks = true,
  renderDetail,
  showHeader = true,
  onExport,
}: ResourceCollectionProps<Row>) {
  const router = useRouter();
  const [exportError, setExportError] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState(() =>
    Object.fromEntries(
      profile.columns.map((column) => [column.id, column.visible !== false]),
    ),
  );
  const collection = useResourceCollection({
    repository,
    resource: profile.resource,
    idField: profile.idField,
    fields: profile.columns.map((column) => column.id),
    detailFields: profile.detailFields,
    facetFields: profile.facets?.map((facet) => facet.field),
    structuralRql: combinePredicates(
      baseRql,
      profile.buildStructuralRql?.(state) ?? profile.basePredicate,
    ),
    state,
    onStateChange,
  });
  const columns = profile.columns.map((column) =>
    enableRowLinks &&
    column.id === (profile.rowLinkField ?? profile.idField) &&
    profile.rowHref
      ? {
          ...column,
          href: profile.rowHref as (row: DataTableRow) => string | undefined,
        }
      : column,
  );
  const detail = collection.detail as Row | null;
  const selectedGenomeId =
    profile.resource === "genome"
      ? collection.activeId
      : genomeIdFromRow(detail);

  const exportRows = async (
    format: "csv" | "txt",
    selectedIds?: readonly string[],
    fields: readonly string[] | null = null,
  ) => {
    setExportError(null);
    try {
      if (onExport) {
        await onExport({ format, selectedIds, fields });
        return;
      }
      const selectedFields = fields
        ? [...fields]
        : profile.columns.map((column) => column.id);
      const result = selectedIds?.length
        ? await repository.selected(profile.resource, {
            ids: [...selectedIds],
            fields: selectedFields,
          })
        : await repository.exportAll(profile.resource, {
            rql: combinePredicates(
              baseRql,
              state.rql ??
                profile.buildStructuralRql?.(state) ??
                profile.basePredicate,
            ),
            keyword: state.keyword,
            fields: selectedFields,
            sort: {
              field: state.sort.split(":")[0],
              direction: state.sort.endsWith(":desc") ? "desc" : "asc",
            },
          });
      downloadResourceExport(
        profile.resource,
        result.rows,
        profile.columns,
        selectedFields,
        format,
      );
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
    }
  };

  const detailContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground shadow-md">
        {renderDetail && detail ? (
          renderDetail(detail)
        ) : (
          <InfoPanel
            variant="search"
            activeTab={profile.resource}
            selectedIds={collection.selectedIds}
            selectedRow={detail}
            isLoading={collection.isDetailLoading}
            isAllPagesSelected={collection.isAllPagesSelected}
            totalItems={collection.total}
          />
        )}
      </div>
    </div>
  );

  return (
    <section
      aria-label={showHeader ? undefined : profile.label}
      aria-labelledby={
        showHeader ? `${profile.resource}-collection-title` : undefined
      }
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {showHeader && (
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              id={`${profile.resource}-collection-title`}
              className="text-xl font-semibold"
            >
              {profile.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse {profile.label.toLowerCase()} records.
            </p>
          </div>
          {profile.guideUrl && (
            <a
              className="text-sm text-primary underline underline-offset-2"
              href={profile.guideUrl}
              target="_blank"
              rel="noreferrer"
            >
              Field guide
            </a>
          )}
        </header>
      )}

      <ResourceFilterBar
        keyword={state.keyword}
        filters={state.filters}
        facets={collection.facets}
        definitions={profile.facets ?? []}
        hasExplicitRql={Boolean(state.rql)}
        onChange={({ keyword, filters, clearRql }) => {
          onStateChange({
            ...state,
            keyword,
            rql: clearRql ? undefined : state.rql,
            filters: state.rql && !clearRql ? state.filters : filters,
            page: 1,
          });
        }}
      />
      <span className="sr-only" aria-live="polite">
        {collection.isRefreshing
          ? "Refreshing results..."
          : `${String(collection.total)} results`}
      </span>

      {exportError && (
        <Alert variant="destructive">
          <AlertTitle>
            Could not export {profile.label.toLowerCase()}
          </AlertTitle>
          <AlertDescription>{exportError}</AlertDescription>
        </Alert>
      )}

      {collection.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load {profile.label.toLowerCase()}</AlertTitle>
          <AlertDescription>
            <p>
              {collection.error instanceof Error
                ? collection.error.message
                : String(collection.error)}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void collection.refetch();
              }}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : !collection.isInitialLoading && collection.total === 0 ? (
        <div
          className="rounded-lg border border-dashed p-8 text-center"
          role="status"
        >
          <h2 className="font-medium">
            {state.keyword || state.rql || Object.keys(state.filters).length
              ? "No matching results"
              : `No ${profile.label.toLowerCase()} available`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.keyword || state.rql || Object.keys(state.filters).length
              ? "Try changing or clearing the current filters."
              : "Records will appear here when they become available."}
          </p>
        </div>
      ) : (
        <ResourceWorkspace
          hasSidePanel={
            collection.isAllPagesSelected || collection.selectedIds.length > 0
          }
          actionBar={
            <SearchActionBar
              selectedCount={
                collection.isAllPagesSelected
                  ? collection.total
                  : collection.selectedIds.length
              }
              searchType={profile.resource}
              guideUrl={profile.guideUrl}
              onAction={(actionId) => {
                if (actionId === "genome" && selectedGenomeId) {
                  router.push(genomeHref(selectedGenomeId));
                }
              }}
            />
          }
          sidePanel={detailContent}
        >
          <DataTable
            id={`${profile.resource}-collection`}
            resource={profile.resource}
            idField={profile.idField}
            data={collection.rows}
            columns={columns}
            totalItems={collection.total}
            pageIndex={state.page - 1}
            pageSize={resourceCollectionPageSize}
            sorting={collection.sorting}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            rowSelection={collection.selection}
            selectedIds={collection.selectedIds}
            isAllPagesSelected={collection.isAllPagesSelected}
            onAllPagesSelectionChange={(selected) => {
              collection.setIsAllPagesSelected(selected);
              if (selected) collection.setSelection({});
            }}
            totalSelectedCount={
              collection.isAllPagesSelected
                ? collection.total
                : collection.selectedIds.length
            }
            onPageChange={collection.setPageIndex}
            onSortingChange={collection.setSorting}
            onRowSelectionChange={collection.setSelection}
            onDownloadAll={(format, fields) =>
              exportRows(format, undefined, fields)
            }
            onDownloadSelected={(format, ids, fields) =>
              exportRows(format, ids, fields)
            }
            scrollRegionLabel={`${profile.label} results table`}
            isLoading={collection.isInitialLoading}
          />
        </ResourceWorkspace>
      )}
    </section>
  );
}
