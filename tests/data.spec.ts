import type { MddData } from "../db/mdd_model";
import type { CountryMDDStats } from "../db/country_stats_model";
import type { CountryRegionCode } from "../db/country_stats_model";
import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const TEST_PATH = join(__dirname, "../db/data/test.json");
const MDD_PATH = join(__dirname, "../db/data/mdd.json");
const COUNTRY_STATS_PATH = join(__dirname, "../db/data/test_country_stats.json");
const COUNTRY_REGION_CODE_PATH = join(__dirname, "../db/data/country_region_code.json");


function getSpeciesDataPath(): string {
  return existsSync(TEST_PATH) ? TEST_PATH : MDD_PATH;
}

function parseMDDJson(): MddData {
  const rawData = readFileSync(getSpeciesDataPath(), "utf8");
  return JSON.parse(rawData) as MddData;
}

function parseCountryStatsJson(): CountryMDDStats {
  const rawData = readFileSync(COUNTRY_STATS_PATH, "utf8");
  return JSON.parse(rawData) as CountryMDDStats;
}

function parseCountryRegionCodeJson(): CountryRegionCode {
  const rawData = readFileSync(COUNTRY_REGION_CODE_PATH, "utf8");
  return JSON.parse(rawData) as CountryRegionCode;
}

test("MDD data is valid JSON", () => {
  const jsonData = parseMDDJson();
  expect(jsonData).not.toBeNull();
  expect(jsonData.data.length).toBe(50);
});

test("Country stats data is valid JSON", () => {
  const jsonData = parseCountryStatsJson();
  expect(jsonData).not.toBeNull();
  expect(jsonData.totalCountries).toBe(243);
  expect(jsonData.countryData).toBeDefined();
  expect(Object.keys(jsonData.countryData).length).toBe(243);
});

test("Country region code data is valid JSON", () => {
  const jsonData = parseCountryRegionCodeJson();
  expect(jsonData).not.toBeNull();
  expect(jsonData.regionToCode).toBeDefined();
  expect(jsonData.codeToRegion).toBeDefined();
});
