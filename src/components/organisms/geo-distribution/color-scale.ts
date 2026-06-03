import { interpolateRgb } from "@visx/vendor/d3-interpolate";

import type { OrganismLandingConfig } from "@/components/organisms/types";

type AccentKey = OrganismLandingConfig["accent"];

interface AccentPalette {
  light: string;
  dark: string;
  zero: string;
}

export const accentPalettes: Record<AccentKey, AccentPalette> = {
  bacteria: { light: "#dbeafe", dark: "#1d4ed8", zero: "#f1f5f9" },
  viruses: { light: "#fce7f3", dark: "#9d174d", zero: "#f1f5f9" },
  fungi: { light: "#fef3c7", dark: "#b45309", zero: "#f1f5f9" },
  all: { light: "#dcfce7", dark: "#15803d", zero: "#f1f5f9" },
};

export type ColorScale = (count: number) => string;

export function makeColorScale(maxCount: number, accent: AccentKey): ColorScale {
  const palette = accentPalettes[accent] ?? accentPalettes.all;
  if (maxCount <= 0) return () => palette.zero;
  const logMax = Math.log10(maxCount + 1);
  const interpolator = interpolateRgb(palette.light, palette.dark);
  return (count: number): string => {
    if (!Number.isFinite(count) || count <= 0) return palette.zero;
    return interpolator(Math.log10(count + 1) / logMax);
  };
}

// TopoJSON country name → API alias candidates. Only entries where the two
// disagree are listed; entries that match directly (e.g. "France", "Germany")
// fall through to the direct lookup. Sourced from world-atlas Natural Earth
// names paired against BV-BRC `isolation_country` values.
export const countryNameAliases: Record<string, readonly string[]> = {
  "United States of America": ["USA", "United States", "US"],
  Russia: ["Russian Federation"],
  "Czech Republic": ["Czechia"],
  "Republic of Serbia": ["Serbia"],
  "Republic of the Congo": ["Congo"],
  "Democratic Republic of the Congo": ["DR Congo", "Congo (Kinshasa)"],
  "Ivory Coast": ["Cote d'Ivoire", "Côte d'Ivoire"],
  "United Republic of Tanzania": ["Tanzania"],
  "Bosnia and Herz.": ["Bosnia and Herzegovina"],
  Macedonia: ["North Macedonia"],
  "South Korea": ["Korea, South", "Republic of Korea"],
  "North Korea": ["Korea, North", "Democratic People's Republic of Korea"],
  Laos: ["Lao People's Democratic Republic"],
  Syria: ["Syrian Arab Republic"],
  Iran: ["Iran (Islamic Republic of)"],
  "United Kingdom": ["UK", "Great Britain", "England", "Scotland", "Wales"],
  "Falkland Is.": ["Falkland Islands"],
  "Solomon Is.": ["Solomon Islands"],
  "Eq. Guinea": ["Equatorial Guinea"],
  "S. Sudan": ["South Sudan"],
  "Central African Rep.": ["Central African Republic"],
  "W. Sahara": ["Western Sahara"],
  "Dominican Rep.": ["Dominican Republic"],
  "N. Cyprus": ["Northern Cyprus"],
  Vietnam: ["Viet Nam"],
  Brunei: ["Brunei Darussalam"],
  Tanzania: ["United Republic of Tanzania"],
  "Cape Verde": ["Cabo Verde"],
  Burma: ["Myanmar"],
  Palestine: ["State of Palestine", "Palestinian Territory"],
  eSwatini: ["Swaziland", "Eswatini"],
  Macao: ["Macau"],
};

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

export function lookupCountryCount(
  topoName: string,
  countryData: Record<string, number>,
): number {
  if (Object.prototype.hasOwnProperty.call(countryData, topoName)) {
    const direct = countryData[topoName];
    if (direct > 0) return direct;
  }

  const aliases = countryNameAliases[topoName];
  if (aliases) {
    for (const alias of aliases) {
      const count = countryData[alias];
      if (typeof count === "number" && count > 0) return count;
    }
  }

  const normalized = normalize(topoName);
  for (const [key, value] of Object.entries(countryData)) {
    if (normalize(key) === normalized) return value;
  }

  return 0;
}

export function resolveCountryDataKey(
  topoName: string,
  countryData: Record<string, number>,
): string | null {
  if (Object.prototype.hasOwnProperty.call(countryData, topoName) && countryData[topoName] > 0) {
    return topoName;
  }
  const aliases = countryNameAliases[topoName];
  if (aliases) {
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(countryData, alias) && countryData[alias] > 0) {
        return alias;
      }
    }
  }
  const normalized = normalize(topoName);
  for (const key of Object.keys(countryData)) {
    if (normalize(key) === normalized) return key;
  }
  return null;
}

export const usaTopoNames = ["United States of America", "United States", "USA"] as const;

export function isUsaTopoName(name: string): boolean {
  return (usaTopoNames as readonly string[]).includes(name);
}
