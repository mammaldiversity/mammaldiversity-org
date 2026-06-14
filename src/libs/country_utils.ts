/**
 * Pure utility functions for country/map data.
 * No JSON imports — safe for Node ESM (Playwright).
 */
import { feature } from "topojson-client";

type GeometryFeature = GeoJSON.Feature<
  GeoJSON.Geometry,
  GeoJSON.GeoJsonProperties
>;

interface Bounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

interface TerritorySplit {
  parentIso2: string;
  bounds: Bounds;
  properties: GeoJSON.GeoJsonProperties;
}

interface FeatureOverride {
  iso2: string;
  properties: GeoJSON.GeoJsonProperties;
}

const MDD_FEATURE_OVERRIDES: FeatureOverride[] = [
  {
    iso2: "CN-TW",
    properties: {
      ISO_A2: "TW",
      mdd_name: "Taiwan",
    },
  },
];

const MDD_TERRITORY_SPLITS: TerritorySplit[] = [
  {
    parentIso2: "FR",
    bounds: { west: -55.5, east: -51, south: 1, north: 6 },
    properties: {
      NAME: "French Guiana",
      NAME_LONG: "French Guiana",
      ISO_A2: "GF",
      LABEL_X: -53.1258,
      LABEL_Y: 3.9339,
      mdd_name: "French Guiana",
    },
  },
];

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

  return normalizeMddCountries(splitMddTerritories(result as GeoJSON.FeatureCollection));
}

function splitMddTerritories(
  collection: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  const features = collection.features.flatMap((feature) =>
    splitFeatureByTerritory(feature),
  );
  return { ...collection, features };
}

function normalizeMddCountries(
  collection: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  const features = collection.features.map((feature) => {
    const override = MDD_FEATURE_OVERRIDES.find(
      (candidate) =>
        feature.properties?.ISO_A2?.toString().toUpperCase() === candidate.iso2,
    );

    if (!override) {
      return feature;
    }

    return {
      ...feature,
      properties: { ...feature.properties, ...override.properties },
    };
  });

  return { ...collection, features };
}

function splitFeatureByTerritory(feature: GeometryFeature): GeometryFeature[] {
  const splits = MDD_TERRITORY_SPLITS.filter(
    (split) =>
      feature.properties?.ISO_A2?.toString().toUpperCase() ===
      split.parentIso2,
  );

  if (splits.length === 0 || feature.geometry.type !== "MultiPolygon") {
    return [feature];
  }

  const parentPolygons: GeoJSON.Position[][][] = [];
  const territoryPolygons = new Map<TerritorySplit, GeoJSON.Position[][][]>();

  for (const polygon of feature.geometry.coordinates) {
    const split = splits.find((candidate) =>
      isPolygonWithinBounds(polygon, candidate.bounds),
    );
    if (split) {
      const polygons = territoryPolygons.get(split) ?? [];
      polygons.push(polygon);
      territoryPolygons.set(split, polygons);
    } else {
      parentPolygons.push(polygon);
    }
  }

  if (territoryPolygons.size === 0) {
    return [feature];
  }

  const splitFeatures: GeometryFeature[] = [];
  if (parentPolygons.length > 0) {
    splitFeatures.push({
      ...feature,
      geometry: polygonsToGeometry(parentPolygons),
    });
  }

  for (const [split, polygons] of territoryPolygons) {
    splitFeatures.push({
      type: "Feature",
      properties: { ...split.properties },
      geometry: polygonsToGeometry(polygons),
    });
  }

  return splitFeatures;
}

function polygonsToGeometry(
  polygons: GeoJSON.Position[][][],
): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  return polygons.length === 1
    ? { type: "Polygon", coordinates: polygons[0] }
    : { type: "MultiPolygon", coordinates: polygons };
}

function isPolygonWithinBounds(
  polygon: GeoJSON.Position[][],
  bounds: Bounds,
): boolean {
  const [longitude, latitude] = polygonBoundsCenter(polygon);
  return (
    longitude >= bounds.west &&
    longitude <= bounds.east &&
    latitude >= bounds.south &&
    latitude <= bounds.north
  );
}

function polygonBoundsCenter(
  polygon: GeoJSON.Position[][],
): [longitude: number, latitude: number] {
  let west = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  for (const ring of polygon) {
    for (const [longitude, latitude] of ring) {
      west = Math.min(west, longitude);
      east = Math.max(east, longitude);
      south = Math.min(south, latitude);
      north = Math.max(north, latitude);
    }
  }

  return [(west + east) / 2, (south + north) / 2];
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
