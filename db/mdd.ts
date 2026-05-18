// Parser for parsing the MDD json file
import type { MddData, SpeciesData, Metadata, Synonym, Phylo } from "./mdd_model";
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

/**
 * Filter these columns from Taxonomy interface:
 * - subclass
 * - infraclass
 * - magnorder
 * - superorder
 * - taxonOrder
 * - suborder
 * - infraorder
 * - parvorder
 * - superfamily
 * - family
 * - subfamily
 * - tribe
 * * - genus
 * - subgenus
 * - specificEpithet
 */
function getMddTaxonomyColumns(): Phylo[] {
  const taxonomy = getSpeciesData();
  const taxonomyColumns = taxonomy.map((species) => species.speciesData);
  const columns = taxonomyColumns.map((taxonomy) => {
    return {
      id: taxonomy.id,
      subclass: taxonomy.subclass,
      infraclass: taxonomy.infraclass,
      magnorder: taxonomy.magnorder,
      superorder: taxonomy.superorder,
      taxonOrder: taxonomy.taxonOrder,
      suborder: taxonomy.suborder,
      infraorder: taxonomy.infraorder,
      parvorder: taxonomy.parvorder,
      superfamily: taxonomy.superfamily,
      family: taxonomy.family,
      subfamily: taxonomy.subfamily,
      tribe: taxonomy.tribe,
      genus: taxonomy.genus,
      subgenus: taxonomy.subgenus,
      specificEpithet: taxonomy.specificEpithet,
    };
  });

  return columns;
}

function getSynonymOnly(): Synonym[] {
  const synonym = parseMDDJson().synonymOnly;
  return synonym;
}

function getOrder(): string[] {
  const data = getSpeciesData();
  const orders = data.map((species) => species.speciesData.taxonOrder);
  return [...new Set(orders)];
}

function getFamily(): string[] {
  const data = getSpeciesData();
  const families = data.map((species) => species.speciesData.family);
  return [...new Set(families)];
}

export {
  getSpeciesData,
  getSynonymOnly,
  getTaxonomyData,
  getSpeciesDataByIds,
  getMddTaxonomyColumns,
  filterSpeciesId,
  getMetadata,
  parseMDDJson,
  getOrder,
  getFamily,
};
