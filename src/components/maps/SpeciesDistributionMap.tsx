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
import { useEffect, useRef, useState } from "preact/hooks";
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
  const [world, setWorld] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const worldData = await downloadCountryGeoJSON();
        if (!cancelled) setWorld(worldData);
      } catch (err) {
        console.error("Failed to load country GeoJSON", err);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (
      !ref.current ||
      !world ||
      !Array.isArray((world as any).features) ||
      containerWidth === null
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

    /**
     * Resolves a country identifier from a feature's properties, trying primary
     * and fallback keys. The result is then mapped to an ISO2 code if possible.
     */
    function getFeatureISO2(props: any): string | undefined {
      if (!props) return undefined;
      let identifiedCountry: string | undefined;

      // Try primary key first
      const primary = props[valueKey];
      if (typeof primary === "string" && primary) {
        identifiedCountry = primary.toUpperCase();
      } else {
        // Then try fallback keys
        for (const fk of fallbackKeys) {
          const val = props[fk];
          if (typeof val === "string" && val) {
            identifiedCountry = val.toUpperCase();
            break;
          }
        }
      }

      if (!identifiedCountry) return undefined;

      // Return the mapped ISO2 code or the identifier itself if not in the map.
      return countryCodeMap.get(identifiedCountry) || identifiedCountry;
    }

    const isDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const width = containerWidth || 980;

    const plot = Plot.plot({
      projection,
      width,
      height: width * 0.52, // Maintain aspect ratio
      marks: [
        // Removed undefined pattern; using base map and solid fills
        Plot.geo(world as any, {
          stroke: "currentColor",
          strokeOpacity: 0.1,
          fill: isDark ? "#333" : "#f0f0f0",
        }), // Base map fill

        // Predicted countries layer (semi-transparent fill)
        Plot.geo(world as any, {
          filter: (d: any) => {
            const iso2 = getFeatureISO2(d.properties);
            return iso2 ? predictedCountries.has(iso2) : false;
          },
          fill: predictedColor,
          fillOpacity: 0.55,
        }),

        // Known countries layer (solid fill, drawn on top)
        Plot.geo(world as any, {
          filter: (d: any) => {
            const iso2 = getFeatureISO2(d.properties);
            return iso2 ? knownCountries.has(iso2) : false;
          },
          fill: knownColor,
        }),

        // A separate, transparent layer for tooltips over all highlighted countries
        Plot.geo(world as any, {
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

        // Borders for all countries, drawn on top of fills
        Plot.geo(world as any, {
          stroke: "currentColor",
          strokeOpacity: 0.25,
          strokeWidth: 0.25,
        }),
        Plot.sphere({ stroke: "currentColor", strokeOpacity: 0.2 }),
        Plot.graticule({ stroke: "currentColor", strokeOpacity: 0.1 }),
      ],
    });

    if (ref.current) {
      ref.current.innerHTML = "";
      ref.current.append(plot);
    }

    return () => {
      plot.remove();
    };
  }, [
    distribution,
    world,
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
