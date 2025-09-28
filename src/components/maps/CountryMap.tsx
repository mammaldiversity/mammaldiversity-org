"use client";
// components/DistributionMap.tsx
import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

// Props:
// - stats: object mapping ISO codes to counts, e.g. { US: 120, ID: 340, ... } (ISO2 or ISO3)
// - world: GeoJSON FeatureCollection of countries with properties.iso_a2 and properties.iso_a3
// - colors: optional [minColor, maxColor]
type Props = {
  stats: Record<string, number>; // keyed by ISO alpha-2 currently
  world: GeoJSON.FeatureCollection; // country features
  colors?: [string, string];
  projection?: string | Plot.ProjectionOptions;
  isoCodeMap?: Record<string, string>; // optional mapping from ISO3 to ISO2 codes
  valueKey?: "iso_a2" | "iso_a3" | "id" | "name";
  /** Optional ordered fallback keys to try if primary valueKey missing */
  fallbackKeys?: string[];
};

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

    const countryCodeMap = new Map<string, string>(
      Object.entries(isoCodeMap).map(([k, v]) => [
        k.toUpperCase(),
        v.toUpperCase(),
      ])
    );

    function getFeatureCountry(props: any): string | undefined {
      if (!props) return undefined;
      const primary = props[valueKey];
      if (primary && typeof primary === "string") return primary.toUpperCase();
      for (const fk of fallbackKeys) {
        const val = props[fk];
        if (val && typeof val === "string") return val.toUpperCase();
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
