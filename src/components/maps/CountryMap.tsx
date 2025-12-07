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
 *
 * Accessibility / UX:
 *  - Tooltips show Country Name: <count> species.
 *  - Countries without data are left unfilled (default map background).
 *  - Tooltips anchor to cursor position to handle MultiPolygon geometries correctly.
 *
 * Extensibility notes:
 *  - For quantized classes, swap the color config to { type: "quantize", domain, range }.
 *  - For a legend domain clamp, compute min/max before constructing Plot.
 */
// components/DistributionMap.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";

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
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  // Observe container size changes and update width state (debounced via rAF).
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
    // Initialize immediately
    setContainerWidth(el.clientWidth || 0);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (
      !world ||
      !Array.isArray((world as any).features) ||
      (world as any).features.length === 0
    )
      return;

    // Wait until we have measured width at least once
    if (containerWidth === null) return;

    const isDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Use observed width (fallback to 980 if zero)
    const width = containerWidth || 980;

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
      height: width * 0.52,
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
          // Use tip with pointer positioning and channels for proper tooltip placement
          tip: {
            fontSize: 12,
            lineHeight: 1.3,
            fill: isDark ? "#000" : "#fff",
            pointer: "xy", // Anchor tooltip to cursor position
          },
          // Define data channels for tooltip content
          channels: {
            Country: (d: any) => d.properties?.name || "Unknown",
            // Species: (d: any) => {
            //   const country = getFeatureCountry(d.properties);
            //   const count = statMap.get(country || "") ?? 0;
            //   return `${count} species`;
            // },
          },
          href: (d: any) => {
            const country = getFeatureCountry(d.properties);
            if (!country) return undefined;
            const code = countryCodeMap.get(country) || country;
            return `/country/${d.properties?.iso_a2 || code}`;
          },
        }),

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
  }, [stats, world, colors, projection, valueKey, containerWidth]);

  return <div ref={ref} className="min-w-lg md:max-w-full mx-auto" />;
}

export default CountryMap;
