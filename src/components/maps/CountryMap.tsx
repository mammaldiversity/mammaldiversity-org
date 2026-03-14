import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import type { Feature, FeatureCollection, GeoJsonProperties } from "geojson";

interface CountryMapProps {
  stats: Record<string, number>;
  world: FeatureCollection;
  colors?: [string, string];
  projection?: string | Plot.ProjectionOptions;
  isoCodeMap?: Record<string, string>;
  valueKey?: string;
  fallbackKeys?: string[];
}

function useContainerWidth(
  ref: preact.RefObject<HTMLElement>,
  defaultWidth = 980,
) {
  const [width, setWidth] = useState<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    setWidth(ref.current.clientWidth || defaultWidth);

    const observer = new ResizeObserver((entries) => {
      // Cancel any pending frame before scheduling a new one to prevent stacked callbacks
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const entry = entries[0];
        if (entry?.contentRect.width > 0) setWidth(entry.contentRect.width);
      });
    });

    observer.observe(ref.current);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      observer.disconnect();
    };
  }, [ref, defaultWidth]);

  return width;
}

function normalizeMap(record: Record<string, unknown>): Map<string, unknown> {
  return new Map(
    Object.entries(record).map(([k, v]) => [
      k.toUpperCase(),
      typeof v === "string" ? v.toUpperCase() : v,
    ]),
  );
}

function resolveCountryIdentifier(
  props: GeoJsonProperties,
  valueKey: string,
  fallbackKeys: string[],
): string | undefined {
  if (!props) return undefined;
  const primary = props[valueKey];
  if (primary && typeof primary === "string") return primary.toUpperCase();
  for (const key of fallbackKeys) {
    const val = props[key];
    if (val && typeof val === "string") return val.toUpperCase();
  }
  return undefined;
}

interface FeatureDatum {
  count: number | undefined;
  iso2: string | undefined;
  id: string | undefined;
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

  const { normalizedStats, normalizedIsoMap } = useMemo(
    () => ({
      normalizedStats: normalizeMap(stats),
      normalizedIsoMap: normalizeMap(isoCodeMap),
    }),
    [stats, isoCodeMap],
  );

  /**
   * Pre-compute per-feature lookups into a WeakMap so Plot accessor functions
   * (fill, tip channels, href) each do a single O(1) lookup instead of
   * re-running resolveCountryIdentifier for every channel on every feature.
   * WeakMap keys are the Feature objects themselves, so GC can clean them up
   * if the world prop is replaced.
   */
  const featureCache = useMemo<WeakMap<Feature, FeatureDatum>>(() => {
    const cache = new WeakMap<Feature, FeatureDatum>();
    if (!world?.features?.length) return cache;

    for (const feature of world.features) {
      const countryId = resolveCountryIdentifier(
        feature.properties,
        valueKey,
        fallbackKeys,
      );

      if (!countryId) {
        cache.set(feature, {
          count: undefined,
          iso2: undefined,
          id: undefined,
        });
        continue;
      }

      let count = normalizedStats.get(countryId) as number | undefined;
      const mappedIso = normalizedIsoMap.get(countryId) as string | undefined;
      if (count === undefined && mappedIso) {
        count = normalizedStats.get(mappedIso) as number | undefined;
      }

      cache.set(feature, {
        count,
        id: countryId,
        iso2: mappedIso ?? (countryId.length === 2 ? countryId : undefined),
      });
    }

    return cache;
  }, [world, valueKey, fallbackKeys, normalizedStats, normalizedIsoMap]);

  useEffect(() => {
    if (!width || !world?.features?.length || !containerRef.current) return;

    const isDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    const plot = Plot.plot({
      projection,
      width,
      height: width * 0.52,
      style: { background: "transparent" },
      color: {
        type: "linear",
        range: colors,
        legend: true,
        label: "Species Diversity",
        // Neutral gray instead of a scale color to clearly distinguish no-data countries
        unknown: isDark ? "#374151" : "#d1d5db",
      },
      marks: [
        Plot.sphere({ stroke: "currentColor", strokeOpacity: 0.1 }),
        Plot.graticule({ stroke: "currentColor", strokeOpacity: 0.1 }),

        // Single geo pass — fill, tooltip, and href resolved via WeakMap cache
        Plot.geo(world, {
          fill: (d: Feature) => featureCache.get(d)?.count,
          stroke: "currentColor",
          strokeWidth: 0.5,
          strokeOpacity: 0.3,

          tip: {
            channels: {
              Country: (d: Feature) => d.properties?.name ?? "Unknown",
              "Species Count": (d: Feature) =>
                featureCache.get(d)?.count ?? "No data",
            },
            format: { fill: false, x: false, y: false },
            pointer: "xy",
            fill: isDark ? "#1f2937" : "#ffffff",
            stroke: "currentColor",
          },

          href: (d: Feature) => {
            const { iso2, id } = featureCache.get(d) ?? {};
            const code = iso2 ?? id;
            return code ? `/country/${code.toUpperCase()}` : undefined;
          },
        }),
      ],
    });

    const container = containerRef.current;
    container.innerHTML = "";
    container.append(plot);

    return () => plot.remove();
  }, [width, world, colors, projection, featureCache]);

  return <div ref={containerRef} className="w-full relative min-h-[300px]" />;
}
