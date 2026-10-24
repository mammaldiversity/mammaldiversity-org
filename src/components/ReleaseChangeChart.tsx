import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import type { ReleaseChangeTrend } from "../../db/diffs_model";

interface ReleaseChangeChartProps {
  data: ReleaseChangeTrend[];
}

interface ChartDatum {
  version: string;
  releaseDate: string | undefined;
  category: string;
  count: number;
}

type TrendKey = "deNovo" | "genus" | "lump" | "split";

interface LineStyle {
  key: TrendKey;
  label: string;
  dasharray?: string;
}

const LINE_STYLES: LineStyle[] = [
  { key: "deNovo", label: "De novo" },
  { key: "genus", label: "Genus changes", dasharray: "8 5" },
  { key: "lump", label: "Lumps", dasharray: "2 5" },
  { key: "split", label: "Splits", dasharray: "8 4 2 4" },
];

const CHART_COLORS = {
  light: {
    foreground: "#273a39",
    grid: "#679a98",
    pointOutline: "#ffffff",
  },
  dark: {
    foreground: "#f4f9f8",
    grid: "#679a98",
    pointOutline: "#273a39",
  },
} as const;

function formatReleaseDate(dateString: string | undefined): string {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function usePrefersDarkMode() {
  const [isDark, setIsDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateColorScheme = () => setIsDark(mediaQuery.matches);

    updateColorScheme();
    mediaQuery.addEventListener("change", updateColorScheme);

    return () => {
      mediaQuery.removeEventListener("change", updateColorScheme);
    };
  }, []);

  return isDark;
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
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      observer.disconnect();
    };
  }, [ref, defaultWidth]);

  return width;
}

export default function ReleaseChangeChart({ data }: ReleaseChangeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);
  const isDark = usePrefersDarkMode();

  const chartData = useMemo<ChartDatum[]>(
    () =>
      data.flatMap((release) =>
        LINE_STYLES.map(({ key, label }) => ({
          version: `v${release.version}`,
          releaseDate: release.releaseDate,
          category: label,
          count: release[key],
        })),
      ),
    [data],
  );

  const releaseDates = useMemo(
    () =>
      new Map(
        data.map((release) => [`v${release.version}`, release.releaseDate]),
      ),
    [data],
  );

  useEffect(() => {
    if (!width || !containerRef.current || chartData.length === 0) return;

    const colors = isDark ? CHART_COLORS.dark : CHART_COLORS.light;
    const plot = Plot.plot({
      width,
      height: 380,
      marginLeft: 58,
      marginRight: 24,
      marginBottom: 78,
      style: {
        background: "transparent",
        color: colors.foreground,
        fontSize: "12px",
      },
      y: {
        grid: colors.grid,
        nice: true,
      },
      marks: [
        Plot.axisX({
          color: colors.foreground,
          label: "MDD version · release date",
          tickFormat: (version: string) =>
            `${version}\n${formatReleaseDate(releaseDates.get(version))}`,
          tickRotate: -28,
          tickPadding: 4,
        }),
        Plot.axisY({
          color: colors.foreground,
          label: "Count",
        }),
        ...LINE_STYLES.map(({ label, dasharray }) =>
          Plot.lineY(
            chartData.filter((datum) => datum.category === label),
            {
              x: "version",
              y: "count",
              stroke: colors.foreground,
              strokeWidth: 2.5,
              strokeDasharray: dasharray,
            },
          ),
        ),
        Plot.dot(chartData, {
          x: "version",
          y: "count",
          fill: colors.foreground,
          r: 4,
          stroke: colors.pointOutline,
          strokeWidth: 1.5,
          tip: {
            channels: {
              Version: "version",
              Date: (datum: ChartDatum) => formatReleaseDate(datum.releaseDate),
              Change: "category",
              Count: "count",
            },
            format: {
              fill: false,
              stroke: false,
              strokeWidth: false,
              r: false,
            },
            pointer: "xy",
            fill: isDark ? "#1f2937" : "#ffffff",
            stroke: "currentColor",
          },
        }),
      ],
    });

    const container = containerRef.current;
    container.innerHTML = "";
    container.append(plot);
    plot.setAttribute("role", "img");
    plot.setAttribute(
      "aria-label",
      "Line chart of selected taxonomic changes by MDD release",
    );

    return () => plot.remove();
  }, [chartData, isDark, releaseDates, width]);

  return (
    <div
      className="w-full overflow-x-auto"
      role="group"
      aria-label="Taxonomic change trend chart"
    >
      <div className="min-w-[400px]">
        <div ref={containerRef} className="min-h-[380px] w-full" />
        <div
          className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-spectra-900 dark:text-spectra-50"
          aria-label="Chart legend"
        >
          {LINE_STYLES.map(({ label, dasharray }) => (
            <div className="flex items-center gap-2">
              <svg width="32" height="8" aria-hidden="true">
                <line
                  x1="1"
                  y1="4"
                  x2="31"
                  y2="4"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray={dasharray}
                />
              </svg>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
