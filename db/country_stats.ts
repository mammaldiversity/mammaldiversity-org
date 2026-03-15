import type { CountryData, CountryMDDStats } from "./country_stats_model";
import countryStatsRaw from "./data/country_stats.json";

function getCountryData(): Record<string, CountryData> {
  const countryStats = countryStatsRaw as unknown as CountryMDDStats;
  return countryStats.countryData || {};
}

function getDataByCountryCode(code: string): CountryData {
  const countryData = getCountryData();
  return (
    countryData[code] || {
      code: code,
      totalOrders: 0,
      totalFamilies: 0,
      totalGenera: 0,
      totalLivingSpecies: 0,
      totalExtinctSpecies: 0,
      speciesList: [],
    }
  );
}

function parseCountrySpeciesList(data: CountryData): Record<number, boolean> {
  const speciesList: Record<string, boolean> = {};
  if (!data.speciesList || data.speciesList.length === 0) {
    return speciesList;
  }
  data.speciesList.forEach((speciesId) => {
    const cleanId = speciesId.replace(/\?$/, "");
    speciesList[cleanId] = speciesId.endsWith("?");
  });
  return speciesList;
}

export { getDataByCountryCode, getCountryData, parseCountrySpeciesList };
