import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import type { Feature, FeatureCollection } from "geojson";
import { convertUSTopoToGeoJson } from "../../libs/country_utils";

const US_MAP_URL = "/map/united_states.json";
type ProjectionOption = Plot.PlotOptions["projection"];

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
  stateAbbr: string | undefined;
}

let cachedUS: FeatureCollection | null = null;

export default function UnitedStatesMap({
  stats,
  colors = ["#FFEB00", "#117554"],
  projection = "albers-usa",
}: UnitedStatesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);
  const [us, setUS] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    if (cachedUS) {
      setUS(cachedUS);
      return;
    }

    let cancelled = false;

    async function loadUS() {
      try {
        const response = await fetch(US_MAP_URL);
        if (!response.ok)
          throw new Error(`Failed to fetch map: ${response.statusText}`);
        const topoData = await response.json();
        const geoData = convertUSTopoToGeoJson(topoData);
        if (!cancelled) {
          cachedUS = geoData;
          setUS(geoData);
        }
      } catch (err) {
        console.error("Failed to load US map:", err);
      }
    }

    loadUS();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedStats = useMemo(
    () => new Map(Object.entries(stats).map(([k, v]) => [k.toUpperCase(), v])),
    [stats],
  );

  const featureCache = useMemo<WeakMap<Feature, FeatureDatum>>(() => {
    const cache = new WeakMap<Feature, FeatureDatum>();
    if (!us?.features?.length) return cache;

    for (const feature of us.features) {
      const stateAbbr = feature.properties?.STATE as string | undefined;
      const key = stateAbbr?.toUpperCase();
      const count = key
        ? (normalizedStats.get(key) as number | undefined)
        : undefined;
      cache.set(feature, { count, stateAbbr: key });
    }

    return cache;
  }, [us, normalizedStats]);

  useEffect(() => {
    if (!width || !us?.features?.length || !containerRef.current) return;

    const isDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    const plot = Plot.plot({
      projection: projection as ProjectionOption,
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
        Plot.geo(us, {
          fill: (d: Feature) => featureCache.get(d)?.count,
          stroke: "currentColor",
          strokeWidth: 0.5,
          strokeOpacity: 0.3,

          tip: {
            channels: {
              State: (d: Feature) => d.properties?.NAME ?? "Unknown",
              "Species Count": (d: Feature) =>
                featureCache.get(d)?.count ?? "No data",
            },
            format: { fill: false, x: false, y: false },
            pointer: "xy",
            fill: isDark ? "#1f2937" : "#ffffff",
            stroke: "currentColor",
          },

          href: (d: Feature) => {
            const { stateAbbr } = featureCache.get(d) ?? {};
            return stateAbbr ? `/country/US/state/${stateAbbr}` : undefined;
          },
        }),
      ],
    });

    const container = containerRef.current;
    container.innerHTML = "";
    container.append(plot);

    return () => plot.remove();
  }, [width, us, colors, projection, featureCache]);

  return <div ref={containerRef} className="w-full relative min-h-[300px]" />;
}
