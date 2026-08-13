import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface HistoricalReleaseNote {
  version: string;
  releaseNotes: string;
}

const HISTORICAL_RELEASE_DATES: Record<string, string> = {
  "2.4": "2026-01-02",
  "2.3": "2025-09-01",
  "2.2": "2025-06-13",
  "2.1": "2025-04-06",
  "2.0": "2025-03-11",
  "1.13": "2024-07-13",
  "1.12.1": "2024-01-30",
  "1.12": "2024-01-05",
  "1.11": "2023-04-15",
  "1.10": "2022-12-03",
  "1.9.1": "2022-06-29",
  "1.9": "2022-04-01",
  "1.8": "2022-02-01",
  "1.7": "2021-11-06",
  "1.6": "2021-08-10",
  "1.5": "2021-06-11",
  "1.4": "2021-04-11",
  "1.3.1": "2021-01-08",
  "1.3": "2020-12-28",
  "1.2": "2020-09-24",
  "1.1": "2019-03-29",
  "1.0": "2018-02-01",
};

const ZENODO_RELEASE_LINKS: Record<string, string> = {
  "2.5": "https://doi.org/10.5281/zenodo.21654811",
  "2.4": "https://doi.org/10.5281/zenodo.18135819",
  "2.3": "https://doi.org/10.5281/zenodo.17033774",
  "2.2": "https://doi.org/10.5281/zenodo.15659662",
  "2.1": "https://doi.org/10.5281/zenodo.15163494",
  "2.0": "https://doi.org/10.5281/zenodo.15007505",
  "1.13": "https://doi.org/10.5281/zenodo.12738010",
  "1.12.1": "https://doi.org/10.5281/zenodo.10595931",
  "1.12": "https://doi.org/10.5281/zenodo.10463715",
  "1.11": "https://doi.org/10.5281/zenodo.7830771",
  "1.10": "https://doi.org/10.5281/zenodo.7394529",
  "1.9.1": "https://doi.org/10.5281/zenodo.7358650",
  "1.9": "https://doi.org/10.5281/zenodo.6407053",
  "1.8": "https://doi.org/10.5281/zenodo.5945626",
  "1.7": "https://doi.org/10.5281/zenodo.5651212",
  "1.6": "https://doi.org/10.5281/zenodo.5175993",
  "1.5": "https://doi.org/10.5281/zenodo.4926590",
  "1.4": "https://doi.org/10.5281/zenodo.4679816",
  "1.3.1": "https://doi.org/10.5281/zenodo.4429371",
  "1.3": "https://doi.org/10.5281/zenodo.4397179",
  "1.2": "https://doi.org/10.5281/zenodo.4139818",
  "1.1": "https://doi.org/10.5281/zenodo.4139788",
  "1.0": "https://doi.org/10.5281/zenodo.4139723",
};

const notesPath = resolve(process.cwd(), "db/data/release_notes.json");
const notes = JSON.parse(
  readFileSync(notesPath, "utf8"),
) as HistoricalReleaseNote[];
const notesByVersion = new Map(notes.map((note) => [note.version, note]));

function cleanVersion(version: string): string {
  return version.startsWith("v") ? version.slice(1) : version;
}

function getHistoricalReleaseNotes(): HistoricalReleaseNote[] {
  return notes;
}

function getHistoricalReleaseNote(version: string): string | undefined {
  return notesByVersion.get(cleanVersion(version))?.releaseNotes.trim() || undefined;
}

function getHistoricalReleaseDate(version: string): string | undefined {
  return HISTORICAL_RELEASE_DATES[cleanVersion(version)];
}

function getZenodoReleaseLink(version: string): string | undefined {
  return ZENODO_RELEASE_LINKS[cleanVersion(version)];
}

export {
  getHistoricalReleaseDate,
  getHistoricalReleaseNote,
  getHistoricalReleaseNotes,
  getZenodoReleaseLink,
};
export type { HistoricalReleaseNote };
