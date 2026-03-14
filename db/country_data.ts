/**
 * Vite-only entry point for country data.
 * Do NOT import from Playwright tests — use country_utils.ts directly.
 */
import type { CountryRegionCode } from "./country_stats_model";
import countryRegionCodeData from "../db/data/country_region_code.json";
import topoData from "../db/data/countries-50m.json";
import {
  resolveCountryRegionCode,
  resolveCountryRegionName,
  convertTopoToGeoJson,
  isFeatureCollection,
} from "./country_utils";

const countryRegionCode = countryRegionCodeData as CountryRegionCode;

const getCountryRegionCode = (name: string) =>
  resolveCountryRegionCode(name, countryRegionCode);

const getCountryRegionName = (code: string) =>
  resolveCountryRegionName(code, countryRegionCode);

const getWorldGeoJson = () => convertTopoToGeoJson(topoData);

export {
  isFeatureCollection,
  getCountryRegionCode,
  getCountryRegionName,
  getWorldGeoJson,
};
