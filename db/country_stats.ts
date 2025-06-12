// Module to handle country statistic generation and retrieval
import fs from "fs";

import type {
  CountryData,
  CountryMDDStats,
  CountryRegionCode,
} from "./country_stats_model";

const COUNTRY_STATS_PATH = "./db/data/country_stats.json";
const COUNTRY_REGION_CODE_PATH = "./db/data/country_region_code.json";

function parseCountryStatsJson(): CountryMDDStats {
  const rawData = fs.readFileSync(COUNTRY_STATS_PATH, "utf8");
  const jsonData: CountryMDDStats = JSON.parse(rawData);
  return jsonData;
}

function getCountryData(): Record<string, CountryData> {
  const countryStats = parseCountryStatsJson();
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

// Parses the species list from a CountryData object
// The predicted distribution suffix '?' is removed from species IDs
// We keep records of predicted as true.
function parseCountrySpeciesList(data: CountryData): Record<number, boolean> {
  const speciesList: Record<string, boolean> = {};
  if (!data.speciesList || data.speciesList.length === 0) {
    return speciesList;
  }
  data.speciesList.forEach((speciesId) => {
    const cleanId = speciesId.replace(/\?$/, "").replace(/ and /g, " & "); // Remove trailing '?' and replace ' and ' with ' & '
    speciesList[cleanId] = speciesId.endsWith("?"); // Record if it was predicted
  });
  return speciesList;
}

function parseCountryRegionCodeJson(): CountryRegionCode {
  const rawData = fs.readFileSync(COUNTRY_REGION_CODE_PATH, "utf8");
  const jsonData: CountryRegionCode = JSON.parse(rawData);
  return jsonData;
}

function getCountryRegionCode(name: string): string {
  const countryRegionCode = parseCountryRegionCodeJson();
  return countryRegionCode.regionToCode[name] || name;
}

function getCountryRegionName(code: string): string {
  const countryRegionCode = parseCountryRegionCodeJson();
  return countryRegionCode.codeToRegion[code] || code;
}

export {
  getCountryRegionCode,
  getCountryRegionName,
  getDataByCountryCode,
  getCountryData,
  parseCountrySpeciesList,
};
