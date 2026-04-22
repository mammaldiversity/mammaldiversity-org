import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import type { Feature, FeatureCollection } from "geojson";
import { convertUSTopoToGeoJson } from "../../libs/country_utils";
import { stateNameToCode } from "../../libs/state_map";

const US_MAP_URL = "/map/states-albers-10m.json";

interface UnitedStatesMapProps {
  stats: Record<string, number>;
  colors?: [string, string];
  projection?: string | Plot.ProjectionOptions;
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

interface FeatureDatum {
  count: number | undefined;
  state: string | undefined;
}

let cachedUSMap: FeatureCollection | null = null;

export default function UnitedStatesMap({
  stats,
  colors = ["#FFEB00", "#117554"],
  projection = "identity",
}: UnitedStatesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);
  const [usMap, setUSMap] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    if (cachedUSMap) {
      setUSMap(cachedUSMap);
      return;
    }

    let cancelled = false;

    async function loadMap() {
      try {
        const response = await fetch(US_MAP_URL);
        if (!response.ok)
          throw new Error(`Failed to fetch map: ${response.statusText}`);
        const topoData = await response.json();
        if (!cancelled) {
          cachedUSMap = convertUSTopoToGeoJson(topoData);
          setUSMap(cachedUSMap);
        }
      } catch (err) {
        console.error("Failed to load US map:", err);
      }
    }

    loadMap();

    return () => {
      cancelled = true;
    };
  }, []);

  const featureCache = useMemo<WeakMap<Feature, FeatureDatum>>(() => {
    const cache = new WeakMap<Feature, FeatureDatum>();
    if (!usMap?.features?.length) return cache;

    for (const feature of usMap.features) {
      const stateName = feature.properties?.name as string | undefined;
      const stateId = stateName ? stateNameToCode[stateName] : undefined;
      const count = stateId
        ? (stats[stateId] as number | undefined)
        : undefined;
      cache.set(feature, { count, state: stateId });
    }

    return cache;
  }, [usMap, stats]);

  useEffect(() => {
    if (!width || !usMap?.features?.length || !containerRef.current) return;

    const isDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    const plot = Plot.plot({
      projection:
        typeof projection === "string"
          ? { type: projection as any, reflectY: false, domain: usMap }
          : projection,
      width,
      height: width * 0.52,
      style: { background: "transparent" },
      color: {
        type: "linear",
        range: colors,
        legend: true,
        label: "Species Diversity",
        unknown: isDark ? "#374151" : "#d1d5db",
      },
      marks: [
        Plot.geo(usMap, {
          fill: (d: Feature) => featureCache.get(d)?.count,
          stroke: "currentColor",
          strokeWidth: 0.5,
          strokeOpacity: 0.3,

          tip: {
            channels: {
              State: (d: Feature) =>
                d.properties?.NAME ?? d.properties?.name ?? "Unknown",
              "Species Count": (d: Feature) =>
                featureCache.get(d)?.count ?? "No data",
            },
            format: { fill: false, x: false, y: false },
            pointer: "xy",
            fill: isDark ? "#1f2937" : "#ffffff",
            stroke: "currentColor",
          },
        }),
      ],
    });

    const container = containerRef.current;
    container.innerHTML = "";
    container.append(plot);

    return () => plot.remove();
  }, [width, usMap, colors, projection, featureCache]);

  return <div ref={containerRef} className="w-full relative min-h-[300px]" />;
}
