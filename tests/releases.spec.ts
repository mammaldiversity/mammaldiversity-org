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
} from "../db/release_notes";
import type { DiffRelease } from "../db/diffs_model";
import { getMetadata } from "../db/mdd";
import {
  cleanVersion as cleanMetadataVersion,
  formatDate,
} from "../src/libs/metadata";
import { MDD_DOWNLOAD_LINK } from "../src/libs/permalink";
import { formatDiffName, tokenizeDiffReference } from "../src/libs/diff-display";

const diffReleases = getDiffReleases();
const allTaxonomyChanges = getAllTaxonomyChanges();
const latestChange = allTaxonomyChanges[0];
const latestRelease = diffReleases.find(
  (release) => cleanVersion(release.version) === latestChange.version,
)!;
const latestVersion = cleanVersion(latestRelease.version);
const currentVersion = cleanMetadataVersion(getMetadata().version);

test("diff parser exposes JSON releases and fallback dates", () => {
  const trend = getChangeTrendData();

  expect(diffReleases.length).toBeGreaterThan(0);
  expect(trend).toHaveLength(diffReleases.length);
  expect(allTaxonomyChanges).toHaveLength(
    diffReleases.reduce((total, release) => total + release.taxonomyChanges.length, 0),
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
  expect(getHistoricalReleaseNote("v1.0")).toContain("currently recognized mammals");

  const release = {
    version: "test",
    prevVersion: "previous",
    releaseNotes: "Embedded release note",
    taxonomyChanges: [],
    allChanges: [],
  } satisfies DiffRelease;
  expect(getReleaseNotes(release)).toBe("Embedded release note");
});

test("diff display formatting preserves citation text around links", () => {
  expect(formatDiffName("Crocidura_darvishi")).toBe("Crocidura darvishi");
  expect(formatDiffName("Crocidura_zhadaensis")).toBe("Crocidura zhadaensis");

  expect(tokenizeDiffReference(
    "Source doi:10.1206/4030.1.; DOI 10.1002/ece3.70215, https://example.org/page.",
  )).toEqual([
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
  await expect(currentReleaseSection.getByText("Latest", { exact: true })).toHaveClass(
    /rounded-full/,
  );
  await expect(
    currentReleaseSection.getByRole("link", {
      name: `Download MDD v${currentVersion}`,
    }),
  ).toHaveAttribute("href", MDD_DOWNLOAD_LINK);
  await expect(
    page.locator('section[id="release-v2.4"]').getByRole("link", {
      name: /Download MDD/,
    }),
  ).toHaveCount(0);
  const latestReleaseNotes = getReleaseNotes(latestRelease);
  expect(latestReleaseNotes).toBeDefined();
  await expect(page.getByText(latestReleaseNotes!, { exact: true })).toBeVisible();
  await expect(page.getByText("De Novo").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "All changes" }).first(),
  ).toHaveAttribute("href", `/releases/all-diffs/${latestVersion}`);
  await expect(
    page.locator('section[id="release-v2.3"]').getByRole("link", { name: "Taxonomy changes" }),
  ).toHaveAttribute("href", "/releases/diff-changes/2.3");
  await expect(
    page.locator('section[id="release-v2.3"]').getByRole("heading", { name: "Taxonomy changes from v2.2 to v2.3" }),
  ).toBeVisible();
  await expect(page.getByText("Taxonomy changes made to produce")).toHaveCount(0);
  await expect(page.getByText("Show all changes")).toHaveCount(0);
  await expect(page.getByText("Previous version:", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Field changes by type")).toHaveCount(0);
  await expect(
    page.locator('a[href="/releases/diff-changes/2.1"]'),
  ).toHaveCount(1);

  await expect(page.locator("section[id^='release-v']").first()).toHaveAttribute(
    "id",
    `release-v${latestVersion}`,
  );
  await expect(page.locator('section[id="release-v2.3"] .overflow-x-auto').first()).toHaveClass(/rounded-2xl/);
});

test("detail pages render JSON changes through tables", async ({ page }) => {
  await page.goto("/releases/diff-changes/2.1");
  await expect(page.getByRole("heading", { name: "MDD v2.1 Taxonomy Changes" })).toBeVisible();
  await expect(page.getByText("215 taxonomy changes")).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(215);
  const taxonomyNameCells = await page
    .locator("table tbody tr td:nth-child(1), table tbody tr td:nth-child(2)")
    .allTextContents();
  expect(taxonomyNameCells.every((text) => !text.includes("_"))).toBe(true);
  await expect(page.locator('a[href="https://doi.org/10.1206/4030.1"]').first()).toHaveAttribute(
    "target",
    "_blank",
  );
  await expect(page.locator('a[href="https://doi.org/10.1206/4030.1"]').first()).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
  await expect(page.locator('a[href="https://bibdigital.rjb.csic.es/idurl/1/9635"]').first()).toBeVisible();

  await page.goto("/releases/all-diffs/2.1");
  await expect(page.getByRole("heading", { name: "MDD v2.1 All Changes" })).toBeVisible();
  await expect(page.getByText("4,683 field changes")).toBeVisible();
  await expect(page.getByText("Field changes by type")).toBeVisible();
  await expect(page.locator("table").first().locator("tbody tr")).toHaveCount(3);
  await expect(page.locator("table").nth(1).locator("tbody tr")).toHaveCount(4683);
  const fieldNameCells = await page
    .locator("table:nth-of-type(2) tbody tr td:nth-child(2), table:nth-of-type(2) tbody tr td:nth-child(3)")
    .allTextContents();
  expect(fieldNameCells.every((text) => !text.includes("_"))).toBe(true);
  await expect(page.locator(".overflow-x-auto").first()).toHaveClass(/rounded-2xl/);
  await expect(page.locator(".overflow-x-auto").nth(1)).toHaveClass(/rounded-2xl/);
});

test("aggregated taxonomy changes page renders release metadata", async ({ page }) => {
  await page.goto("/releases/taxonomy-changes");

  await expect(page).toHaveTitle("MDD Taxonomy Changes since v2");
  await expect(page.getByRole("heading", { name: "MDD Taxonomy Changes since v2" })).toBeVisible();
  await expect(
    page.getByText(`${allTaxonomyChanges.length.toLocaleString()} taxonomy changes`),
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Version" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Release date" })).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(allTaxonomyChanges.length);
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

test("homepage links to releases and renders the change chart", async ({ page }) => {
  await page.goto("/");

  const learnMore = page.getByRole("link", { name: "Learn more" });
  await expect(learnMore).toHaveAttribute(
    "href",
    "/releases",
  );
  await expect(learnMore).toHaveCSS("color", "rgb(214, 202, 177)");

  const chartHeading = page.getByRole("heading", {
    name: "Taxonomic Changes since the MDD v2 release",
  });
  await chartHeading.scrollIntoViewIfNeeded();
  await expect(chartHeading).toBeVisible();
  await expect(chartHeading.locator("..").locator("svg[viewBox]")).toBeVisible();
  await expect(page.getByRole("link", { name: "Show all changes" })).toHaveAttribute(
    "href",
    "/releases/taxonomy-changes",
  );
});
