// Parser for parsing the MDD json file
import fs from "fs";
import type { MddData, Synonym, Taxonomy } from "./model";

function parseMDDJson(): MddData {
  const rawData = fs.readFileSync("./db/data/mdd.json", "utf8");
  const jsonData: MddData = JSON.parse(rawData);
  return jsonData;
}

export async function getSpeciesData(): Promise<Taxonomy[]> {
  return await parseMDDJson().data;
}

// Parse the MDD json file and return the taxonomy data
export async function getTaxonomyData(speciesId: number): Promise<Taxonomy> {
  // Find the taxonomy data based on the speciesID
  const data = parseMDDJson().data;
  const taxonomy = data
    ? data.find((taxonomy) => taxonomy.id === speciesId)
    : null;
  return taxonomy || ({} as Taxonomy);
}

export async function getSynonymData(speciesId: number): Promise<Synonym[]> {
  // Filter the synonyms based on the speciesID
  return await parseMDDJson().synonyms.filter(
    (synonym) => synonym.speciesId === speciesId
  );
}
