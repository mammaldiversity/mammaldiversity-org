// Parser for parsing the MDD json file
import fs from "fs";
import type { MddData, Synonym, SynonymName, Taxonomy } from "./model";
import { createAuthorityCitation, createSynonymName } from "../src/scripts/taxon";

function parseMDDJson(): MddData {
  const rawData = fs.readFileSync("./db/data/mdd.json", "utf8");
  const jsonData: MddData = JSON.parse(rawData);
  return jsonData;
}

function getSpeciesData(): Taxonomy[] {
  return parseMDDJson().data;
}

// Parse the MDD json file and return the taxonomy data
function getTaxonomyData(speciesId: number): Taxonomy {
  // Find the taxonomy data based on the speciesID
  const data = parseMDDJson().data;
  const taxonomy = data
    ? data.find((taxonomy) => taxonomy.id === speciesId)
    : null;
  return taxonomy || ({} as Taxonomy);
}

function filterSynonymData(synonym: Synonym[], speciesId: number): Synonym[] {
  // Filter the synonyms based on the speciesID
  return parseMDDJson().synonyms.filter(
    (synonym) => synonym.speciesId === speciesId
  );
}

function getSynonymName(synonym: Synonym[], speciesId: number): SynonymName[] {
  const data = filterSynonymData(synonym, speciesId);
  return data.map((synonym) => {
    const name = createSynonymName(synonym.rootName, synonym.species);
    const citation = createAuthorityCitation(
      synonym.author,
      synonym.year,
      synonym.authorityParentheses === 1
    );
    return { name, citation };
  });
}


function getAllSynonyms(): Synonym[] {
  return parseMDDJson().synonyms;
}

export { getSpeciesData, getTaxonomyData, filterSynonymData, getAllSynonyms, getSynonymName };
