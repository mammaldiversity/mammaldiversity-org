/**
 * Vite-only entry point for country data.
 * Do NOT import from Playwright tests — use country_utils.ts directly.
 */
import topoData from "./data/countries-50m.json";
import {
  convertTopoToGeoJson,
  isFeatureCollection,
} from "./country_utils";

const getWorldGeoJson = (): GeoJSON.FeatureCollection =>
  convertTopoToGeoJson(topoData);

export {
  isFeatureCollection,
  getWorldGeoJson,
};
