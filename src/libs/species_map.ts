import { feature } from "topojson-client";
import {
  isFeatureCollection
} from "../../db/country_utils";

const COUNTRY_MAP_URL =
  "https://raw.githubusercontent.com/mammaldiversity/mammaldiversity-org/refs/heads/main/db/data/countries-50m.json";

interface CountryDistribution {
  known: string[];
  predicted: string[];
}

/**
 * Splits a country distribution string into known and predicted distributions.
 * @param countryDistribution - A string containing country distributions, separated by "|".
 * @param getRegionName - Optional resolver to map country names to map labels. Defaults to identity.
 * @returns An object with 'known' and 'predicted' arrays of country names.
 */
function splitCountryDistribution(
  countryDistribution: string,
  getRegionName: (name: string) => string = (name) => name
): CountryDistribution {
  if (countryDistribution === "NA") {
    return { known: [], predicted: [] };
  }

  let countryList = countryDistribution.split("|");
  if (countryList.includes("Somalia")) {
    countryList.push("Somaliland");
  }

  const known = countryList
    .filter((country) => !country.endsWith("?"))
    .map((country) => getRegionName(country))
    .map((country) => country.toUpperCase());

  if (known.length === 1 && known[0].toLowerCase().includes("domesticated")) {
    return { known: [], predicted: [] };
  }

  const predicted = countryList
    .filter((country) => country.endsWith("?"))
    .map((country) => country.slice(0, -1))
    .map((country) => getRegionName(country))
    .map((country) => country.toUpperCase());

  return { known, predicted };
}

/**
 * Downloads country geographic data as a GeoJSON feature collection.
 */
async function downloadCountryGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  const response = await fetch(COUNTRY_MAP_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to download country geojson data: ${response.statusText}`
    );
  }
  const geojson = await response.json();
  const worldCountriesResultUnknown = feature(
    geojson as any,
    (geojson as any).objects.countries
  ) as unknown;

  if (!isFeatureCollection(worldCountriesResultUnknown)) {
    throw new Error(
      "Expected 'countries' TopoJSON object to convert to a FeatureCollection."
    );
  }

  return worldCountriesResultUnknown as GeoJSON.FeatureCollection;
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
  downloadCountryGeoJSON,
};
