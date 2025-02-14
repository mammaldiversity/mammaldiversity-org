// Parser for parsing the MDD json file
import fs from "fs";
import type {
  MddData,
  Synonym,
  SynonymName,
  SpeciesData,
  Metadata,
} from "./model";

function parseMDDJson(): MddData {
  const rawData = fs.readFileSync("./db/data/mdd.json", "utf8");
  const jsonData: MddData = JSON.parse(rawData);
  return jsonData;
}

function getSpeciesData(): SpeciesData[] {
  return parseMDDJson().data;
}

function getMetadata(): Metadata {
  const data = parseMDDJson();
  return {
    version: data.version,
    releaseDate: data.releaseDate,
  };
}

function filterSpeciesId(data: SpeciesData[]): number[] {
  return data.map((species) => species.mdd_id);
}

// Parse the MDD json file and return the taxonomy data
function getTaxonomyData(data: SpeciesData[], speciesId: number): SpeciesData {
  // Find the taxonomy data based on the speciesID
  const taxonomy = data.find((species) => species.mdd_id === speciesId);

  return taxonomy || ({} as SpeciesData);
}

export { getSpeciesData, getTaxonomyData, filterSpeciesId, getMetadata };
