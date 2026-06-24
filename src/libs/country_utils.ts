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

interface PointFeatureDefinition {
  code: string;
  name: string;
  longitude: number;
  latitude: number;
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

const MDD_POINT_FEATURES: PointFeatureDefinition[] = [
  { code: "AC", name: "Ascension", longitude: -14.36, latitude: -7.95 },
  { code: "AG", name: "Antigua and Barbuda", longitude: -61.8, latitude: 17.06 },
  { code: "AI", name: "Anguilla", longitude: -63.05, latitude: 18.22 },
  { code: "AS", name: "American Samoa", longitude: -170.7, latitude: -14.31 },
  { code: "AW", name: "Aruba", longitude: -69.97, latitude: 12.52 },
  { code: "AZO", name: "Azores", longitude: -28, latitude: 38.5 },
  { code: "BB", name: "Barbados", longitude: -59.54, latitude: 13.19 },
  { code: "BH", name: "Bahrain", longitude: 50.56, latitude: 26.07 },
  { code: "BL", name: "Saint Barthélemy", longitude: -62.84, latitude: 17.9 },
  { code: "BM", name: "Bermuda", longitude: -64.75, latitude: 32.31 },
  { code: "BON", name: "Bonaire", longitude: -68.28, latitude: 12.18 },
  { code: "BV", name: "Bouvet Island", longitude: 3.41, latitude: -54.42 },
  { code: "CK", name: "Cook Islands", longitude: -159.78, latitude: -21.24 },
  { code: "CNY", name: "Canary Islands", longitude: -15.6, latitude: 28.29 },
  { code: "COC", name: "Cocos Islands", longitude: 96.87, latitude: -12.16 },
  { code: "CV", name: "Cape Verde", longitude: -23.6, latitude: 15.12 },
  { code: "CW", name: "Curaçao", longitude: -68.99, latitude: 12.17 },
  { code: "CX", name: "Christmas Island", longitude: 105.63, latitude: -10.49 },
  { code: "DM", name: "Dominica", longitude: -61.37, latitude: 15.41 },
  { code: "EC-GAL", name: "Galápagos Islands", longitude: -90.6, latitude: -0.65 },
  { code: "FM", name: "Micronesia", longitude: 158.25, latitude: 6.92 },
  { code: "FO", name: "Faroe", longitude: -6.91, latitude: 61.89 },
  { code: "GD", name: "Grenada", longitude: -61.68, latitude: 12.12 },
  { code: "GP", name: "Guadeloupe", longitude: -61.55, latitude: 16.25 },
  { code: "GS", name: "South Georgia and the South Sandwich Islands", longitude: -36.75, latitude: -54.43 },
  { code: "GU", name: "Guam", longitude: 144.79, latitude: 13.44 },
  { code: "IN-ANI", name: "Andaman and Nicobar Islands", longitude: 92.75, latitude: 11.7 },
  { code: "KI", name: "Kiribati", longitude: 173, latitude: 1.42 },
  { code: "KM", name: "Comoros", longitude: 43.87, latitude: -11.88 },
  { code: "KN", name: "Saint Kitts and Nevis", longitude: -62.73, latitude: 17.34 },
  { code: "KY", name: "Cayman Islands", longitude: -81.25, latitude: 19.31 },
  { code: "LC", name: "Saint Lucia", longitude: -60.98, latitude: 13.91 },
  { code: "LI", name: "Liechtenstein", longitude: 9.55, latitude: 47.17 },
  { code: "MAD", name: "Madeira", longitude: -16.95, latitude: 32.76 },
  { code: "MH", name: "Marshall Islands", longitude: 171.18, latitude: 7.13 },
  { code: "MP", name: "Northern Marianas", longitude: 145.75, latitude: 15.1 },
  { code: "MQ", name: "Martinique", longitude: -61.02, latitude: 14.64 },
  { code: "MS", name: "Montserrat", longitude: -62.19, latitude: 16.74 },
  { code: "MT", name: "Malta", longitude: 14.38, latitude: 35.94 },
  { code: "MU", name: "Mauritius", longitude: 57.55, latitude: -20.25 },
  { code: "MV", name: "Maldives", longitude: 73.22, latitude: 3.2 },
  { code: "NF", name: "Norfolk Island", longitude: 167.95, latitude: -29.03 },
  { code: "NR", name: "Nauru", longitude: 166.93, latitude: -0.52 },
  { code: "NU", name: "Niue", longitude: -169.87, latitude: -19.05 },
  { code: "PEI", name: "Prince Edward Islands", longitude: 37.95, latitude: -46.77 },
  { code: "PF", name: "French Polynesia", longitude: -149.56, latitude: -17.68 },
  { code: "PN", name: "Pitcairn", longitude: -128.32, latitude: -24.37 },
  { code: "PW", name: "Palau", longitude: 134.58, latitude: 7.5 },
  { code: "RE", name: "Réunion", longitude: 55.53, latitude: -21.12 },
  { code: "SAB", name: "Saba", longitude: -63.24, latitude: 17.63 },
  { code: "SC", name: "Seychelles", longitude: 55.45, latitude: -4.68 },
  { code: "SG", name: "Singapore", longitude: 103.82, latitude: 1.35 },
  { code: "SH", name: "Saint Helena", longitude: -5.72, latitude: -15.96 },
  { code: "ST", name: "São Tomé and Príncipe", longitude: 6.61, latitude: 0.19 },
  { code: "STE", name: "Sint Eustatius", longitude: -62.98, latitude: 17.49 },
  { code: "SX", name: "Sint Maarten", longitude: -63.06, latitude: 18.04 },
  { code: "TC", name: "Turks and Caicos Islands", longitude: -71.8, latitude: 21.69 },
  { code: "TK", name: "Tokelau", longitude: -171.85, latitude: -9.2 },
  { code: "TO", name: "Tonga", longitude: -175.2, latitude: -21.18 },
  { code: "TV", name: "Tuvalu", longitude: 179.19, latitude: -8.52 },
  { code: "VC", name: "Saint Vincent and the Grenadines", longitude: -61.2, latitude: 13.25 },
  { code: "VG", name: "British Virgin Islands", longitude: -64.62, latitude: 18.42 },
  { code: "VI", name: "United States Virgin Islands", longitude: -64.9, latitude: 18.34 },
  { code: "WF", name: "Wallis and Futuna", longitude: -176.2, latitude: -13.77 },
  { code: "WS", name: "Samoa", longitude: -172.1, latitude: -13.75 },
  { code: "YT", name: "Mayotte", longitude: 45.17, latitude: -12.83 },
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

  const splitCountries = splitMddTerritories(
    result as GeoJSON.FeatureCollection,
  );
  return addMddPointFeatures(normalizeMddCountries(splitCountries));
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

function addMddPointFeatures(
  collection: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  const existingCodes = new Set(
    collection.features
      .map((feature) => feature.properties?.ISO_A2?.toString().toUpperCase())
      .filter((code): code is string => code !== undefined),
  );
  const pointFeatures = MDD_POINT_FEATURES.filter(
    (point) => !existingCodes.has(point.code),
  ).map(pointToFeature);

  return { ...collection, features: [...collection.features, ...pointFeatures] };
}

function pointToFeature(point: PointFeatureDefinition): GeometryFeature {
  return {
    type: "Feature",
    properties: {
      NAME: point.name,
      NAME_LONG: point.name,
      ISO_A2: point.code,
      LABEL_X: point.longitude,
      LABEL_Y: point.latitude,
      mdd_name: point.name,
      mdd_point: true,
    },
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude],
    },
  };
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
