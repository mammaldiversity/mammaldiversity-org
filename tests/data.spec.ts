import type { MddData } from "../db/mdd_model";
import { test, expect } from "@playwright/test";
import fs from "fs";
import type { CountryMDDStats } from "../db/country_stats_model";

const TEST_PATH = "./db/data/test.json";
const MDD_PATH = "./db/data/mdd.json";
const COUNTRY_STATS_PATH = "./db/data/country_stats.json";

function parseMDDJson(): MddData {
  const test_path = getSpeciesDataPath();
  const rawData = fs.readFileSync(test_path, "utf8");
  const jsonData: MddData = JSON.parse(rawData);
  return jsonData;
}

function parseCountryStatsJson(): CountryMDDStats {
  const rawData = fs.readFileSync(COUNTRY_STATS_PATH, "utf8");
  const jsonData: CountryMDDStats = JSON.parse(rawData);
  return jsonData;
}

function getSpeciesDataPath(): string {
  // check if the TEST_PATH exists and use it, otherwise use MDD_PATH
  if (fs.existsSync(TEST_PATH)) {
    return TEST_PATH;
  } else {
    return MDD_PATH;
  }
}

test("MDD data is valid JSON", () => {
  const jsonData = parseMDDJson();
  expect(jsonData).not.toBeNull();
  expect(jsonData.data.length).toBe(50);
});

// Test country stats data
test("Country stats data is valid JSON", () => {
  const jsonData = parseCountryStatsJson();
  expect(jsonData).not.toBeNull();
  expect(jsonData.totalCountries).toBe(243);
  expect(jsonData.countryData).toBeDefined();
  expect(Object.keys(jsonData.countryData).length).toBe(243);
});
