import { test, expect } from "@playwright/test";
import {
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

test("diff parser exposes JSON releases and fallback dates", () => {
  const releases = getDiffReleases();
  const trend = getChangeTrendData();
  const allTaxonomyChanges = getAllTaxonomyChanges();

  expect(releases.length).toBeGreaterThan(0);
  expect(trend).toHaveLength(releases.length);
  expect(allTaxonomyChanges).toHaveLength(
    releases.reduce((total, release) => total + release.taxonomyChanges.length, 0),
  );
  expect(allTaxonomyChanges[0]).toMatchObject({
    version: "2.4",
    releaseDate: "2026-01-02",
  });

  const v21 = releases.find((release) => release.version === "2.1");
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
    version: "2.4",
    prevVersion: "2.3",
    releaseNotes: "Embedded release note",
    taxonomyChanges: [],
    allChanges: [],
  } satisfies DiffRelease;
  expect(getReleaseNotes(release)).toBe("Embedded release note");
});

test("release index summarizes changes by category", async ({ page }) => {
  await page.goto("/releases");

  await expect(page).toHaveTitle("MDD Release Notes");
  await expect(page.getByRole("heading", { name: "MDD v2.4" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "MDD v2.1" })).toBeVisible();
  await expect(page.getByText(/We found 6,495 species of currently recognized mammals/)).toBeVisible();
  await expect(page.getByText("De Novo").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "All changes" }).first(),
  ).toHaveAttribute("href", "/releases/all-diffs/2.4");
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
    "release-v2.4",
  );
  await expect(page.locator('section[id="release-v2.3"] .overflow-x-auto').first()).toHaveClass(/rounded-2xl/);
});

test("detail pages render JSON changes through tables", async ({ page }) => {
  await page.goto("/releases/diff-changes/2.1");
  await expect(page.getByRole("heading", { name: "MDD v2.1 Taxonomy Changes" })).toBeVisible();
  await expect(page.getByText("215 taxonomy changes")).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(215);

  await page.goto("/releases/all-diffs/2.1");
  await expect(page.getByRole("heading", { name: "MDD v2.1 All Changes" })).toBeVisible();
  await expect(page.getByText("4,683 field changes")).toBeVisible();
  await expect(page.getByText("Field changes by type")).toBeVisible();
  await expect(page.locator("table").first().locator("tbody tr")).toHaveCount(3);
  await expect(page.locator("table").nth(1).locator("tbody tr")).toHaveCount(4683);
  await expect(page.locator(".overflow-x-auto").first()).toHaveClass(/rounded-2xl/);
  await expect(page.locator(".overflow-x-auto").nth(1)).toHaveClass(/rounded-2xl/);
});

test("aggregated taxonomy changes page renders release metadata", async ({ page }) => {
  await page.goto("/releases/taxonomy-changes");

  await expect(page).toHaveTitle("MDD Taxonomy Changes since v2");
  await expect(page.getByRole("heading", { name: "MDD Taxonomy Changes since v2" })).toBeVisible();
  await expect(page.getByText("735 taxonomy changes")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Version" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Release date" })).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(735);
  await expect(page.locator("table tbody tr").first()).toContainText("v2.4");
  await expect(page.locator("table tbody tr").first()).toContainText("January 2, 2026");
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
