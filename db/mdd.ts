// Parser for parsing the MDD json file
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

import type { MddData, SpeciesData, Metadata, Synonym } from "./mdd_model";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MDD_PATH = join(__dirname, "../db/data/mdd.json");

function parseMDDJson(): MddData {
  const rawData = readFileSync(MDD_PATH, "utf8");
  const jsonData: MddData = JSON.parse(rawData);
  return jsonData;
}

function getSpeciesData(): SpeciesData[] {
  return parseMDDJson().data;
}

function getMetadata(): Metadata {
  return parseMDDJson().metadata;
}

function filterSpeciesId(data: SpeciesData[]): number[] {
  return data.map((species) => species.mddId);
}

function getSpeciesDataByIds(ids: number[]): SpeciesData[] {
  const allSpeciesData = getSpeciesData();
  return allSpeciesData.filter((species) => ids.includes(species.mddId));
}

// Parse the MDD json file and return the taxonomy data
function getTaxonomyData(data: SpeciesData[], speciesId: number): SpeciesData {
  // Find the taxonomy data based on the speciesID
  const taxonomy = data.find((species) => species.mddId === speciesId);

  return taxonomy || ({} as SpeciesData);
}

function getSynonymOnly(): Synonym[] {
  const synonym = parseMDDJson().synonymOnly;
  console.log("Synonym Only: ", synonym);
  return synonym;
}

export {
  getSpeciesData,
  getSynonymOnly,
  getTaxonomyData,
  getSpeciesDataByIds,
  filterSpeciesId,
  getMetadata,
  parseMDDJson,
};
