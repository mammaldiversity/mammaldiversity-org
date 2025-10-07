
import fs from "fs";
import { feature } from "topojson-client";
import type { CountryRegionCode } from "./country_stats_model";
// NOTE: Node's native ESM loader (used when Playwright runs tests in this repo because
// package.json sets "type": "module") now requires an explicit import assertion for
// JSON modules. Without `assert { type: "json" }`, Node throws:
//   TypeError: Module ".../countries-50m.json" needs an import attribute of "type: json"
// Vite/Astro's build pipeline handled this implicitly, but the raw Node runtime (as
// exercised by Playwright) does not. Adding the assertion fixes the test-time import.
// If TypeScript complains, ensure `resolveJsonModule` is enabled (included in Astro's
// strict tsconfig) or add it explicitly in tsconfig.

const COUNTRY_REGION_CODE_PATH = "./db/data/country_region_code.json";
const TOPO_JSON_PATH = "./db/data/countries-50m.json";

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
  "Cyprus": "Cyprus",
  "Czech Republic": "Czechia",
  "Dominican Republic": "Dominican Rep.",
  "Equatorial Guinea": "Eq. Guinea",
  "Eswatini": "eSwatini",
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
  "Pitcairn": "Pitcairn Is.",
  "Russian Federation": "Russia",
  "Saint Kitts and Nevis": "St. Kitts and Nevis",
  "Saint Vincent and the Grenadines": "St. Vin. and Gren.",
  "Saint Vincent & the Grenadines": "St. Vin. and Gren.",
  "São Tomé and Príncipe": "São Tomé and Principe",
  "Sao Tome and Principe": "São Tomé and Principe",
  "Somalia": "Somalia",
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

function parseCountryRegionCodeJson(): CountryRegionCode {
  const rawData = fs.readFileSync(COUNTRY_REGION_CODE_PATH, "utf8");
  const jsonData: CountryRegionCode = JSON.parse(rawData);
  return jsonData;
}

function getCountryRegionCode(name: string): string {
  const countryRegionCode = parseCountryRegionCodeJson();
  const code = countryRegionCode.regionToCode[name] || name;
  // the name will be coming from the map, so we need to reverse map it
    // to the standard region name first
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
 * @param code The country code (e.g., "US").
 * @returns The corresponding name used in the map data.
 */
function getCountryRegionName(code: string): string {
  // Assume parseCountryRegionCodeJson() is defined elsewhere and returns the parsed JSON content.
  const countryRegionCode = parseCountryRegionCodeJson();
  const regionName = countryRegionCode.codeToRegion[code] || code;

  // Apply the manual mapping to get the name that matches the map file.
  // If no specific mapping exists, return the original region name.
  return regionNameToMapName[regionName] || regionName;
}

function isFeatureCollection(
  input: any
): input is GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  GeoJSON.GeoJsonProperties
> {
  return (
    input &&
    input.type === "FeatureCollection" &&
    Array.isArray(input.features)
  );
}

function getWorldGeoJson(): GeoJSON.FeatureCollection {
  // Load and parse the world TopoJSON data
  const raw = fs.readFileSync(TOPO_JSON_PATH, "utf8");
  const topoJson = JSON.parse(raw);
  const worldCountriesResultUnknown = feature(
    topoJson as any,
    (topoJson as any).objects.countries
  ) as unknown;

  if (!isFeatureCollection(worldCountriesResultUnknown)) {
    throw new Error(
      "Expected 'countries' TopoJSON object to convert to a FeatureCollection."
    );
  }

  const worldGeoJson = worldCountriesResultUnknown as GeoJSON.FeatureCollection;
  return worldGeoJson;
}


export {
  isFeatureCollection,
  getCountryRegionCode,
  getCountryRegionName,
  getWorldGeoJson,
};