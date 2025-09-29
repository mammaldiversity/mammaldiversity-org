/**
 * Utilities for constructing country-level mammal diversity statistics used by
 * multiple visualization components (e.g. choropleth maps, Google GeoChart, tables).
 *
 * Data source pipeline:
 *   db/data/country_stats.json  ->  getCountryData()  -> aggregation helpers here
 *
 * Two common lookup strategies are supported:
 *  1. By ISO 3166-1 alpha-2 code (default for internal linking & URLs)
 *  2. By map-friendly display name (some mapping libraries expect region names instead of codes)
 */
import { getCountryRegionCode, getCountryRegionName } from "../../db/country_data";
import { getCountryData } from "../../db/country_stats";

/**
 * Map of a country identifier to number of living species recorded.
 * The key is usually an ISO 3166-1 alpha-2 code (e.g. "US", "FR").
 */
export type CountryDiversityStats = Record<string, number>;

/**
 * Build a map keyed by ISO 3166-1 alpha-2 country code to total living species count.
 * Countries with zero living species are omitted to keep downstream legends / scales cleaner.
 *
 * @returns CountryDiversityStats keyed by ISO alpha-2 code.
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


/*
Build country name and ISO code mapping for countries present in the stats.
*/
function getMappingCodeFromStats(stats: CountryDiversityStats): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const name in stats) {
    const code = getCountryRegionCode(name);
    mapping[name] = code;
  }
  return mapping;
}

/**
 * Builds an object mapping country names to their total living species count.
 * This function now correctly handles country name mismatches.
 * @returns A record mapping the map-compatible country name to its species count.
 */
function buildDiversityStatsByCountryName(): CountryDiversityStats {
  // Assume getCountryData() is defined elsewhere and returns the species data.
  const data = getCountryData();
  const countryStats: CountryDiversityStats = {};

  for (const countryCode in data) {
    const country = data[countryCode];
    const totalSpecies = country.totalLivingSpecies;
    if (totalSpecies > 0) {
      // getCountryRegionName now handles the mapping to the correct map name
      const mapCountryName = getCountryRegionName(countryCode);
      countryStats[mapCountryName] = totalSpecies;
    }
  }

  return countryStats;
}


/**
 * Convenience helper that serializes the ISO code keyed diversity map to JSON.
 * Useful when embedding data as an attribute (e.g. in a custom element) to avoid
 * hydration timing issues.
 *
 * @returns JSON string representation of country diversity stats keyed by ISO code.
 */
function getCountryDiversityJson(): string {
  const countryDiversityMap = buildCountryDiversityStats();
  return JSON.stringify(countryDiversityMap);
}

/**
 * Parse a JSON string previously created by getCountryDiversityJson back into
 * a CountryDiversityStats object.
 *
 * @param jsonString - JSON produced by getCountryDiversityJson (or equivalent shape)
 * @returns CountryDiversityStats object
 */
function jsonToCountryDiversityMap(jsonString: string): CountryDiversityStats {
  return JSON.parse(jsonString);
}
/**
 * Exports:
 * - buildCountryDiversityStats: ISO code keyed stats map
 * - buildDiversityStatsByCountryName: Map-display-name keyed stats (alternative)
 * - getCountryDiversityJson / jsonToCountryDiversityMap: (de)serialization helpers
 */
export {
  buildCountryDiversityStats,
  getCountryDiversityJson,
  jsonToCountryDiversityMap,
  buildDiversityStatsByCountryName,
  getMappingCodeFromStats,
};
