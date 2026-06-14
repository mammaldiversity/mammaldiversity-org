import type { CountryRegionCode } from "../../db/country_stats_model";
import countryRegionCodeRaw from "../../db/data/country_region_code.json" with {
  type: "json",
};

interface CountryDistribution {
  known: string[];
  predicted: string[];
}

const countryRegionCode =
  countryRegionCodeRaw as unknown as CountryRegionCode;

/**
 * Maps MDD distribution country names to their corresponding mdd_name values
 * in the map features, for cases where they differ.
 */
const MDD_TO_MAP_NAME: Record<string, string> = {
  "United States": "United States of America",
};

const MDD_VISUAL_REGION_CODES: Record<string, string> = {
  "Andaman and Nicobar Islands": "IN-ANI",
  Galapagos: "EC-GAL",
  "Galápagos Islands": "EC-GAL",
};

const normalizeCountryName = (name: string): string =>
  MDD_TO_MAP_NAME[name] ?? name;

function countryNameToCode(name: string): string | undefined {
  const trimmedName = name.trim();
  return (
    MDD_VISUAL_REGION_CODES[trimmedName] ??
    countryRegionCode.regionToCode[trimmedName] ??
    countryRegionCode.regionToCode[normalizeCountryName(trimmedName)]
  );
}

function countryNamesToCodes(names: string[]): Set<string> {
  return new Set(
    names
      .map((name) => countryNameToCode(name))
      .filter((code): code is string => code !== undefined),
  );
}

/**
 * Splits a country distribution string into known and predicted distributions.
 * @param countryDistribution - A string containing country distributions, separated by "|".
 * @returns An object with 'known' and 'predicted' arrays of mdd_name-compatible country names.
 */
function splitCountryDistribution(
  countryDistribution: string,
): CountryDistribution {
  if (countryDistribution === "NA") {
    return { known: [], predicted: [] };
  }

  const countryList = countryDistribution.split("|");

  const known = countryList
    .filter((country) => !country.endsWith("?"))
    .map((country) => normalizeCountryName(country.trim()));

  if (known.length === 1 && known[0].toLowerCase().includes("domesticated")) {
    return { known: [], predicted: [] };
  }

  const predicted = countryList
    .filter((country) => country.endsWith("?"))
    .map((country) => normalizeCountryName(country.slice(0, -1).trim()));

  return { known, predicted };
}

/**
 * Converts a CountryDistribution object to a JSON string.
 */
function countryListToJson(countryList: CountryDistribution): string {
  return JSON.stringify(countryList);
}

/**
 * Converts a JSON string to a CountryDistribution object.
 */
function jsonToCountryList(jsonString: string): CountryDistribution {
  return JSON.parse(jsonString);
}

export type { CountryDistribution };
export {
  splitCountryDistribution,
  countryListToJson,
  jsonToCountryList,
  countryNameToCode,
  countryNamesToCodes,
};
