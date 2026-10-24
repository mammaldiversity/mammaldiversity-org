/**
 * Utilities for constructing country-level mammal diversity statistics used by
 * multiple visualization components (e.g. choropleth maps, Google GeoChart, tables).
 *
 * Data source pipeline:
 *   db/data/country_stats.json  ->  getCountryData()  -> aggregation helpers here
 *
 * Lookup strategy:
 *   By ISO 3166-1 alpha-2 code — matched against the `ISO_A2` property in map features.
 */

import { getCountryData } from "../../db/country_stats";
import { getUnitedStatesData } from "../../db/united_states";

/**
 * Map of a country identifier to number of living species recorded.
 * The key is an ISO 3166-1 alpha-2 code (e.g. "US", "FR").
 */
export type CountryDiversityStats = Record<string, number>;

/**
 * Build a map keyed by ISO 3166-1 alpha-2 country code to total living species count.
 * Countries with zero living species are omitted to keep downstream legends / scales cleaner.
 *
 * @returns {CountryDiversityStats} A map where keys are ISO alpha-2 country codes and values are the total number of living species.
 */
function buildCountryDiversityStats(): CountryDiversityStats {
  const data = getCountryData();
  const countryDiversityMap: CountryDiversityStats = {};

  for (const countryCode in data) {
    const country = data[countryCode];
    const totalSpecies = country.totalLivingSpecies;
    if (totalSpecies > 0) {
      countryDiversityMap[countryCode] = totalSpecies;
    }
  }

  return countryDiversityMap;
}

/**
 * Build a map keyed by state abbreviation to total living species count.
 */
function buildUnitedStatesDiversityStats(): CountryDiversityStats {
  const data = getUnitedStatesData();
  const stateDiversityMap: CountryDiversityStats = {};

  for (const stateCode in data) {
    const state = data[stateCode];
    const totalSpecies = state.totalLivingSpecies;
    if (totalSpecies > 0) {
      stateDiversityMap[stateCode] = totalSpecies;
    }
  }

  return stateDiversityMap;
}

/**
 * Convenience helper that serializes the ISO code keyed diversity map to JSON.
 * Useful when embedding data as an attribute (e.g. in a custom element) to avoid
 * hydration timing issues.
 *
 * @returns {string} JSON string representation of country diversity stats keyed by ISO code.
 */
function getCountryDiversityJson(): string {
  return JSON.stringify(buildCountryDiversityStats());
}

/**
 * Parse a JSON string previously created by getCountryDiversityJson back into
 * a CountryDiversityStats object.
 *
 * @param {string} jsonString - JSON produced by getCountryDiversityJson (or equivalent shape)
 * @returns {CountryDiversityStats} CountryDiversityStats object
 */
function jsonToCountryDiversityMap(jsonString: string): CountryDiversityStats {
  return JSON.parse(jsonString);
}

export {
  buildCountryDiversityStats,
  buildUnitedStatesDiversityStats,
  getCountryDiversityJson,
  jsonToCountryDiversityMap,
};
