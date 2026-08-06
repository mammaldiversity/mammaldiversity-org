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

export {
  getHistoricalReleaseDate,
  getHistoricalReleaseNote,
  getHistoricalReleaseNotes,
};
export type { HistoricalReleaseNote };
