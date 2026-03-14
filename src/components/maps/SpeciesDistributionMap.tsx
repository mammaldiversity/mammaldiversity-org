"use client";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import { downloadCountryGeoJSON } from "../../libs/species_map";
import cntl from "cntl";

const KNOWN_COLOR = "#117554";
const PREDICTED_COLOR = "#FFEB00";

const mapClasses = cntl`
  min-w-lg 
  md:max-w-full 
  mx-auto
`;

// ─── Module-level GeoJSON cache ───────────────────────────────────────────────
// Persists across mounts so back/forward navigation and remounts
// never re-fetch or re-parse the GeoJSON blob.
let cachedWorldGeoJSON: WorldGeoJSON | null = null;

interface GeoFeatureProperties {
  iso_a2?: string;
  iso_a3?: string;
  id?: string;
  name?: string;
  [key: string]: string | number | undefined;
}

interface GeoFeature {
  type: "Feature";
  properties: GeoFeatureProperties | null;
  geometry: unknown;
}

interface WorldGeoJSON {
  type: "FeatureCollection";
  features: GeoFeature[];
}

interface FeatureCacheEntry {
  status: "known" | "predicted" | null;
  name: string;
}

interface Props {
  knownDistribution?: string[];
  predictedDistribution?: string[];
  knownColor?: string;
  predictedColor?: string;
  projection?: string | Plot.ProjectionOptions;
  isoCodeMap?: Record<string, string>;
  valueKey?: "iso_a2" | "iso_a3" | "id" | "name";
  fallbackKeys?: string[];
  width?: number;
  height?: number;
}

function SpeciesDistributionMap({
  knownDistribution = [],
  predictedDistribution = [],
  knownColor = KNOWN_COLOR,
  predictedColor = PREDICTED_COLOR,
  projection = "equal-earth",
  isoCodeMap = {},
  valueKey = "iso_a2",
  fallbackKeys = ["iso_a3", "id", "name"],
  width,
  height,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [world, setWorld] = useState<WorldGeoJSON | null>(null);

  const knownCountries = useMemo(
    () => new Set(knownDistribution),
    [knownDistribution],
  );

  const predictedCountries = useMemo(
    () => new Set(predictedDistribution),
    [predictedDistribution],
  );

  /**
   * Pre-compute status ("known" | "predicted" | null) and display name for
   * every feature into a WeakMap. Also produces a pre-filtered array of
   * highlighted features so the tooltip mark iterates only relevant countries.
   *
   * All country-resolution logic runs here (once, in useMemo) instead of
   * inside Plot accessor functions, which would call it repeatedly per channel
   * per feature on every render.
   */
  const { featureCache, highlightedFeatures } = useMemo(() => {
    const cache = new WeakMap<GeoFeature, FeatureCacheEntry>();
    const highlighted: GeoFeature[] = [];

    if (!world?.features?.length) {
      return { featureCache: cache, highlightedFeatures: highlighted };
    }

    // Normalize isoCodeMap once here rather than on every accessor call
    const codeMap = new Map(
      Object.entries(isoCodeMap).map(([k, v]) => [
        k.toUpperCase(),
        v.toUpperCase(),
      ]),
    );

    for (const feature of world.features) {
      const props = feature.properties;
      let countryId: string | undefined;

      if (props) {
        const primary = props[valueKey];
        if (typeof primary === "string" && primary.trim()) {
          countryId = primary.trim().toUpperCase();
        } else {
          for (const fk of fallbackKeys) {
            const val = props[fk];
            if (typeof val === "string" && val.trim()) {
              countryId = val.trim().toUpperCase();
              break;
            }
          }
        }
      }

      const resolvedId = countryId
        ? codeMap.get(countryId) ?? countryId
        : undefined;

      let status: FeatureCacheEntry["status"] = null;
      if (resolvedId) {
        if (knownCountries.has(resolvedId)) status = "known";
        else if (predictedCountries.has(resolvedId)) status = "predicted";
      }

      const entry: FeatureCacheEntry = {
        status,
        name: props?.name ?? "Unknown Country",
      };

      cache.set(feature, entry);
      if (status !== null) highlighted.push(feature);
    }

    return { featureCache: cache, highlightedFeatures: highlighted };
  }, [
    world,
    valueKey,
    fallbackKeys,
    isoCodeMap,
    knownCountries,
    predictedCountries,
  ]);

  // Load GeoJSON — uses module-level cache to prevent re-fetching on remount
  useEffect(() => {
    if (cachedWorldGeoJSON) {
      setWorld(cachedWorldGeoJSON);
      return;
    }

    let cancelled = false;

    async function loadWorldData() {
      try {
        const worldData = await downloadCountryGeoJSON();
        if (!cancelled && worldData && Array.isArray(worldData.features)) {
          cachedWorldGeoJSON = worldData as WorldGeoJSON;
          setWorld(cachedWorldGeoJSON);
        }
      } catch (err) {
        console.error("Failed to load country GeoJSON:", err);
      }
    }

    loadWorldData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Responsive width — cancels pending animation frames on cleanup
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
    if (
      !ref.current ||
      !world ||
      !Array.isArray(world.features) ||
      containerWidth === null
    ) {
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
        // Single pass for all country fills and borders.
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

        // Tooltip pass — iterates only pre-filtered highlighted countries,
        // transparent fill so the fill layer underneath remains visible.
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
