/**
 * Pure utility functions for country/map data.
 * No JSON imports — safe for Node ESM (Playwright).
 */
import { feature } from "topojson-client";

/**
 * Checks if the input is a GeoJSON FeatureCollection.
 *
 * @param input - The input to check.
 * @returns True if the input is a GeoJSON FeatureCollection, false otherwise.
 */
export function isFeatureCollection(
  input: any,
): input is GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  GeoJSON.GeoJsonProperties
> {
  return (
    input && input.type === "FeatureCollection" && Array.isArray(input.features)
  );
}

/**
 * Converts TopoJSON data to GeoJSON FeatureCollection.
 *
 * @param topoData - The TopoJSON data to convert.
 * @returns The converted GeoJSON FeatureCollection.
 */
export function convertTopoToGeoJson(topoData: any): GeoJSON.FeatureCollection {
  const result = feature(topoData, topoData.objects.countries_mdd) as unknown;

  if (!isFeatureCollection(result)) {
    throw new Error(
      "Expected 'countries_mdd' TopoJSON object to convert to a FeatureCollection.",
    );
  }

  return result as GeoJSON.FeatureCollection;
}

/**
 * Converts US TopoJSON data to GeoJSON FeatureCollection.
 *
 * @param topoData - The US TopoJSON data to convert.
 * @returns The converted GeoJSON FeatureCollection.
 */
export function convertUSTopoToGeoJson(
  topoData: any,
): GeoJSON.FeatureCollection {
  const topoObj = topoData.objects.states || topoData.objects.data;
  const result = feature(topoData, topoObj) as unknown;

  if (!isFeatureCollection(result)) {
    throw new Error(
      "Expected 'states' or 'data' TopoJSON object to convert to a FeatureCollection.",
    );
  }

  return result as GeoJSON.FeatureCollection;
}
