import { feature } from "topojson-client";
import {
  getCountryRegionName,
  isFeatureCollection,
} from "../../db/country_data";

const COUNTRY_MAP_URL =
  "https://raw.githubusercontent.com/mammaldiversity/mammaldiversity-org/refs/heads/main/db/data/countries-50m.json";

interface CountryDistribution {
  known: string[];
  predicted: string[];
}

/**
 * Splits a country distribution string into known and predicted distributions.
 * @param {string} countryDistribution - A string containing country distributions, separated by "|".
 * @returns {CountryDistribution} An object with 'known' and 'predicted' arrays of country names.
 */
function splitCountryDistribution(
  countryDistribution: string
): CountryDistribution {
  // If countryDistribution is NA.
  // Return empty known and predicted lists.
  if (countryDistribution === "NA") {
    return { known: [], predicted: [] };
  }

  let countryList = countryDistribution.split("|");
  // If ends with "?", it is a predicted distribution
  let known = countryList
    .filter((country: string) => !country.endsWith("?"))
    .map((country: string) => getCountryRegionName(country))
    .map((country: string) => country.toUpperCase());

  // If known distribution contains one info
  // listed domesticated (case insensitive),
  // then we do not feed the list to the map.
  if (known.length === 1 && known[0].toLowerCase().includes("domesticated")) {
    return { known: [], predicted: [] };
  }

  let predicted = countryList
    .filter((country: string) => country.endsWith("?"))
    .map((country: string) => country.slice(0, -1))
    .map((country: string) => getCountryRegionName(country))
    .map((country: string) => country.toUpperCase());

  return { known, predicted };
}

/**
 * Downloads country geographic data as a GeoJSON feature collection.
 * @returns {Promise<GeoJSON.FeatureCollection>} A promise that resolves to a GeoJSON feature collection of countries.
 * @throws {Error} If the download fails or the data is not in the expected format.
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
  const worldGeoJson = worldCountriesResultUnknown as GeoJSON.FeatureCollection;
  return worldGeoJson;
}

/**
 * Converts a CountryDistribution object to a JSON string.
 * @param {CountryDistribution} countryList - The CountryDistribution object to convert.
 * @returns {string} A JSON string representation of the country distribution.
 */
function countryListToJson(countryList: CountryDistribution): string {
  return JSON.stringify(countryList);
}

/**
 * Converts a JSON string to a CountryDistribution object.
 * @param {string} jsonString - The JSON string to convert.
 * @returns {CountryDistribution} The CountryDistribution object.
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
