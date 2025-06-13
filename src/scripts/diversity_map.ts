import { getCountryData, getCountryRegionName } from "../../db/country_stats";

function buildCountryDiversityStats(): Record<string, number> {
  const data = getCountryData();
  const countryDiversityMap: Record<string, number> = {};

  for (const countryCode in data) {
    const country = data[countryCode];
    const totalSpecies = country.totalLivingSpecies;
    if (totalSpecies > 0) {
      countryDiversityMap[countryCode] = totalSpecies;
    }
  }

  return countryDiversityMap;
}

function getCountryDiversityJson(): string {
  const countryDiversityMap = buildCountryDiversityStats();
  return JSON.stringify(countryDiversityMap);
}

function jsonToCountryDiversityMap(jsonString: string): Record<string, number> {
  return JSON.parse(jsonString);
}

export { getCountryDiversityJson, jsonToCountryDiversityMap };
