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
  'Bolivia': 'Bolivia, Plurinational State of',
  'British Virgin Islands': 'Virgin Islands (British)',
  'Brunei': 'Brunei Darussalam',
  'Cape Verde': 'Cabo Verde',
  'Cocos Islands': 'Cocos (Keeling) Islands',
  'Cote d\'Ivoire': 'Côte d\'Ivoire',
  'Czech Republic': 'Czechia',
  'Democratic Republic of the Congo': 'Congo, Democratic Republic of the',
  'East Timor': 'Timor-Leste',
  'Falkland Islands': 'Falkland Islands (Malvinas)',
  'Faroe': 'Faroe Islands',
  'French Southern and Antarctic Lands': 'French Southern Territories',
  'Iran': 'Iran, Islamic Republic of',
  'Laos': 'Lao People\'s Democratic Republic',
  'Micronesia': 'Micronesia, Federated States of',
  'Moldova': 'Moldova, Republic of',
  'Netherlands': 'Netherlands, Kingdom of the',
  'North Korea': 'Korea, Democratic People\'s Republic of',
  'Northern Marianas': 'Northern Mariana Islands',
  'Palestine': 'Palestine, State of',
  'Republic of the Congo': 'Congo',
  'Russia': 'Russian Federation',
  'Saint Helena': 'Saint Helena, Ascension and Tristan da Cunha',
  'Saint Martin': 'Saint Martin (French part)',
  'Sint Maarten': 'Sint Maarten (Dutch part)',
  'South Korea': 'Korea, Republic of',
  'Syria': 'Syrian Arab Republic',
  'São Tomé and Príncipe': 'Sao Tome and Principe',
  'Taiwan': 'Taiwan, Province of China',
  'Tanzania': 'Tanzania, United Republic of',
  'Turkey': 'Türkiye',
  'United Kingdom': 'United Kingdom of Great Britain and Northern Ireland',
  'United States': 'United States of America',
  'United States Virgin Islands': 'Virgin Islands (U.S.)',
  'Venezuela': 'Venezuela, Bolivarian Republic of',
  'Vietnam': 'Viet Nam',
  'Somaliland': 'Somalia',
  'Ascension': 'United Kingdom of Great Britain and Northern Ireland',
  'Antigua and Barbuda': 'Antigua and Barbuda',
  'Anguilla': 'United Kingdom of Great Britain and Northern Ireland',
  'American Samoa': 'United States of America',
  'Aruba': 'Netherlands, Kingdom of the',
  'Azores': 'Portugal',
  'Barbados': 'Barbados',
  'Bahrain': 'Bahrain',
  'Saint Barthélemy': 'France',
  'Bermuda': 'United Kingdom of Great Britain and Northern Ireland',
  'Bonaire': 'Netherlands, Kingdom of the',
  'Bouvet Island': 'Norway',
  'Cook Islands': 'New Zealand',
  'Canary Islands': 'Spain',
  'Curaçao': 'Netherlands, Kingdom of the',
  'Christmas Island': 'Australia',
  'Dominica': 'Dominica',
  'Grenada': 'Grenada',
  'French Guiana': 'France',
  'Guadeloupe': 'France',
  'South Georgia and the South Sandwich Islands': 'United Kingdom of Great Britain and Northern Ireland',
  'Guam': 'United States of America',
  'Kiribati': 'Kiribati',
  'Comoros': 'Comoros',
  'Saint Kitts and Nevis': 'Saint Kitts and Nevis',
  'Cayman Islands': 'United Kingdom of Great Britain and Northern Ireland',
  'Saint Lucia': 'Saint Lucia',
  'Liechtenstein': 'Liechtenstein',
  'Madeira': 'Portugal',
  'Marshall Islands': 'Marshall Islands',
  'Martinique': 'France',
  'Montserrat': 'United Kingdom of Great Britain and Northern Ireland',
  'Malta': 'Malta',
  'Mauritius': 'Mauritius',
  'Maldives': 'Maldives',
  'Norfolk Island': 'Australia',
  'Nauru': 'Nauru',
  'Niue': 'New Zealand',
  'Prince Edward Islands': 'South Africa',
  'French Polynesia': 'France',
  'Pitcairn': 'United Kingdom of Great Britain and Northern Ireland',
  'Palau': 'Palau',
  'Réunion': 'France',
  'Saba': 'Netherlands, Kingdom of the',
  'Seychelles': 'Seychelles',
  'Singapore': 'Singapore',
  'Sint Eustatius': 'Netherlands, Kingdom of the',
  'Turks and Caicos Islands': 'United Kingdom of Great Britain and Northern Ireland',
  'Tokelau': 'New Zealand',
  'Tonga': 'Tonga',
  'Tuvalu': 'Tuvalu',
  'Saint Vincent and the Grenadines': 'Saint Vincent and the Grenadines',
  'Wallis and Futuna': 'France',
  'Samoa': 'Samoa',
  'Mayotte': 'France'
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
