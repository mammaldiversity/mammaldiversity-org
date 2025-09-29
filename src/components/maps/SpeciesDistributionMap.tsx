"use client";
/**
 * DistributionMap
 * ---------------------------------------------------------------------------
 * Reusable choropleth map component for visualizing species distribution
 * by country, distinguishing between known and predicted areas.
 * Uses Observable Plot for rendering.
 *
 * Inputs:
 * - distribution: A single pipe-separated string of country codes. A '?'
 * suffix on a country code indicates a predicted distribution.
 * - world: GeoJSON FeatureCollection of world countries.
 * - isoCodeMap: (optional) mapping from alternative identifiers (ISO3, names)
 * to ISO2 codes for robust matching.
 *
 * Behavior:
 * 1. Parses the distribution string into 'known' and 'predicted' sets.
 * 2. Resolves a feature's ISO code and checks for its presence in the sets.
 * 3. Renders 'known' countries in a solid color and 'predicted' countries
 * with a pattern fill for clear visual distinction.
 * 4. Provides tooltips indicating the distribution type (Known/Predicted).
 *
 * Example distribution string: "USA|CAN|MEX?" -> Known: USA, CAN; Predicted: MEX
 */
import { useEffect, useRef, useState } from "preact";
import * as Plot from "@observablehq/plot";
import {
  downloadCountryGeoJSON,
  splitCountryDistribution,
} from "../../scripts/species_map";

interface Props {
  /**
   * A single pipe-separated string of country codes (ISO2, ISO3, or names).
   * A "?" suffix indicates a predicted distribution. E.g., "ID|MY|US?".
   */
  distribution: string;
  /** Color for known distribution areas. */
  knownColor?: string;
  /** Color for predicted distribution areas. */
  predictedColor?: string;
  /** Projection name or options; defaults to 'equal-earth'. */
  projection?: string | Plot.ProjectionOptions;
  /** Mapping from alternative identifiers (ISO3 codes, names) to ISO2 codes. */
  isoCodeMap?: Record<string, string>;
  /** Primary feature property to inspect first when resolving a code. */
  valueKey?: "iso_a2" | "iso_a3" | "id" | "name";
  /** Fallback feature property names to attempt if the primary fails. */
  fallbackKeys?: string[];
}

// --- Component Implementation ---

function SpeciesDistributionMap({
  distribution,
  knownColor = "#117554", // Dark green
  predictedColor = "#FFEB00", // Bright yellow
  projection = "equal-earth",
  isoCodeMap = {},
  valueKey = "iso_a2",
  fallbackKeys = ["iso_a3", "id", "name"],
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  // Observe container size for responsive resizing.
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let frame: number | null = null;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const newWidth = entry.contentRect.width;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setContainerWidth((prev) => (prev !== newWidth ? newWidth : prev));
      });
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth || 0);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (containerWidth === null) return;
    let plot: any;
    let cancelled = false;

    async function render() {
      const worldData = await downloadCountryGeoJSON();
      if (
        cancelled ||
        !ref.current ||
        !worldData ||
        !Array.isArray((worldData as any).features)
      ) {
        return;
      }

      const { known, predicted } = splitCountryDistribution(distribution);

      // Normalize all country codes to uppercase for robust matching.
      const knownCountries = new Set(known.map((c) => c.toUpperCase()));
      const predictedCountries = new Set(predicted.map((c) => c.toUpperCase()));

      // Normalize isoCodeMap keys and values to uppercase.
      const countryCodeMap = new Map<string, string>(
        Object.entries(isoCodeMap).map(([k, v]) => [
          k.toUpperCase(),
          v.toUpperCase(),
        ])
      );

      function getFeatureISO2(props: any): string | undefined {
        if (!props) return undefined;
        let identifiedCountry: string | undefined;
        const primary = props[valueKey];
        if (typeof primary === "string" && primary) {
          identifiedCountry = primary.toUpperCase();
        } else {
          for (const fk of fallbackKeys) {
            const val = props[fk];
            if (typeof val === "string" && val) {
              identifiedCountry = val.toUpperCase();
              break;
            }
          }
        }
        if (!identifiedCountry) return undefined;
        return countryCodeMap.get(identifiedCountry) || identifiedCountry;
      }

      const isDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const width = containerWidth || 980;

      plot = Plot.plot({
        projection,
        width,
        height: width * 0.52,
        marks: [
          Plot.geo(worldData as any, {
            stroke: "currentColor",
            strokeOpacity: 0.1,
            fill: isDark ? "#333" : "#f0f0f0",
          }),
          Plot.geo(worldData as any, {
            filter: (d: any) => {
              const iso2 = getFeatureISO2(d.properties);
              return iso2 ? predictedCountries.has(iso2) : false;
            },
            fill: predictedColor,
            fillOpacity: 0.55,
          }),
          Plot.geo(worldData as any, {
            filter: (d: any) => {
              const iso2 = getFeatureISO2(d.properties);
              return iso2 ? knownCountries.has(iso2) : false;
            },
            fill: knownColor,
          }),
          Plot.geo(worldData as any, {
            filter: (d: any) => {
              const iso2 = getFeatureISO2(d.properties);
              return iso2
                ? knownCountries.has(iso2) || predictedCountries.has(iso2)
                : false;
            },
            title: (d: any) => {
              const iso2 = getFeatureISO2(d.properties)!;
              const name = d.properties?.name || "Unknown";
              const isKnown = knownCountries.has(iso2);
              const isPredicted = predictedCountries.has(iso2);
              let status = "";
              if (isKnown && isPredicted) status = "known & predicted";
              else if (isKnown) status = "known";
              else if (isPredicted) status = "predicted";
              return `${name}\nStatus: ${status}`;
            },
            tip: {
              fontSize: 12,
              lineHeight: 1.3,
              fill: isDark ? "#000" : "#fff",
            },
          }),
          Plot.geo(worldData as any, {
            stroke: "currentColor",
            strokeOpacity: 0.25,
            strokeWidth: 0.25,
          }),
          Plot.sphere({ stroke: "currentColor", strokeOpacity: 0.2 }),
          Plot.graticule({ stroke: "currentColor", strokeOpacity: 0.1 }),
        ],
      });

      if (ref.current && !cancelled) {
        ref.current.innerHTML = "";
        ref.current.append(plot);
      }
    }

    render();

    return () => {
      cancelled = true;
      if (plot) plot.remove();
    };
  }, [
    distribution,
    knownColor,
    predictedColor,
    projection,
    valueKey,
    containerWidth,
    isoCodeMap,
    fallbackKeys,
  ]);

  return <div ref={ref} className="min-w-lg md:max-w-full mx-auto" />;
}

export default SpeciesDistributionMap;
