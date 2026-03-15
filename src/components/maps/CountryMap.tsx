import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import type { Feature, FeatureCollection } from "geojson";

interface CountryMapProps {
  stats: Record<string, number>;
  world: FeatureCollection;
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
  iso2: string | undefined;
}

export default function CountryMap({
  stats,
  world,
  colors = ["#FFEB00", "#117554"],
  projection = "equal-earth",
}: CountryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);

  const normalizedStats = useMemo(
    () => new Map(Object.entries(stats).map(([k, v]) => [k.toUpperCase(), v])),
    [stats],
  );

  const featureCache = useMemo<WeakMap<Feature, FeatureDatum>>(() => {
    const cache = new WeakMap<Feature, FeatureDatum>();
    if (!world?.features?.length) return cache;

    for (const feature of world.features) {
      const iso2 = feature.properties?.ISO_A2 as string | undefined;
      const key = iso2?.toUpperCase();
      const count = key
        ? (normalizedStats.get(key) as number | undefined)
        : undefined;
      cache.set(feature, { count, iso2: key });
    }

    return cache;
  }, [world, normalizedStats]);

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
        unknown: isDark ? "#374151" : "#d1d5db",
      },
      marks: [
        Plot.sphere({ stroke: "currentColor", strokeOpacity: 0.1 }),
        Plot.graticule({ stroke: "currentColor", strokeOpacity: 0.1 }),

        Plot.geo(world, {
          fill: (d: Feature) => featureCache.get(d)?.count,
          stroke: "currentColor",
          strokeWidth: 0.5,
          strokeOpacity: 0.3,

          tip: {
            channels: {
              Country: (d: Feature) =>
                d.properties?.mdd_name ?? d.properties?.NAME ?? "Unknown",
              "Species Count": (d: Feature) =>
                featureCache.get(d)?.count ?? "No data",
            },
            format: { fill: false, x: false, y: false },
            pointer: "xy",
            fill: isDark ? "#1f2937" : "#ffffff",
            stroke: "currentColor",
          },

          href: (d: Feature) => {
            const { iso2 } = featureCache.get(d) ?? {};
            return iso2 ? `/country/${iso2}` : undefined;
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
