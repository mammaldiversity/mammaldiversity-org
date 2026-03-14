/**
 * Country/map data utilities
 *
 * This module provides helpers to:
 * - Load region↔code lookup data from imported JSON (Vite-native, works in browser).
 * - Normalize country/region names between our canonical data and the map
 *   vendor's naming used in the TopoJSON file.
 * - Convert the world TopoJSON into a GeoJSON FeatureCollection for mapping.
 */
import { feature } from "topojson-client";
import type { CountryRegionCode } from "./country_stats_model";
import countryRegionCodeData from "../db/data/country_region_code.json";
import topoData from "../db/data/countries-50m.json";

/**
 * Manual alias map from our canonical region names → the names used in the
 * TopoJSON map file. This lets us resolve mismatches like
 * "Côte d'Ivoire" vs "Côte d'Ivoire" variants, or long formal country names
 * vs the abbreviated labels present in the map dataset.
 */
const regionNameToMapName: Record<string, string> = {
  "Andaman and Nicobar Islands": "India",
  "Antigua and Barbuda": "Antigua and Barb.",
  "Antigua & Barbuda": "Antigua and Barb.",
  "Bolivia (Plurinational State of)": "Bolivia",
  "Bosnia and Herzegovina": "Bosnia and Herz.",
  "Bosnia & Herzegovina": "Bosnia and Herz.",
  "British Indian Ocean Territory": "Br. Indian Ocean Ter.",
  "British Virgin Islands": "British Virgin Is.",
  "Brunei Darussalam": "Brunei",
  "Cape Verde": "Cabo Verde",
  "Cayman Islands": "Cayman Is.",
  "Central African Republic": "Central African Rep.",
  "Cook Islands": "Cook Is.",
  "Republic of the Congo": "Congo",
  "Democratic Republic of the Congo": "Dem. Rep. Congo",
  "Congo, Democratic Republic of the": "Dem. Rep. Congo",
  "Côte d'Ivoire": "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  Cyprus: "Cyprus",
  "Czech Republic": "Czechia",
  "Dominican Republic": "Dominican Rep.",
  "Equatorial Guinea": "Eq. Guinea",
  Eswatini: "eSwatini",
  "Galápagos Islands": "Ecuador",
  "Falkland Islands": "Falkland Is.",
  "Falkland Islands (Malvinas)": "Falkland Is.",
  "Faroe Islands": "Faeroe Is.",
  "French Polynesia": "Fr. Polynesia",
  "French Southern Territories": "Fr. S. Antarctic Lands",
  "French Southern and Antarctic Lands": "Fr. S. Antarctic Lands",
  "Holy See": "Vatican",
  "Iran (Islamic Republic of)": "Iran",
  "Korea (Democratic People's Republic of)": "North Korea",
  "Korea, Republic of": "South Korea",
  "Lao People's Democratic Republic": "Laos",
  "Marshall Islands": "Marshall Is.",
  "Micronesia (Federated States of)": "Micronesia",
  "North Macedonia": "Macedonia",
  "Northern Mariana Islands": "N. Mariana Is.",
  "Northern Marianas": "N. Mariana Is.",
  "Palestine, State of": "Palestine",
  Pitcairn: "Pitcairn Is.",
  "Russian Federation": "Russia",
  "Saint Kitts and Nevis": "St. Kitts and Nevis",
  "Saint Vincent and the Grenadines": "St. Vin. and Gren.",
  "Saint Vincent & the Grenadines": "St. Vin. and Gren.",
  "São Tomé and Príncipe": "São Tomé and Principe",
  "Sao Tome and Principe": "São Tomé and Principe",
  "Solomon Islands": "Solomon Is.",
  "South Georgia and the South Sandwich Islands": "S. Geo. and the Is.",
  "South Sudan": "S. Sudan",
  "Syrian Arab Republic": "Syria",
  "Taiwan, Province of China": "Taiwan",
  "Tanzania, United Republic of": "Tanzania",
  "Timor-Leste": "Timor-Leste",
  "Trinidad & Tobago": "Trinidad and Tobago",
  "Turks and Caicos Islands": "Turks and Caicos Is.",
  "Turks & Caicos Islands": "Turks and Caicos Is.",
  "United States": "United States of America",
  "Virgin Islands (U.S.)": "U.S. Virgin Is.",
  "United States Virgin Islands": "U.S. Virgin Is.",
  "Venezuela (Bolivarian Republic of)": "Venezuela",
  "Viet Nam": "Vietnam",
  "Wallis and Futuna": "Wallis and Futuna Is.",
  "Western Sahara": "W. Sahara",
  "Virgin Islands (British)": "British Virgin Is.",
};

const countryRegionCode = countryRegionCodeData as CountryRegionCode;

/**
 * Resolve a canonical region name to its code, accounting for map-name aliases.
 *
 * @param name Canonical region/country name (from our data or map label).
 * @returns The region code (e.g., "US"), or `name` when no code is found.
 */
function getCountryRegionCode(name: string): string {
  const code = countryRegionCode.regionToCode[name] || name;
  const standardName = Object.keys(regionNameToMapName).find(
    (key) => regionNameToMapName[key] === name
  );
  if (standardName) {
    return countryRegionCode.regionToCode[standardName] || code;
  }
  return code;
}

/**
 * Gets the region name for a given country code, resolving any mismatches
 * with the names used in the TopoJSON map file.
 *
 * @param code The country code (e.g., "US").
 * @returns The corresponding name used in the map data.
 */
function getCountryRegionName(code: string): string {
  const regionName = countryRegionCode.codeToRegion[code] || code;
  return regionNameToMapName[regionName] || regionName;
}

/**
 * Runtime type guard for a GeoJSON FeatureCollection.
 */
function isFeatureCollection(
  input: any
): input is GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> {
  return (
    input && input.type === "FeatureCollection" && Array.isArray(input.features)
  );
}

/**
 * Load the world TopoJSON and convert to a GeoJSON FeatureCollection.
 *
 * Error modes
 * - Throws if the converted result is not a FeatureCollection.
 */
function getWorldGeoJson(): GeoJSON.FeatureCollection {
  const worldCountriesResultUnknown = feature(
    topoData as any,
    (topoData as any).objects.countries
  ) as unknown;

  if (!isFeatureCollection(worldCountriesResultUnknown)) {
    throw new Error(
      "Expected 'countries' TopoJSON object to convert to a FeatureCollection."
    );
  }

  return worldCountriesResultUnknown as GeoJSON.FeatureCollection;
}

export {
  isFeatureCollection,
  getCountryRegionCode,
  getCountryRegionName,
  getWorldGeoJson,
};
