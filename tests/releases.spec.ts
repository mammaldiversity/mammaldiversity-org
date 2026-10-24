import { test, expect } from "@playwright/test";
import {
  cleanVersion,
  getChangeTrendData,
  getAllTaxonomyChanges,
  getDiffReleases,
  getReleaseDate,
  getReleaseNotes,
} from "../db/diffs";
import {
  getHistoricalReleaseNote,
  getHistoricalReleaseNotes,
  getZenodoReleaseLink,
} from "../db/release_notes";
import type { DiffRelease } from "../db/diffs_model";
import { getMetadata } from "../db/mdd";
import {
  cleanVersion as cleanMetadataVersion,
  formatDate,
} from "../src/libs/metadata";
import { MDD_DOWNLOAD_LINK } from "../src/libs/permalink";
import {
  formatDiffName,
  tokenizeDiffReference,
  tokenizeDiffText,
} from "../src/libs/diff-display";

const diffReleases = getDiffReleases();
const allTaxonomyChanges = getAllTaxonomyChanges();
const latestChange = allTaxonomyChanges[0];
const latestRelease = diffReleases.find(
  (release) => cleanVersion(release.version) === latestChange.version,
)!;
const latestVersion = cleanVersion(latestRelease.version);
const currentVersion = cleanMetadataVersion(getMetadata().version);

function contrastRatio(foreground: string, background: string) {
  const channel = (value: string, offset: number) => {
    const parsed = Number.parseInt(value.slice(offset, offset + 2), 16) / 255;
    return parsed <= 0.03928
      ? parsed / 12.92
      : ((parsed + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (color: string) =>
    0.2126 * channel(color, 1) +
    0.7152 * channel(color, 3) +
    0.0722 * channel(color, 5);
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

test("diff parser exposes JSON releases and fallback dates", () => {
  const trend = getChangeTrendData();

  expect(diffReleases.length).toBeGreaterThan(0);
  expect(trend).toHaveLength(diffReleases.length);
  expect(allTaxonomyChanges).toHaveLength(
    diffReleases.reduce(
      (total, release) => total + release.taxonomyChanges.length,
      0,
    ),
  );
  expect(latestChange).toMatchObject({
    version: latestVersion,
    releaseDate: getReleaseDate(latestRelease),
  });

  const v21 = diffReleases.find((release) => release.version === "2.1");
  expect(v21).toBeDefined();
  expect(getReleaseDate(v21!)).toBe("2025-04-06");

  const v21Trend = trend.find((release) => release.version === "2.1");
  expect(v21Trend).toMatchObject({
    deNovo: 26,
    genus: 20,
    lump: 14,
    split: 31,
  });
});

test("release notes use embedded notes before historical fallback", () => {
  const historicalNotes = getHistoricalReleaseNotes();
  expect(historicalNotes).toHaveLength(22);
  expect(getHistoricalReleaseNote("v1.0")).toContain(
    "currently recognized mammals",
  );

  const release = {
    version: "test",
    prevVersion: "previous",
    releaseNotes: "Embedded release note",
    taxonomyChanges: [],
    allChanges: [],
  } satisfies DiffRelease;
  expect(getReleaseNotes(release)).toBe("Embedded release note");
});

test("release versions map to their Zenodo records", () => {
  expect(getZenodoReleaseLink("v1.0")).toBe(
    "https://doi.org/10.5281/zenodo.4139723",
  );
  expect(getZenodoReleaseLink("1.12.1")).toBe(
    "https://doi.org/10.5281/zenodo.10595931",
  );
  expect(getZenodoReleaseLink("v2.4")).toBe(
    "https://doi.org/10.5281/zenodo.18135819",
  );
  expect(getZenodoReleaseLink("2.5")).toBe(
    "https://doi.org/10.5281/zenodo.21654811",
  );
  expect(getZenodoReleaseLink("3.0")).toBeUndefined();
});

test("diff display formatting preserves citation text around links", () => {
  expect(formatDiffName("Crocidura_darvishi")).toBe("Crocidura darvishi");
  expect(formatDiffName("Crocidura_zhadaensis")).toBe("Crocidura zhadaensis");

  expect(
    tokenizeDiffReference(
      "Source doi:10.1206/4030.1.; DOI 10.1002/ece3.70215, https://example.org/page.",
    ),
  ).toEqual([
    { type: "text", text: "Source " },
    {
      type: "link",
      text: "doi:10.1206/4030.1",
      href: "https://doi.org/10.1206/4030.1",
    },
    { type: "text", text: ".; " },
    {
      type: "link",
      text: "DOI 10.1002/ece3.70215",
      href: "https://doi.org/10.1002/ece3.70215",
    },
    { type: "text", text: ", " },
    {
      type: "link",
      text: "https://example.org/page",
      href: "https://example.org/page",
    },
    { type: "text", text: "." },
  ]);

  expect(tokenizeDiffText("See _Spalax_|_M. sp._, a#59343.")).toEqual([
    { type: "text", text: "See " },
    { type: "italic", text: "Spalax" },
    { type: "text", text: " · " },
    { type: "italic", text: "M. sp." },
    { type: "text", text: ", " },
    {
      type: "link",
      text: "a#59343",
      href: "https://hesperomys.com/a/59343",
    },
    { type: "text", text: "." },
  ]);

  expect(
    tokenizeDiffReference(
      "Ecology and Evolution, 16(7), e73991. 10.1002/ece3.73991",
    ),
  ).toEqual([
    { type: "text", text: "Ecology and Evolution, 16(7), e73991. " },
    {
      type: "link",
      text: "10.1002/ece3.73991",
      href: "https://doi.org/10.1002/ece3.73991",
    },
  ]);
});

test("release index summarizes changes by category", async ({ page }) => {
  await page.goto("/releases");

  await expect(page).toHaveTitle("MDD Release Notes");
  await expect(
    page.getByRole("heading", { name: `MDD v${currentVersion} Latest` }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "MDD v2.1" })).toBeVisible();
  const currentReleaseSection = page.locator(
    `section[id="release-v${currentVersion}"]`,
  );
  await expect(
    currentReleaseSection.getByText("Latest", { exact: true }),
  ).toHaveClass(/rounded-full/);
  await expect(
    currentReleaseSection.getByRole("link", {
      name: `Download MDD v${currentVersion}`,
    }),
  ).toHaveAttribute("href", MDD_DOWNLOAD_LINK);
  const zenodoPrompt = currentReleaseSection
    .locator("span")
    .filter({ hasText: "View on" });
  await expect(zenodoPrompt).toBeVisible();
  await expect(zenodoPrompt).toHaveClass(/text-xs/);
  const latestZenodoLink = currentReleaseSection.getByRole("link", {
    name: "Zenodo",
  });
  await expect(latestZenodoLink).toHaveAttribute(
    "href",
    getZenodoReleaseLink(currentVersion)!,
  );
  await expect(latestZenodoLink).toHaveAttribute("target", "_blank");
  await expect(latestZenodoLink).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
  await expect(
    currentReleaseSection.getByRole("link", { name: "View on Zenodo" }),
  ).toHaveCount(0);

  const v24Download = page
    .locator('section[id="release-v2.4"]')
    .getByRole("link", { name: "Download MDD v2.4" });
  await expect(v24Download).toHaveAttribute(
    "href",
    "https://doi.org/10.5281/zenodo.18135819",
  );
  await expect(v24Download).toHaveAttribute("target", "_blank");
  await expect(v24Download).toHaveAttribute("rel", "noopener noreferrer");

  const v10Download = page
    .locator('section[id="release-v1.0"]')
    .getByRole("link", { name: "Download MDD v1.0" });
  await expect(
    v10Download,
  ).toHaveAttribute("href", "https://doi.org/10.5281/zenodo.4139723");
  await expect(v10Download).toHaveAttribute("target", "_blank");
  const latestReleaseNotes = getReleaseNotes(latestRelease);
  expect(latestReleaseNotes).toBeDefined();
  await expect(
    page.getByText(latestReleaseNotes!, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("De Novo").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "All changes" }).first(),
  ).toHaveAttribute("href", `/releases/all-diffs/${latestVersion}`);
  await expect(
    page
      .locator('section[id="release-v2.3"]')
      .getByRole("link", { name: "Taxonomy changes" }),
  ).toHaveAttribute("href", "/releases/diff-changes/2.3");
  await expect(
    page
      .locator('section[id="release-v2.3"]')
      .getByRole("heading", { name: "Taxonomy changes from v2.2 to v2.3" }),
  ).toBeVisible();
  await expect(page.getByText("Taxonomy changes made to produce")).toHaveCount(
    0,
  );
  await expect(page.getByText("Show all changes")).toHaveCount(0);
  await expect(
    page.getByText("Previous version:", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Field changes by type")).toHaveCount(0);
  await expect(
    page.locator('a[href="/releases/diff-changes/2.1"]'),
  ).toHaveCount(1);

  await expect(
    page.locator("section[id^='release-v']").first(),
  ).toHaveAttribute("id", `release-v${latestVersion}`);
  await expect(
    page.locator('section[id="release-v2.3"] .overflow-x-auto').first(),
  ).toHaveClass(/rounded-2xl/);
});

test("detail pages render JSON changes through tables", async ({ page }) => {
  await page.goto("/releases/diff-changes/2.1");
  await expect(
    page.getByRole("heading", { name: "MDD v2.1 Taxonomy Changes" }),
  ).toBeVisible();
  await expect(page.getByText("215 taxonomy changes")).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(215);
  const taxonomyNameCells = await page
    .locator("table tbody tr td:nth-child(1), table tbody tr td:nth-child(2)")
    .allTextContents();
  expect(taxonomyNameCells.every((text) => !text.includes("_"))).toBe(true);
  await expect(
    page.locator('a[href="https://doi.org/10.1206/4030.1"]').first(),
  ).toHaveAttribute("target", "_blank");
  await expect(
    page.locator('a[href="https://doi.org/10.1206/4030.1"]').first(),
  ).toHaveAttribute("rel", "noopener noreferrer");
  await expect(
    page
      .locator('a[href="https://bibdigital.rjb.csic.es/idurl/1/9635"]')
      .first(),
  ).toBeVisible();

  await page.goto("/releases/diff-changes/2.5");
  await expect(
    page.locator('a[href="https://doi.org/10.1002/ece3.73991"]'),
  ).toHaveAttribute("target", "_blank");

  await page.goto("/releases/all-diffs/2.1");
  await expect(
    page.getByRole("heading", { name: "MDD v2.1 All Changes" }),
  ).toBeVisible();
  await expect(page.getByText("4,683 field changes")).toBeVisible();
  await expect(page.getByText("Field changes by type")).toBeVisible();
  await expect(page.locator("table").first().locator("tbody tr")).toHaveCount(
    3,
  );
  await expect(page.locator("table").nth(1).locator("tbody tr")).toHaveCount(
    4683,
  );
  const allChangesTable = page.locator("table").nth(1);
  const pipeSeparatedRow = allChangesTable.locator("tbody tr").filter({
    hasText: "1003320",
  });
  await expect(pipeSeparatedRow.locator("td").nth(6)).toContainText(
    "neobrittanicus Tate & Archbold, 1935 · neobritannicus",
  );
  await expect(pipeSeparatedRow.locator("td").nth(6)).not.toContainText("|");

  const italicizedRow = allChangesTable.locator("tbody tr").filter({
    hasText: "1006158",
  });
  await expect(italicizedRow.locator("td").nth(6).locator("i")).toHaveText(
    "Madoqua",
  );
  const fieldNameCells = await page
    .locator(
      "table:nth-of-type(2) tbody tr td:nth-child(2), table:nth-of-type(2) tbody tr td:nth-child(3)",
    )
    .allTextContents();
  expect(fieldNameCells.every((text) => !text.includes("_"))).toBe(true);
  await expect(page.locator(".overflow-x-auto").first()).toHaveClass(
    /rounded-2xl/,
  );
  await expect(page.locator(".overflow-x-auto").nth(1)).toHaveClass(
    /rounded-2xl/,
  );
});

test("aggregated taxonomy changes page renders release metadata", async ({
  page,
}) => {
  await page.goto("/releases/taxonomy-changes");

  await expect(page).toHaveTitle("MDD Taxonomy Changes since v2");
  await expect(
    page.getByRole("heading", { name: "MDD Taxonomy Changes since v2" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      `${allTaxonomyChanges.length.toLocaleString()} taxonomy changes`,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Version" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Release date" }),
  ).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(
    allTaxonomyChanges.length,
  );
  await expect(page.locator("table tbody tr").first()).toContainText(
    `v${latestChange.version}`,
  );
  await expect(page.locator("table tbody tr").first()).toContainText(
    formatDate(latestChange.releaseDate)!,
  );
  const aggregatedNameCells = await page
    .locator("table tbody tr td:nth-child(3), table tbody tr td:nth-child(4)")
    .allTextContents();
  expect(aggregatedNameCells.every((text) => !text.includes("_"))).toBe(true);
});

test("homepage links to releases and renders the change chart", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText("Download previous versions.", { exact: true })).toBeVisible();
  const previousVersionsLink = page.getByRole("link", {
    name: "previous versions",
  });
  await expect(previousVersionsLink).toHaveAttribute("href", "/releases");
  await expect(previousVersionsLink).toHaveAttribute("target", "_self");
  await expect(
    page.getByText("Previous versions are available on", { exact: false }),
  ).toHaveCount(0);

  const learnMore = page.getByRole("link", { name: "Learn more" });
  await expect(learnMore).toHaveAttribute("href", "/releases");
  await expect(learnMore).toHaveCSS("color", "rgb(214, 202, 177)");

  const chartHeading = page.getByRole("heading", {
    name: "Trends in Mammal Taxonomy",
  });
  await chartHeading.scrollIntoViewIfNeeded();
  await expect(chartHeading).toBeVisible();
  await expect(
    chartHeading.locator("..").locator("svg[viewBox]"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Show all changes" }),
  ).toHaveAttribute("href", "/releases/taxonomy-changes");
});

test("release chart preserves a readable width on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");

  const chart = page.getByLabel("Taxonomic change trend chart");
  await chart.scrollIntoViewIfNeeded();
  await expect(chart).toHaveCSS("overflow-x", "auto");
  await expect(chart.locator("svg[viewBox]")).toBeVisible();

  const dimensions = await chart.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    svgWidth:
      element.querySelector("svg[viewBox]")?.getBoundingClientRect().width ?? 0,
  }));

  expect(dimensions.svgWidth).toBeGreaterThanOrEqual(400);
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
});

test("release chart labels meet WCAG AA contrast in both color schemes", async ({
  page,
}) => {
  const schemes = [
    { name: "light" as const, foreground: "#273a39", background: "#ffffff" },
    { name: "dark" as const, foreground: "#f4f9f8", background: "#273a39" },
  ];

  for (const scheme of schemes) {
    await page.emulateMedia({ colorScheme: scheme.name });
    await page.goto("/");

    const chart = page.getByLabel("Taxonomic change trend chart");
    await chart.scrollIntoViewIfNeeded();
    const svg = chart.locator("svg[role=img]");
    await expect(svg).toBeVisible();

    const colors = await chart.evaluate((element) => {
      const plot = element.querySelector("svg[role=img]");
      const axisText = plot?.querySelector("text");
      const legend = element.querySelector('[aria-label="Chart legend"]');

      return {
        plot: plot ? getComputedStyle(plot).color : "",
        axisText: axisText ? getComputedStyle(axisText).fill : "",
        legend: legend ? getComputedStyle(legend).color : "",
      };
    });
    const expectedRgb = scheme.foreground
      .replace("#", "")
      .match(/.{2}/g)
      ?.map((channel) => Number.parseInt(channel, 16))
      .join(", ");

    expect(colors.plot).toBe(`rgb(${expectedRgb})`);
    expect(colors.axisText).toBe(`rgb(${expectedRgb})`);
    expect(colors.legend).toBe(`rgb(${expectedRgb})`);
    expect(
      contrastRatio(scheme.foreground, scheme.background),
    ).toBeGreaterThanOrEqual(4.5);
  }
});

test("release chart tooltips match country map colors", async ({ page }) => {
  const schemes = [
    {
      name: "light" as const,
      fill: "rgb(255, 255, 255)",
      stroke: "rgb(39, 58, 57)",
    },
    {
      name: "dark" as const,
      fill: "rgb(31, 41, 55)",
      stroke: "rgb(244, 249, 248)",
    },
  ];

  for (const scheme of schemes) {
    await page.emulateMedia({ colorScheme: scheme.name });
    await page.goto("/");

    const chart = page.getByLabel("Taxonomic change trend chart");
    await chart.scrollIntoViewIfNeeded();
    const svg = chart.locator("svg[role=img]");
    await expect(svg).toBeVisible();
    await svg.locator('g[aria-label="dot"] circle').first().hover();

    const tooltip = svg.locator('g[aria-label="tip"]:visible').first();
    await expect(tooltip).toBeVisible();
    const tooltipColors = await tooltip.locator("path").evaluate((path) => ({
      fill: getComputedStyle(path).fill,
      stroke: getComputedStyle(path).stroke,
    }));

    expect(tooltipColors.fill).toBe(scheme.fill);
    expect(tooltipColors.stroke).toBe(scheme.stroke);
  }
});
