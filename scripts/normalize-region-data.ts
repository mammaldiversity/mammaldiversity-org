import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { CountryData, CountryMDDStats, CountryRegionCode } from "../db/country_stats_model";
import type { MddData, Taxonomy } from "../db/mdd_model";

const DATA_DIR = join(process.cwd(), "db", "data");
const COUNTRY_STATS_PATH = join(DATA_DIR, "country_stats.json");
const COUNTRY_REGION_CODE_PATH = join(DATA_DIR, "country_region_code.json");
const MDD_PATH = join(DATA_DIR, "mdd.json");

const REGION_CODE_OVERRIDES: Record<string, string> = {
  "Andaman and Nicobar Islands": "IN-ANI",
  Galapagos: "EC-GAL",
  "Galápagos Islands": "EC-GAL",
};

const CODE_REGION_OVERRIDES: Record<string, string> = {
  EC: "Ecuador",
  "EC-GAL": "Galápagos Islands",
  IN: "India",
  "IN-ANI": "Andaman and Nicobar Islands",
};

interface MutableCountryData {
  name: string;
  orders: Set<string>;
  families: Set<string>;
  genera: Set<string>;
  totalLivingSpecies: number;
  totalExtinctSpecies: number;
  speciesList: string[];
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data)}\n`);
}

function normalizeRegionCodes(regionCodes: CountryRegionCode): CountryRegionCode {
  const normalized: CountryRegionCode = {
    regionToCode: { ...regionCodes.regionToCode, ...REGION_CODE_OVERRIDES },
    codeToRegion: { ...regionCodes.codeToRegion, ...CODE_REGION_OVERRIDES },
  };
  return normalized;
}

function parseCountryDistribution(distribution: string): Array<{ name: string; predicted: boolean }> {
  if (distribution === "NA") {
    return [];
  }

  const entries = distribution
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 1 && entries[0].toLowerCase().includes("domesticated")) {
    return [];
  }

  return entries.map((entry) => {
    const predicted = entry.endsWith("?");
    return {
      name: entry.replace(/[?]+$/, "").trim(),
      predicted,
    };
  });
}

function createCountryData(name: string): MutableCountryData {
  return {
    name,
    orders: new Set(),
    families: new Set(),
    genera: new Set(),
    totalLivingSpecies: 0,
    totalExtinctSpecies: 0,
    speciesList: [],
  };
}

function addSpecies(country: MutableCountryData, speciesId: string, species: Taxonomy, predicted: boolean): void {
  country.orders.add(species.taxonOrder);
  country.families.add(species.family);
  country.genera.add(species.genus);

  if (species.extinct === 1) {
    country.totalExtinctSpecies += 1;
  } else {
    country.totalLivingSpecies += 1;
  }

  country.speciesList.push(predicted ? `${speciesId}?` : speciesId);
}

function finalizeCountryData(data: MutableCountryData): CountryData {
  return {
    name: data.name,
    totalOrders: data.orders.size,
    totalFamilies: data.families.size,
    totalGenera: data.genera.size,
    totalLivingSpecies: data.totalLivingSpecies,
    totalExtinctSpecies: data.totalExtinctSpecies,
    speciesList: data.speciesList,
  };
}

function regenerateCountryStats(
  existingStats: CountryMDDStats,
  regionCodes: CountryRegionCode,
  mdd: MddData,
): CountryMDDStats {
  const countryData: Record<string, MutableCountryData> = {};

  for (const record of mdd.data) {
    const species = record.speciesData;
    const speciesId = String(record.mddId);

    for (const { name, predicted } of parseCountryDistribution(species.countryDistribution || "")) {
      const code = regionCodes.regionToCode[name];
      if (!code) {
        throw new Error(`No country code for region "${name}" in species ${speciesId}`);
      }

      countryData[code] ??= createCountryData(regionCodes.codeToRegion[code] ?? code);
      addSpecies(countryData[code], speciesId, species, predicted);
    }
  }

  const finalizedCountryData: Record<string, CountryData> = {};
  for (const [code, data] of Object.entries(countryData)) {
    finalizedCountryData[code] = finalizeCountryData(data);
  }

  return {
    totalCountries: Object.keys(finalizedCountryData).length,
    domesticated: existingStats.domesticated,
    widespread: existingStats.widespread,
    countryData: finalizedCountryData,
  };
}

const regionCodes = normalizeRegionCodes(readJson<CountryRegionCode>(COUNTRY_REGION_CODE_PATH));
const existingStats = readJson<CountryMDDStats>(COUNTRY_STATS_PATH);
const mdd = readJson<MddData>(MDD_PATH);

writeJson(COUNTRY_REGION_CODE_PATH, regionCodes);
writeJson(COUNTRY_STATS_PATH, regenerateCountryStats(existingStats, regionCodes, mdd));
