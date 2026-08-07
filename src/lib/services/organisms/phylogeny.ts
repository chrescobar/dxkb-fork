import { canonicalDatasetId } from "@/lib/phylogeny/nextstrain-dataset";

const contentOrigin = "https://www.bv-brc.org";
const bacterialTreeDictionaryUrl = `${contentOrigin}/api/content/bvbrc_phylogeny_tab/taxon_tree_dict.json`;
const bacterialTreeBaseUrl = `${contentOrigin}/api/content/bvbrc_phylogeny_tab/phyloxml/`;
const viralFamilyBaseUrl = `${contentOrigin}/api/content/phyloxml_trees/families/`;
const phylogenyMetadataFetchTimeoutMs = 2000;
const phylogenyTreeFetchTimeoutMs = 30_000;

export interface PhyloTreeRef {
  name: string;
  definition?: string;
  path: string;
  metadata?: string;
  region?: string;
}

export interface PhyloGroup {
  key: string;
  title: string;
  archaeopteryx?: PhyloTreeRef[];
  nextstrain?: PhyloTreeRef[];
}

export interface PhyloFamilyBlock {
  order?: string[];
  groups: PhyloGroup[];
}

let dictionaryPromise: Promise<Record<string, string>> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseTreeRef(value: unknown): PhyloTreeRef | null {
  if (
    !isRecord(value) ||
    typeof value.name !== "string" ||
    typeof value.path !== "string"
  ) {
    return null;
  }
  return {
    name: value.name,
    path: value.path,
    ...(typeof value.definition === "string"
      ? { definition: value.definition }
      : {}),
    ...(typeof value.metadata === "string" ? { metadata: value.metadata } : {}),
    ...(typeof value.region === "string" ? { region: value.region } : {}),
  };
}

function parseTreeRefs(value: unknown): PhyloTreeRef[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const refs = value
    .map(parseTreeRef)
    .filter((ref): ref is PhyloTreeRef => ref !== null);
  return refs.length > 0 ? refs : undefined;
}

function parseFamilyBlock(value: unknown): PhyloFamilyBlock {
  if (!isRecord(value) || !Array.isArray(value.groups)) {
    throw new Error("viral family response has an invalid shape");
  }
  const groups = value.groups.flatMap((group): PhyloGroup[] => {
    if (
      !isRecord(group) ||
      typeof group.key !== "string" ||
      typeof group.title !== "string"
    ) {
      return [];
    }
    const archaeopteryx = parseTreeRefs(group.archaeopteryx);
    const nextstrain = parseTreeRefs(group.nextstrain);
    if (!archaeopteryx && !nextstrain) return [];
    return [{ key: group.key, title: group.title, archaeopteryx, nextstrain }];
  });
  return {
    groups,
    ...(Array.isArray(value.order)
      ? {
          order: value.order.filter(
            (key): key is string => typeof key === "string",
          ),
        }
      : {}),
  };
}

async function fetchTreeDictionary(): Promise<Record<string, string>> {
  if (!dictionaryPromise) {
    dictionaryPromise = fetch(bacterialTreeDictionaryUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(phylogenyMetadataFetchTimeoutMs),
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`tree dictionary: ${String(response.status)}`);
        const value: unknown = await response.json();
        if (!isRecord(value))
          throw new Error("tree dictionary has an invalid shape");
        return Object.fromEntries(
          Object.entries(value).filter(
            (entry): entry is [string, string] =>
              /^\d+$/.test(entry[0]) && typeof entry[1] === "string",
          ),
        );
      })
      .catch((error: unknown) => {
        dictionaryPromise = null;
        throw error;
      });
  }
  return dictionaryPromise;
}

export async function fetchBacterialTreeXml(
  taxonId: number,
): Promise<string | null> {
  const filename = (await fetchTreeDictionary())[String(taxonId)];
  if (!filename) return null;
  const url = new URL(filename, bacterialTreeBaseUrl);
  if (url.origin !== contentOrigin)
    throw new Error("tree dictionary returned an unsafe URL");
  return fetchTreeXml(url.toString());
}

export async function fetchViralFamilyBlock(
  taxonId: number,
): Promise<PhyloFamilyBlock> {
  const id = String(taxonId);
  const url = `${viralFamilyBaseUrl}${id}/${id}.json`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(phylogenyMetadataFetchTimeoutMs),
  });
  if (!response.ok)
    throw new Error(`viral family fetch: ${String(response.status)}`);
  return parseFamilyBlock(await response.json());
}

export async function fetchNextstrainInventory(): Promise<Set<string>> {
  const response = await fetch("/api/phylogeny/nextstrain-datasets", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`Nextstrain inventory: ${String(response.status)}`);

  const value: unknown = await response.json();
  if (!isRecord(value) || !Array.isArray(value.ids)) {
    throw new Error("Nextstrain inventory has an invalid shape");
  }

  const ids = value.ids.map((id) =>
    typeof id === "string" ? canonicalDatasetId(id) : null,
  );
  if (ids.some((id) => id === null)) {
    throw new Error("Nextstrain inventory contains an invalid identifier");
  }

  return new Set(ids as string[]);
}

export async function fetchTreeXml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { Accept: "application/xml,text/xml" },
    signal: AbortSignal.timeout(phylogenyTreeFetchTimeoutMs),
  });
  if (!response.ok) throw new Error(`tree fetch: ${String(response.status)}`);
  return response.text();
}

export function resolvePhylogenyUrl(path: string): string | null {
  try {
    const url = new URL(path, contentOrigin);
    return url.protocol === "https:" && url.origin === contentOrigin
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function resetPhylogenyCacheForTests(): void {
  dictionaryPromise = null;
}
