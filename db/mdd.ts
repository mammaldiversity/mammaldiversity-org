// Parser for parsing the MDD json file
import type { MddData, SpeciesData, Metadata, Synonym } from "./mdd_model";
import mddRaw from "../db/data/mdd.json";

function parseMDDJson(): MddData {
  return mddRaw as unknown as MddData;
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
