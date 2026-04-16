export type ApiErrorCode =
  | "unauthenticated" // 401
  | "forbidden" // 403
  | "not_found" // 404
  | "validation" // 400
  | "upstream" // 502 / 5xx
  | "unknown";

export interface ApiError {
  message: string;
  status: number;
  code: ApiErrorCode;
  details?: unknown;
}

export class ApiCallError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiCallError";
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
  }
}

export function statusToErrorCode(status: number): ApiErrorCode {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status >= 400 && status < 500) return "validation";
  if (status >= 500) return "upstream";
  return "unknown";
}
