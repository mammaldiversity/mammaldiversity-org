import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import type { FeatureCollection, GeoJsonProperties } from "geojson";

// --- Types ---

interface CountryMapProps {
  /** Map of ISO 3166-1 alpha-2 codes to species count. */
  stats: Record<string, number>;
  /** GeoJSON features for the world (countries layer). */
  world: FeatureCollection;
  /** Two-color gradient [low, high] for linear scale. */
  colors?: [string, string];
  /** Projection name or options; defaults to 'equal-earth'. */
  projection?: string | Plot.ProjectionOptions;
  /** Mapping from alternative identifiers (ISO3 codes, names) to ISO2 codes. */
  isoCodeMap?: Record<string, string>;
  /** Primary feature property to inspect first when resolving a code. */
  valueKey?: string;
  /** Fallback feature property names to attempt if the primary fails. */
  fallbackKeys?: string[];
}

// --- Hooks ---

/**
 * reliable hook to measure the width of a container.
 * Uses ResizeObserver with a requestAnimationFrame debounce.
 */
function useContainerWidth(
  ref: preact.RefObject<HTMLElement>,
  defaultWidth = 980
) {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Set initial width immediately to avoid layout shift if possible
    setWidth(ref.current.clientWidth || defaultWidth);

    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to debounce and avoid "ResizeObserver loop limit exceeded"
      requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) return;
        const entry = entries[0];
        // Use contentRect for precise content box measurement
        if (entry.contentRect.width > 0) {
          setWidth(entry.contentRect.width);
        }
      });
    });

    resizeObserver.observe(ref.current);

    return () => resizeObserver.disconnect();
  }, [ref, defaultWidth]);

  return width;
}

// --- Helpers ---

/**
 * Helper to normalize keys to uppercase for case-insensitive matching.
 */
function normalizeMap(record: Record<string, any>): Map<string, any> {
  return new Map(
    Object.entries(record).map(([k, v]) => [
      k.toUpperCase(),
      typeof v === "string" ? v.toUpperCase() : v,
    ])
  );
}

/**
 * logic to extract a valid country identifier from GeoJSON properties.
 */
function resolveCountryIdentifier(
  props: GeoJsonProperties,
  valueKey: string,
  fallbackKeys: string[]
): string | undefined {
  if (!props) return undefined;

  // Check primary key
  const primary = props[valueKey];
  if (primary && typeof primary === "string") return primary.toUpperCase();

  // Check fallbacks
  for (const key of fallbackKeys) {
    const val = props[key];
    if (val && typeof val === "string") return val.toUpperCase();
  }

  return undefined;
}

export default function CountryMap({
  stats,
  world,
  colors = ["#FFEB00", "#117554"],
  projection = "equal-earth",
  isoCodeMap = {},
  valueKey = "iso_a2",
  fallbackKeys = ["iso_a3", "id", "name"],
}: CountryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);

  // 1. Memoize data normalization to avoid recalculation on every render
  const { normalizedStats, normalizedIsoMap } = useMemo(() => {
    return {
      normalizedStats: normalizeMap(stats),
      normalizedIsoMap: normalizeMap(isoCodeMap),
    };
  }, [stats, isoCodeMap]);

  // 2. Main Plot Effect
  useEffect(() => {
    // Early return if data or dimensions are missing
    if (!width || !world?.features?.length || !containerRef.current) return;

    const isDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    // Helper to get data for a specific feature
    const getFeatureData = (featureProps: GeoJsonProperties) => {
      const countryId = resolveCountryIdentifier(
        featureProps,
        valueKey,
        fallbackKeys
      );
      // If we found an ID, try to get the stat using the ID directly, or map it via isoCodeMap
      // Logic: ID -> Stat OR ID -> IsoMap -> Stat
      if (!countryId)
        return { id: undefined, count: undefined, iso2: undefined };

      // Try direct match
      let count = normalizedStats.get(countryId);

      // Try mapping via isoCodeMap (e.g. USA -> US -> count)
      const mappedIso = normalizedIsoMap.get(countryId);
      if (count === undefined && mappedIso) {
        count = normalizedStats.get(mappedIso);
      }

      return {
        id: countryId,
        count,
        iso2: mappedIso || (countryId.length === 2 ? countryId : undefined),
      };
    };

    const plot = Plot.plot({
      projection,
      width,
      height: width * 0.52, // Keep aspect ratio roughly consistent for world maps
      style: {
        background: "transparent",
      },
      color: {
        type: "linear",
        range: colors,
        legend: true,
        label: "Species Diversity",
        unknown: "#FFEB00", // Color for countries with no data
      },
      marks: [
        // 1. Base layer (Sphere/Graticule)
        Plot.sphere({ stroke: "currentColor", strokeOpacity: 0.1 }),
        Plot.graticule({ stroke: "currentColor", strokeOpacity: 0.1 }),

        // 2. Data Layer (Choropleth)
        Plot.geo(world, {
          fill: (d) => getFeatureData(d.properties).count,

          // Tooltip Configuration
          tip: {
            channels: {
              "": (d) => d.properties?.name || "Unknown",
              "Species Count": (d) => getFeatureData(d.properties).count,
            },
            format: {
              fill: false, // Hide the raw fill value from tooltip
              x: false,
              y: false, // Hide coordinates
            },
            pointer: "xy", // Anchor to cursor
            fill: isDark ? "#1f2937" : "#ffffff", // Tooltip background
            stroke: "currentColor",
          },

          // Navigation Link
          href: (d) => {
            const { iso2, id } = getFeatureData(d.properties);
            // Prefer ISO2 for URLs, fallback to ID if it looks like a code
            const urlCode = iso2 || id;
            return urlCode ? `/country/${urlCode.toLowerCase()}` : undefined;
          },

          // Styling
          stroke: "currentColor",
          strokeWidth: 0.5,
          strokeOpacity: 0.3,
        }),
      ],
    });

    // Clean append
    const container = containerRef.current;
    container.innerHTML = "";
    container.append(plot);

    return () => plot.remove();
  }, [
    width,
    world,
    colors,
    projection,
    valueKey,
    fallbackKeys,
    normalizedStats,
    normalizedIsoMap,
  ]);

  return <div ref={containerRef} className="w-full relative min-h-[300px]" />;
}
