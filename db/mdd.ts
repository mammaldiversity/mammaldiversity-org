// Parser for parsing the MDD json file
import fs from "fs";
import type { MddData, Synonym, Taxonomy } from "./model";

function parseMDDJson(): MddData {
  const rawData = fs.readFileSync("./db/data/mdd.json", "utf8");
  const jsonData: MddData = JSON.parse(rawData);
  return jsonData;
}

export function getSpeciesData(): Taxonomy[] {
  return parseMDDJson().data;
}

// Parse the MDD json file and return the taxonomy data
export function getTaxonomyData(speciesId: number): Taxonomy {
  // Find the taxonomy data based on the speciesID
  const data = parseMDDJson().data;
  const taxonomy = data
    ? data.find((taxonomy) => taxonomy.id === speciesId)
    : null;
  return taxonomy || ({} as Taxonomy);
}

export function getSynonymData(speciesId: number): Synonym[] {
  // Filter the synonyms based on the speciesID
  return parseMDDJson().synonyms.filter(
    (synonym) => synonym.speciesId === speciesId
  );
}
