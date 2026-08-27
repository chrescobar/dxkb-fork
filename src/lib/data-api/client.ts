import { maxExportRows } from "./types";
import type {
  CollectionRequest,
  CollectionResult,
  DataResource,
  ExportRequest,
  MemberRequest,
  MemberResult,
  RowsResult,
  SelectedRequest,
} from "./types";

export class DataRepositoryError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "DataRepositoryError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body =
      payload && typeof payload === "object"
        ? (payload as { error?: unknown; code?: unknown })
        : {};
    throw new DataRepositoryError(
      typeof body.error === "string"
        ? body.error
        : `Data request failed with status ${String(response.status)}.`,
      response.status,
      typeof body.code === "string" ? body.code : "request_failed",
    );
  }
  return payload as T;
}

function collectionParams(request: CollectionRequest): URLSearchParams {
  const params = new URLSearchParams({ operation: request.operation });
  if (request.rql) params.set("rql", request.rql);
  if (request.keyword) params.set("keyword", request.keyword);
  if (request.page) params.set("page", String(request.page));
  if (request.pageSize) params.set("pageSize", String(request.pageSize));
  if (request.sort)
    params.set("sort", `${request.sort.field}:${request.sort.direction}`);
  for (const field of request.fields ?? []) params.append("field", field);
  for (const facet of request.facets ?? []) params.append("facet", facet);
  return params;
}

export class DataRepository {
  constructor(private readonly basePath = "/api/data") {}

  collection<T extends Record<string, unknown> = Record<string, unknown>>(
    resource: DataResource,
    request: Omit<CollectionRequest, "operation">,
    signal?: AbortSignal,
  ): Promise<CollectionResult<T>> {
    const params = collectionParams({ operation: "collection", ...request });
    return fetch(`${this.basePath}/${resource}?${params}`, {
      credentials: "include",
      signal,
    }).then(parseResponse<CollectionResult<T>>);
  }

  member<T extends Record<string, unknown> = Record<string, unknown>>(
    resource: DataResource,
    request: Omit<MemberRequest, "operation">,
    signal?: AbortSignal,
  ): Promise<MemberResult<T>> {
    const params = new URLSearchParams({ operation: "member", id: request.id });
    if (request.idField) params.set("idField", request.idField);
    for (const field of request.fields ?? []) params.append("field", field);
    return fetch(`${this.basePath}/${resource}?${params}`, {
      credentials: "include",
      signal,
    }).then(parseResponse<MemberResult<T>>);
  }

  selected<T extends Record<string, unknown> = Record<string, unknown>>(
    resource: DataResource,
    request: Omit<SelectedRequest, "operation">,
    signal?: AbortSignal,
  ): Promise<RowsResult<T>> {
    return this.post(resource, { operation: "selected", ...request }, signal);
  }

  export<T extends Record<string, unknown> = Record<string, unknown>>(
    resource: DataResource,
    request: Omit<ExportRequest, "operation">,
    signal?: AbortSignal,
  ): Promise<RowsResult<T>> {
    return this.post(resource, { operation: "export", ...request }, signal);
  }

  async exportAll<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(
    resource: DataResource,
    request: Omit<ExportRequest, "operation" | "limit" | "offset">,
    signal?: AbortSignal,
  ): Promise<RowsResult<T>> {
    const rows: T[] = [];
    let result: RowsResult<T>;
    do {
      result = await this.export<T>(
        resource,
        {
          ...request,
          limit: maxExportRows,
          offset: rows.length,
        },
        signal,
      );
      rows.push(...result.rows);
    } while (result.rows.length === maxExportRows);
    return { rows };
  }

  private post<T>(
    resource: DataResource,
    body: SelectedRequest | ExportRequest,
    signal?: AbortSignal,
  ): Promise<T> {
    return fetch(`${this.basePath}/${resource}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }).then(parseResponse<T>);
  }
}
