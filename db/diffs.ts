import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { getHistoricalReleaseDate, getHistoricalReleaseNote } from "./release_notes";
import type {
  DiffRelease,
  FieldChange,
  ReleaseTaxonomyChange,
  ReleaseChangeTrend,
  TaxonomyChange,
} from "./diffs_model";

// Keep the diff dataset out of Vite's module graph. The uncompressed JSON is
// several megabytes and should only be parsed when the server/build needs it.
const diffsPath = resolve(process.cwd(), "db/data/diffs.json.gz");

const FALLBACK_RELEASE_DATES: Record<string, string> = {
  "2.1": "2025-04-06",
  "2.2": "2025-06-13",
  "2.3": "2025-09-01",
  "2.4": "2026-01-02",
};

let cachedDiffs: DiffRelease[] | undefined;

function cleanVersion(version: string): string {
  return version.startsWith("v") ? version.slice(1) : version;
}

function parseDiffsJson(): DiffRelease[] {
  if (!cachedDiffs) {
    cachedDiffs = JSON.parse(
      gunzipSync(readFileSync(diffsPath)).toString("utf8"),
    ) as DiffRelease[];
  }

  return cachedDiffs;
}

function getDiffReleases(): DiffRelease[] {
  return parseDiffsJson();
}

function getDiffRelease(version: string): DiffRelease | undefined {
  const normalizedVersion = cleanVersion(version);
  return getDiffReleases().find(
    (release) => cleanVersion(release.version) === normalizedVersion,
  );
}

function getReleaseDate(release: DiffRelease): string | undefined {
  const jsonDate = release.releaseDate?.trim();
  return (
    jsonDate ||
    FALLBACK_RELEASE_DATES[cleanVersion(release.version)] ||
    getHistoricalReleaseDate(release.version)
  );
}

function getReleaseNotes(release: DiffRelease): string | undefined {
  return release.releaseNotes?.trim() || getHistoricalReleaseNote(release.version);
}

function getTaxonomyCategoryCounts(
  changes: TaxonomyChange[],
): Record<string, number> {
  return changes.reduce<Record<string, number>>((counts, change) => {
    counts[change.category] = (counts[change.category] ?? 0) + 1;
    return counts;
  }, {});
}

function getFieldCategoryCounts(
  changes: FieldChange[],
): Record<string, number> {
  return changes.reduce<Record<string, number>>((counts, change) => {
    counts[change.category] = (counts[change.category] ?? 0) + 1;
    return counts;
  }, {});
}

function getChangeTrendData(): ReleaseChangeTrend[] {
  return getDiffReleases()
    .map((release) => {
    const counts = getTaxonomyCategoryCounts(release.taxonomyChanges);

    return {
      version: cleanVersion(release.version),
      releaseDate: getReleaseDate(release),
      deNovo: counts["de novo"] ?? 0,
      genus: counts["genus change"] ?? 0,
      lump: counts.lump ?? 0,
      split: counts.split ?? 0,
    };
    })
    .sort((left, right) => {
      const leftDate = left.releaseDate
        ? Date.parse(`${left.releaseDate}T00:00:00Z`)
        : Number.NEGATIVE_INFINITY;
      const rightDate = right.releaseDate
        ? Date.parse(`${right.releaseDate}T00:00:00Z`)
        : Number.NEGATIVE_INFINITY;

      return leftDate - rightDate;
    });
}

function getAllTaxonomyChanges(): ReleaseTaxonomyChange[] {
  return [...getDiffReleases()]
    .sort((left, right) => {
      const leftDate = getReleaseDate(left);
      const rightDate = getReleaseDate(right);
      const dateDifference =
        (rightDate ? Date.parse(`${rightDate}T00:00:00Z`) : 0) -
        (leftDate ? Date.parse(`${leftDate}T00:00:00Z`) : 0);

      return (
        dateDifference ||
        cleanVersion(right.version).localeCompare(cleanVersion(left.version), undefined, {
          numeric: true,
        })
      );
    })
    .flatMap((release) =>
      release.taxonomyChanges.map((change) => ({
        ...change,
        version: cleanVersion(release.version),
        releaseDate: getReleaseDate(release),
      })),
    );
}

export {
  cleanVersion,
  getChangeTrendData,
  getAllTaxonomyChanges,
  getDiffRelease,
  getDiffReleases,
  getFieldCategoryCounts,
  getReleaseDate,
  getReleaseNotes,
  getTaxonomyCategoryCounts,
  parseDiffsJson,
};
