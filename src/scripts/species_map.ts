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
    .map((country: string) => getCountryRegionName(country));

  // If known distribution contains one info
  // listed domesticated (case insensitive),
  // then we do not feed the list to the map.
  if (known.length === 1 && known[0].toLowerCase().includes("domesticated")) {
    return { known: [], predicted: [] };
  }

  let predicted = countryList
    .filter((country: string) => country.endsWith("?"))
    .map((country: string) => country.slice(0, -1)).map((country: string) => getCountryRegionName(country));

  return { known, predicted };
}

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

function countryListToJson(countryList: CountryDistribution): string {
  return JSON.stringify(countryList);
}

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
