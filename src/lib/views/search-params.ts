import type { SearchParamsRecord } from "./rql";

/**
 * Return the first value of a search param, narrowing the `string | string[] |
 * undefined` shape Next.js hands route components to a single `string | undefined`.
 */
export function firstSearchParam(
  params: SearchParamsRecord | undefined,
  key: string,
): string | undefined {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}
