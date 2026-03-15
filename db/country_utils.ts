/**
 * Pure utility functions for country/map data.
 * No JSON imports — safe for Node ESM (Playwright).
 */
import { feature } from "topojson-client";

export function isFeatureCollection(
    input: any
): input is GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> {
    return (
        input && input.type === "FeatureCollection" && Array.isArray(input.features)
    );
}

export function convertTopoToGeoJson(topoData: any): GeoJSON.FeatureCollection {
    const result = feature(
        topoData,
        topoData.objects.countries_mdd
    ) as unknown;

    if (!isFeatureCollection(result)) {
        throw new Error(
            "Expected 'countries_mdd' TopoJSON object to convert to a FeatureCollection."
        );
    }

    return result as GeoJSON.FeatureCollection;
}
