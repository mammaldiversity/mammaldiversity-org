"use client";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import type { FeatureCollection } from "geojson";
import cntl from "cntl";

const KNOWN_COLOR = "#117554";
const PREDICTED_COLOR = "#FFEB00";

const mapClasses = cntl`
  min-w-lg 
  md:max-w-full 
  mx-auto
`;

interface GeoFeatureProperties {
  ISO_A2?: string;
  mdd_name?: string;
  NAME?: string;
  [key: string]: string | number | undefined;
}

interface GeoFeature {
  type: "Feature";
  properties: GeoFeatureProperties | null;
  geometry: unknown;
}

interface FeatureCacheEntry {
  status: "known" | "predicted" | null;
  name: string;
}

interface Props {
  world: FeatureCollection;
  knownDistribution?: string[];
  predictedDistribution?: string[];
  knownColor?: string;
  predictedColor?: string;
  projection?: string | Plot.ProjectionOptions;
  width?: number;
  height?: number;
}

function SpeciesDistributionMap({
  world,
  knownDistribution = [],
  predictedDistribution = [],
  knownColor = KNOWN_COLOR,
  predictedColor = PREDICTED_COLOR,
  projection = "equal-earth",
  width,
  height,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const knownCountries = useMemo(
    () => new Set(knownDistribution),
    [knownDistribution],
  );

  const predictedCountries = useMemo(
    () => new Set(predictedDistribution),
    [predictedDistribution],
  );

  const { featureCache, highlightedFeatures } = useMemo(() => {
    const cache = new WeakMap<GeoFeature, FeatureCacheEntry>();
    const highlighted: GeoFeature[] = [];

    if (!world?.features?.length) {
      return { featureCache: cache, highlightedFeatures: highlighted };
    }

    for (const feature of world.features as GeoFeature[]) {
      const props = feature.properties;
      const mddName = props?.mdd_name as string | undefined;

      let status: FeatureCacheEntry["status"] = null;
      if (mddName) {
        if (knownCountries.has(mddName)) status = "known";
        else if (predictedCountries.has(mddName)) status = "predicted";
      }

      cache.set(feature, {
        status,
        name: mddName ?? props?.NAME ?? "Unknown Country",
      });
      if (status !== null) highlighted.push(feature);
    }

    return { featureCache: cache, highlightedFeatures: highlighted };
  }, [world, knownCountries, predictedCountries]);

  // Responsive width
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    setContainerWidth(el.clientWidth || 0);

    const observer = new ResizeObserver((entries) => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const entry = entries[0];
        if (!entry) return;
        const newWidth = entry.contentRect.width;
        setContainerWidth((prev) =>
          prev === null || Math.abs(prev - newWidth) > 2 ? newWidth : prev,
        );
      });
    });

    observer.observe(el);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      observer.disconnect();
    };
  }, []);

  // Create Observable Plot
  useEffect(() => {
    if (!ref.current || !world?.features?.length || containerWidth === null) {
      return;
    }

    const container = ref.current;
    const isDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const plotWidth = width ?? containerWidth ?? 980;
    const plotHeight = height ?? plotWidth * 0.52;

    const plot = Plot.plot({
      projection,
      width: plotWidth,
      height: plotHeight,
      style: { overflow: "visible" },
      marks: [
        Plot.geo(world.features, {
          fill: (d: GeoFeature) => {
            const status = featureCache.get(d)?.status;
            if (status === "known") return knownColor;
            if (status === "predicted") return predictedColor;
            return isDark ? "#333" : "#f0f0f0";
          },
          stroke: "currentColor",
          strokeWidth: 0.25,
          strokeOpacity: 0.3,
        }),

        Plot.geo(highlightedFeatures, {
          fill: "transparent",
          stroke: "none",
          title: (d: GeoFeature) =>
            featureCache.get(d)?.name ?? "Unknown Country",
          tip: {
            fontSize: 12,
            lineHeight: 1.4,
            fill: isDark ? "#000" : "#fff",
            stroke: isDark ? "#000" : "#fff",
            strokeWidth: 1,
          },
        }),

        Plot.sphere({
          stroke: "currentColor",
          strokeOpacity: 0.2,
          fill: "none",
        }),
        Plot.graticule({
          stroke: "currentColor",
          strokeOpacity: 0.1,
          strokeDasharray: "2,2",
        }),
      ],
    });

    container.innerHTML = "";
    container.append(plot);

    return () => {
      if (plot.parentNode) plot.remove();
    };
  }, [
    world,
    featureCache,
    highlightedFeatures,
    knownColor,
    predictedColor,
    projection,
    containerWidth,
    width,
    height,
  ]);

  return (
    <>
      {predictedDistribution.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-1">
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block bg-[#117554]" />
            <span>Known</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block bg-[#FFEB00]" />
            <span>Predicted distribution</span>
          </span>
        </div>
      )}
      <div ref={ref} className={mapClasses} />
    </>
  );
}

export default SpeciesDistributionMap;
