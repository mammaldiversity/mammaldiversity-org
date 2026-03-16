"use client";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import cntl from "cntl";
import { convertTopoToGeoJson } from "../../libs/country_utils";

const KNOWN_COLOR = "#117554";
const PREDICTED_COLOR = "#FFEB00";
const COUNTRY_MAP_URL = "/map/countries-50m.json";

const mapClasses = cntl`min-w-lg md:max-w-full mx-auto rounded-lg p-2 overflow-hidden bg-spectra-50 dark:bg-spectra-800 border border-spectra-200 dark:border-spectra-800`;

const btnClass = cntl`
  flex items-center justify-center
  w-7 h-7 text-sm font-medium
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  hover:bg-gray-50 dark:hover:bg-gray-700
  transition-colors select-none
`;

let cachedWorldGeoJSON: WorldGeoJSON | null = null;

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
  projection?: Plot.PlotOptions["projection"];
  width?: number;
  height?: number;
}

function injectClipPath(
  svg: SVGSVGElement,
  plotWidth: number,
  plotHeight: number,
): string {
  const ns = "http://www.w3.org/2000/svg";
  const clipId = `map-clip-${Math.random().toString(36).slice(2)}`;
  const defs = document.createElementNS(ns, "defs");
  const clipPath = document.createElementNS(ns, "clipPath");
  clipPath.setAttribute("id", clipId);
  const rect = document.createElementNS(ns, "rect");
  rect.setAttribute("width", String(plotWidth));
  rect.setAttribute("height", String(plotHeight));
  clipPath.appendChild(rect);
  defs.appendChild(clipPath);
  svg.insertBefore(defs, svg.firstChild);
  return clipId;
}

function wrapChildren(svg: SVGSVGElement, clipId: string): SVGGElement {
  const ns = "http://www.w3.org/2000/svg";
  const wrapper = document.createElementNS(ns, "g") as SVGGElement;
  wrapper.setAttribute("clip-path", `url(#${clipId})`);
  const defs = svg.querySelector("defs");
  Array.from(svg.childNodes)
    .filter((n) => n !== defs)
    .forEach((n) => wrapper.appendChild(n));
  svg.appendChild(wrapper);
  return wrapper;
}

function SpeciesDistributionMap({
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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const handleZoomRef = useRef<(factor: number) => void>(() => {});
  const handleResetRef = useRef<() => void>(() => {});

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

  const { featureCache, highlightedFeatures } = useMemo(() => {
    const cache = new WeakMap<GeoFeature, FeatureCacheEntry>();
    const highlighted: GeoFeature[] = [];

    if (!world?.features?.length) {
      return { featureCache: cache, highlightedFeatures: highlighted };
    }

    for (const feature of world.features) {
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

  // Load TopoJSON with module-level cache
  useEffect(() => {
    if (cachedWorldGeoJSON) {
      setWorld(cachedWorldGeoJSON);
      return;
    }

    let cancelled = false;

    async function loadWorldData() {
      try {
        const response = await fetch(COUNTRY_MAP_URL);
        if (!response.ok)
          throw new Error(`Failed to fetch map: ${response.statusText}`);
        const topoData = await response.json();
        const geoData = convertTopoToGeoJson(
          topoData,
        ) as unknown as WorldGeoJSON;
        if (!cancelled && Array.isArray(geoData.features)) {
          cachedWorldGeoJSON = geoData;
          setWorld(geoData);
        }
      } catch (err) {
        console.error("Failed to load country map:", err);
      }
    }

    loadWorldData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Observe container width for responsive sizing
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

  // Render Observable Plot and attach D3 zoom
  useEffect(() => {
    if (!ref.current || !world?.features?.length || containerWidth === null)
      return;

    const container = ref.current;
    const isDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const plotWidth = width ?? containerWidth ?? 980;
    const plotHeight = height ?? plotWidth * 0.52;
    const baseColor = isDark ? "#333" : "#f0f0f0";
    const tipColor = isDark ? "#000" : "#fff";

    const plot = Plot.plot({
      projection,
      width: plotWidth,
      height: plotHeight,
      style: { overflow: "hidden", display: "block" },
      marks: [
        Plot.geo(world.features, {
          ariaHidden: "true",
          fill: (d: GeoFeature) => {
            const status = featureCache.get(d)?.status;
            if (status === "known") return knownColor;
            if (status === "predicted") return predictedColor;
            return baseColor;
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
            fill: tipColor,
            stroke: tipColor,
            strokeWidth: 1,
          },
        }),

        Plot.sphere({
          ariaHidden: "true",
          stroke: "currentColor",
          strokeOpacity: 0.2,
          fill: "none",
        }),

        Plot.graticule({
          ariaHidden: "true",
          stroke: "currentColor",
          strokeOpacity: 0.1,
          strokeDasharray: "2,2",
        }),
      ],
    });

    container.innerHTML = "";
    container.append(plot);

    const svg = (
      plot instanceof SVGSVGElement ? plot : plot.querySelector("svg")
    ) as SVGSVGElement | null;

    if (svg) {
      svgRef.current = svg;

      const clipId = injectClipPath(svg, plotWidth, plotHeight);
      const wrapper = wrapChildren(svg, clipId);

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .translateExtent([
          [0, 0],
          [plotWidth, plotHeight],
        ])
        .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          wrapper.setAttribute("transform", event.transform.toString());
        });

      zoomRef.current = zoom;

      handleZoomRef.current = (factor: number) => {
        d3.select(svg).transition().duration(300).call(zoom.scaleBy, factor);
      };
      handleResetRef.current = () => {
        d3.select(svg)
          .transition()
          .duration(400)
          .call(zoom.transform, d3.zoomIdentity);
      };

      const svgSel = d3.select(svg);
      svgSel.call(zoom);

      svg.style.cursor = "grab";
      svgSel.on("mousedown.cursor", () => {
        svg.style.cursor = "grabbing";
      });
      svgSel.on("mouseup.cursor", () => {
        svg.style.cursor = "grab";
      });
      svgSel.on("dblclick.zoom", () => {
        svgSel.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
      });
    }

    return () => {
      handleZoomRef.current = () => {};
      handleResetRef.current = () => {};
      if (svgRef.current) {
        d3.select(svgRef.current).on(".zoom", null).on(".cursor", null);
        svgRef.current = null;
      }
      zoomRef.current = null;
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

      <div className="relative overflow-hidden rounded">
        <div className="absolute bottom-3 right-3 z-10 flex flex-col rounded shadow overflow-hidden">
          <button
            onClick={() => handleZoomRef.current(2)}
            className={btnClass}
            aria-label="Zoom in"
          >
            +
          </button>
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={() => handleZoomRef.current(0.5)}
            className={btnClass}
            aria-label="Zoom out"
          >
            -
          </button>
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={() => handleResetRef.current()}
            className={btnClass}
            aria-label="Reset map zoom"
          >
            R
          </button>
        </div>

        <div
          ref={ref}
          className={mapClasses}
          role="application"
          aria-label="Species distribution map"
        />
      </div>
    </>
  );
}

export default SpeciesDistributionMap;
