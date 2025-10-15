"use client";
/**
 * DistributionMap
 * ---------------------------------------------------------------------------
 * Reusable choropleth map component for visualizing species distribution
 * by country, distinguishing between known and predicted areas.
 * Uses Observable Plot for rendering.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import * as Plot from "@observablehq/plot";
import { downloadCountryGeoJSON } from "../../scripts/species_map";
import cntl from "cntl";

const KNOWN_COLOR = "#117554"; // Dark green
const PREDICTED_COLOR = "#FFEB00"; // Bright yellow

const mapClasses = cntl`
  min-w-lg 
  md:max-w-full 
  mx-auto
`;

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
  geometry: any;
}

interface WorldGeoJSON {
  type: "FeatureCollection";
  features: GeoFeature[];
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
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const frameRef = useRef<number | null>(null);

  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [world, setWorld] = useState<WorldGeoJSON | null>(null);

  // Memoize country sets
  // THis ensures that the sets are only recreated when the input arrays change
  const knownCountries = useMemo(() => {
    if (!knownDistribution?.length) return new Set<string>();
    return new Set(knownDistribution.map((c) => c));
  }, [knownDistribution]);

  const predictedCountries = useMemo(() => {
    if (!predictedDistribution?.length) return new Set<string>();
    return new Set(predictedDistribution.map((c) => c));
  }, [predictedDistribution]);

  // Memoize country code mapping
  const countryCodeMap = useMemo(() => {
    if (!Object.keys(isoCodeMap).length) return new Map<string, string>();
    return new Map<string, string>(
      Object.entries(isoCodeMap).map(([k, v]) => [k, v])
    );
  }, [isoCodeMap]);

  // Memoize feature resolution function
  const getFeatureISO2 = useCallback(
    (props: GeoFeatureProperties | null): string | undefined => {
      if (!props) return undefined;

      let identifiedCountry: string | undefined;

      const primary = props[valueKey];
      if (typeof primary === "string" && primary.trim()) {
        identifiedCountry = primary.trim().toUpperCase();
      } else {
        for (const fk of fallbackKeys) {
          const val = props[fk];
          if (typeof val === "string" && val.trim()) {
            identifiedCountry = val.trim().toUpperCase();
            break;
          }
        }
      }

      if (!identifiedCountry) return undefined;
      return countryCodeMap.get(identifiedCountry) || identifiedCountry;
    },
    [valueKey, fallbackKeys, countryCodeMap]
  );

  // Load world GeoJSON data
  useEffect(() => {
    let cancelled = false;

    async function loadWorldData() {
      try {
        const worldData = await downloadCountryGeoJSON();
        if (!cancelled && worldData && Array.isArray(worldData.features)) {
          setWorld(worldData as WorldGeoJSON);
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

  // Handle responsive resizing
  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const newWidth = entry.contentRect.width;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        setContainerWidth((prev) => {
          if (prev === null || Math.abs(prev - newWidth) > 2) {
            return newWidth;
          }
          return prev;
        });
      });
    };

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(el);
    setContainerWidth(el.clientWidth || 0);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, []);

  // Create and manage Observable Plot
  useEffect(() => {
    // Don't render if conditions aren't met
    if (
      !ref.current ||
      !world ||
      !Array.isArray(world.features) ||
      containerWidth === null
    ) {
      return;
    }

    // Store reference to current container
    const container = ref.current;

    // Clear container before creating plot
    container.innerHTML = "";

    const isDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const plotWidth = width || containerWidth || 980;
    const plotHeight = height || plotWidth * 0.52;

    // Create the plot
    const plot = Plot.plot({
      projection,
      width: plotWidth,
      height: plotHeight,
      style: {
        overflow: "visible",
      },
      marks: [
        // Base map layer
        Plot.geo(world.features, {
          stroke: "currentColor",
          strokeOpacity: 0.1,
          fill: isDark ? "#333" : "#f0f0f0",
        }),

        // Predicted countries layer
        Plot.geo(world.features, {
          filter: (d: GeoFeature) => {
            const iso2 = getFeatureISO2(d.properties);
            return iso2 ? predictedCountries.has(iso2) : false;
          },
          fill: predictedColor,
          fillOpacity: 0.55,
          stroke: predictedColor,
          strokeOpacity: 0.8,
          strokeWidth: 0.5,
        }),

        // Known countries layer
        Plot.geo(world.features, {
          filter: (d: GeoFeature) => {
            const iso2 = getFeatureISO2(d.properties);
            return iso2 ? knownCountries.has(iso2) : false;
          },
          fill: knownColor,
          stroke: knownColor,
          strokeOpacity: 0.9,
          strokeWidth: 0.5,
        }),

        // Tooltip layer
        Plot.geo(world.features, {
          filter: (d: GeoFeature) => {
            const iso2 = getFeatureISO2(d.properties);
            return iso2
              ? knownCountries.has(iso2) || predictedCountries.has(iso2)
              : false;
          },
          fill: "transparent",
          title: (d: GeoFeature) => {
            const name = d.properties?.name || "Unknown Country";
            const iso2 = getFeatureISO2(d.properties);
            const isKnown = iso2 ? knownCountries.has(iso2) : false;
            const isPredicted = iso2 ? predictedCountries.has(iso2) : false;

            let status = "";
            if (isKnown && isPredicted) {
              status = " (Known & Predicted)";
            } else if (isKnown) {
              status = " (Known Distribution)";
            } else if (isPredicted) {
              status = " (Predicted Distribution)";
            }

            return `${name}${status}`;
          },
          tip: {
            fontSize: 12,
            lineHeight: 1.4,
            fill: isDark ? "#000" : "#fff",
            stroke: isDark ? "#000" : "#fff",
            strokeWidth: 1,
          },
        }),

        // Country borders
        Plot.geo(world.features, {
          stroke: "currentColor",
          strokeOpacity: 0.3,
          strokeWidth: 0.25,
          fill: "none",
        }),

        // Sphere and graticule
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

    container.append(plot);

    // Cleanup function - only remove if the plot still exists in DOM
    return () => {
      if (plot && plot.parentNode) {
        plot.remove();
      }
    };
  }, [
    world,
    knownCountries,
    predictedCountries,
    knownColor,
    predictedColor,
    projection,
    containerWidth,
    getFeatureISO2,
    width,
    height,
  ]);

  return (
    <>
      {predictedDistribution && predictedDistribution.length > 0 && (
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
