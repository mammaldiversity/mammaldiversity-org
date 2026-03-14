/**
 * Pure utility functions for country/map data.
 * No JSON imports — safe for Node ESM (Playwright).
 */
import { feature } from "topojson-client";

export interface CountryRegionCode {
    regionToCode: Record<string, string>;
    codeToRegion: Record<string, string>;
}

export const regionNameToMapName: Record<string, string> = {
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

export function isFeatureCollection(
    input: any
): input is GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> {
    return (
        input && input.type === "FeatureCollection" && Array.isArray(input.features)
    );
}

export function resolveCountryRegionCode(
    name: string,
    countryRegionCode: CountryRegionCode
): string {
    const code = countryRegionCode.regionToCode[name] || name;
    const standardName = Object.keys(regionNameToMapName).find(
        (key) => regionNameToMapName[key] === name
    );
    if (standardName) {
        return countryRegionCode.regionToCode[standardName] || code;
    }
    return code;
}

export function resolveCountryRegionName(
    code: string,
    countryRegionCode: CountryRegionCode
): string {
    const regionName = countryRegionCode.codeToRegion[code] || code;
    return regionNameToMapName[regionName] || regionName;
}

export function convertTopoToGeoJson(topoData: any): GeoJSON.FeatureCollection {
    const result = feature(
        topoData,
        topoData.objects.countries
    ) as unknown;

    if (!isFeatureCollection(result)) {
        throw new Error(
            "Expected 'countries' TopoJSON object to convert to a FeatureCollection."
        );
    }

    return result as GeoJSON.FeatureCollection;
}
