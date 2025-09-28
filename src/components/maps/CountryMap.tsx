"use client";
/**
 * CountryMap
 * ---------------------------------------------------------------------------
 * Reusable choropleth map component for visualizing mammal species diversity
 * by country. Uses Observable Plot for rendering.
 *
 * Inputs:
 *  - stats: Record<ISO2, number>
 *  - world: GeoJSON FeatureCollection (must contain properties with at least
 *           one of iso_a2 / iso_a3 / name to resolve an ISO2 code)
 *  - isoCodeMap: (optional) mapping from alternative identifiers (ISO3 codes,
 *                 names) to ISO2 codes. Keys are case-insensitive.
 *
 * Behavior:
 *  1. Resolves a feature's ISO2 code, then joins with stats.
 *  2. Renders a continuous color scale (linear) for species counts.
 *  3. Provides tooltips (title) and navigation via /country/{ISO2} links.
 *  4. Displays labels only for countries that have data (to reduce clutter).
 *
 * Accessibility / UX:
 *  - Tooltips show Country Name: <count> species.
 *  - Countries without data are left unfilled (default map background).
 *
 * Extensibility notes:
 *  - For quantized classes, swap the color config to { type: "quantize", domain, range }.
 *  - For a legend domain clamp, compute min/max before constructing Plot.
 *  - To allow toggling labels, add a showLabels prop and conditionally push the Plot.text mark.
 */
// components/DistributionMap.tsx
import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

// Props:
// - stats: object mapping ISO codes to counts, e.g. { US: 120, ID: 340, ... } (ISO2 or ISO3)
// - world: GeoJSON FeatureCollection of countries with properties.iso_a2 and properties.iso_a3
// - colors: optional [minColor, maxColor]
interface Props {
  /** Map of ISO 3166-1 alpha-2 codes to species count. */
  stats: Record<string, number>;
  /** GeoJSON features for the world (countries layer). */
  world: GeoJSON.FeatureCollection;
  /** Two-color gradient [low, high] for linear scale. */
  colors?: [string, string];
  /** Projection name or options; defaults to 'equal-earth'. */
  projection?: string | Plot.ProjectionOptions;
  /** Mapping from alternative identifiers (ISO3 codes, names) to ISO2 codes. */
  isoCodeMap?: Record<string, string>;
  /** Primary feature property to inspect first when resolving a code. */
  valueKey?: "iso_a2" | "iso_a3" | "id" | "name";
  /** Fallback feature property names to attempt if the primary fails. */
  fallbackKeys?: string[];
}

function CountryMap({
  stats,
  world,
  colors = ["#FFEB00", "#117554"],
  projection = "equal-earth",
  isoCodeMap = {},
  valueKey = "iso_a2",
  fallbackKeys = ["iso_a3", "id", "name"],
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (
      !world ||
      !Array.isArray((world as any).features) ||
      (world as any).features.length === 0
    )
      return;

    // Determine dynamic width (fallback to 980)
    const width = ref.current.clientWidth || 980;

    // Normalize keys to uppercase for robust matching (ISO codes usually uppercase)
    const statMap = new Map<string, number>(
      Object.entries(stats).map(([k, v]) => [k.toUpperCase(), v])
    );

    // Normalize isoCodeMap keys and values (uppercase) for case-insensitive lookups.
    const countryCodeMap = new Map<string, string>(
      Object.entries(isoCodeMap).map(([k, v]) => [
        k.toUpperCase(),
        v.toUpperCase(),
      ])
    );

    /**
     * Resolve a country identifier from a feature's properties.
     * Order:
     *  1. valueKey property
     *  2. Each fallback key
     * Returns uppercase string or undefined.
     */
    function getFeatureCountry(props: any): string | undefined {
      if (!props) return undefined;
      const primary = props[valueKey];
      if (typeof primary === "string" && primary) return primary.toUpperCase();
      for (const fk of fallbackKeys) {
        const val = props[fk];
        if (typeof val === "string" && val) return val.toUpperCase();
      }
      return undefined;
    }

    // Build the choropleth with click-through navigation using href
    const plot = Plot.plot({
      projection,
      width,
      height: 520,
      color: {
        type: "linear",
        range: colors,
        label: "Species count",
        legend: true,
      },
      marks: [
        // Land fill by value
        Plot.geo(world as any, {
          fill: (d: any) => {
            const country = getFeatureCountry(d.properties);
            const v = country ? statMap.get(country) : undefined;
            return typeof v === "number" ? v : undefined;
          },
          title: (d: any) => {
            const country = getFeatureCountry(d.properties) || "?";
            const name = d.properties?.name || "Unknown";
            const v = statMap.get(country) ?? 0;
            return `${name}: ${v} species`;
          },
          tip: true,
          href: (d: any) => {
            const country = getFeatureCountry(d.properties);
            if (!country) return undefined;
            const code = countryCodeMap.get(country) || country;
            // Use iso_a2 if present (already usually the code), else fallback to derived code.
            return `/country/${d.properties?.iso_a2 || code}`;
          },
        }),
        // Country code labels at approximate centroids for countries with data.
        Plot.text(
          (world as any).features.filter((f: any) => {
            const country = getFeatureCountry(f.properties);
            return country && statMap.has(country);
          })
        ),
        // Thin borders
        Plot.geo(world as any, {
          stroke: "currentColor",
          strokeOpacity: 0.25,
          strokeWidth: 0.25,
        }),
        Plot.sphere({ stroke: "currentColor", strokeOpacity: 0.2 }),
        Plot.graticule({ stroke: "currentColor", strokeOpacity: 0.1 }),
      ],
    });

    ref.current.innerHTML = "";
    ref.current.append(plot);

    return () => {
      plot.remove();
    };
  }, [stats, world, colors, projection, valueKey]);

  return (
    <div className="mx-auto">
      <div ref={ref} className="w-full h-full" />
    </div>
  );
}

export default CountryMap;
