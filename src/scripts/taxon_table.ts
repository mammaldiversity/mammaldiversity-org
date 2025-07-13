/**
 * @module taxon_table
 * This module is responsible for building a hierarchical taxonomic table from a flat list of species data.
 * It fetches data from the Mammal Diversity Database (MDD) stored  and processes it into a nested structure
 * of orders, families, genera, and species, which can then be used to display taxonomic information.
 * It provides functions to get the complete taxon table or a table for a specific list of MDD IDs.
 */
import { getSpeciesData, getSpeciesDataByIds } from "../../db/mdd";
import type { SpeciesData } from "../../db/mdd_model";

/**
 * Represents a single species with its taxonomic classification and other details.
 */
interface Taxon {
  id: number;
  family: string;
  genus: string;
  specificEpithet: string;
  authorityYear: string;
  commonName: string;
  synonyms: string[];
}

/**
 * Represents a taxonomic order, containing counts and a list of families.
 */
interface OrderData {
  subclass: string;
  infraclass: string;
  order: string;
  family_count: number;
  genus_count: number;
  living_species_count: number;
  extinct_species_count: number;
  family_list: FamilyData[];
}

/**
 * Represents a taxonomic family, containing counts and a list of genera.
 */
interface FamilyData {
  family: string;
  genus_count: number;
  living_species_count: number;
  extinct_species_count: number;
  genera: GenusData[];
}

/**
 * Represents a taxonomic genus, containing counts and a list of species.
 */
interface GenusData {
  genus: string;
  living_species_count: number;
  extinct_species_count: number;
  species: SpeciesListData;
}

/**
 * Represents lists of living and extinct species within a genus.
 */
interface SpeciesListData {
  living_species: SpeciesIdData[];
  extinct_species: SpeciesIdData[];
}

/**
 * Represents a species with its MDD ID and specific epithet.
 */
interface SpeciesIdData {
  mdd_id: number;
  epithet: string;
}

/**
 * A class to construct a hierarchical taxonomic table from a flat list of species data.
 */
class TaxonTableBuilder {
  private taxonTable: Record<string, OrderData> = {};

  /**
   * Builds a hierarchical taxonomic table from a flat list of species data.
   * @param taxaList A list of species data.
   * @returns A record of orders, each containing families, genera, and species.
   */
  build(taxaList: SpeciesData[]): Record<string, OrderData> {
    this.taxonTable = {};
    taxaList.forEach((taxon) => this.processTaxon(taxon));
    this.updateOrderGenusCounts();
    return this.taxonTable;
  }

  /**
   * Processes a single taxon and adds it to the table.
   * @param taxon The species data to process.
   */
  private processTaxon(taxon: SpeciesData) {
    const {
      speciesData: {
        taxonOrder: order,
        subclass,
        infraclass,
        family,
        genus,
        specificEpithet,
        extinct,
        id,
      },
    } = taxon as any;

    const orderData = this.getOrCreateOrder(order, subclass, infraclass);
    const familyData = this.getOrCreateFamily(orderData, family);
    const genusData = this.getOrCreateGenus(familyData, genus);

    this.addSpecies(
      genusData,
      familyData,
      orderData,
      extinct,
      id,
      specificEpithet
    );

    // Update counts
    familyData.genus_count = familyData.genera.length;
    orderData.family_count = orderData.family_list.length;
    
    // We sort all genus, the living and extinct species list in alphabetical order
    // For easier navigation and consistency
    familyData.genera.sort((a, b) => a.genus.localeCompare(b.genus));
    genusData.species.living_species.sort((a, b) =>
      a.epithet.localeCompare(b.epithet)
    );
    genusData.species.extinct_species.sort((a, b) =>
      a.epithet.localeCompare(b.epithet)
    );
  }

  /**
   * Gets or creates an order in the taxon table.
   * @param order The name of the order.
   * @param subclass The name of the subclass.
   * @param infraclass The name of the infraclass.
   * @returns The data for the order.
   */
  private getOrCreateOrder(
    order: string,
    subclass: string,
    infraclass: string
  ): OrderData {
    if (!this.taxonTable[order]) {
      this.taxonTable[order] = {
        subclass,
        infraclass,
        order,
        family_count: 0,
        genus_count: 0,
        living_species_count: 0,
        extinct_species_count: 0,
        family_list: [],
      };
    }
    return this.taxonTable[order];
  }

  /**
   * Gets or creates a family within an order.
   * @param orderData The data for the order.
   * @param family The name of the family.
   * @returns The data for the family.
   */
  private getOrCreateFamily(orderData: OrderData, family: string): FamilyData {
    let familyData = orderData.family_list.find((f) => f.family === family);
    if (!familyData) {
      familyData = {
        family,
        genus_count: 0,
        living_species_count: 0,
        extinct_species_count: 0,
        genera: [],
      };
      orderData.family_list.push(familyData);
    }
    return familyData;
  }

  /**
   * Gets or creates a genus within a family.
   * @param familyData The data for the family.
   * @param genus The name of the genus.
   * @returns The data for the genus.
   */
  private getOrCreateGenus(familyData: FamilyData, genus: string): GenusData {
    let genusData = familyData.genera.find((g) => g.genus === genus);
    if (!genusData) {
      genusData = {
        genus,
        living_species_count: 0,
        extinct_species_count: 0,
        species: {
          living_species: [],
          extinct_species: [],
        },
      };
      familyData.genera.push(genusData);
    }
    return genusData;
  }

  /**
   * Adds a species to the appropriate genus, family, and order, and updates the counts.
   * @param genusData The data for the genus.
   * @param familyData The data for the family.
   * @param orderData The data for the order.
   * @param extinct Whether the species is extinct (1) or living (0).
   * @param id The MDD ID of the species.
   * @param specificEpithet The specific epithet of the species.
   */
  private addSpecies(
    genusData: GenusData,
    familyData: FamilyData,
    orderData: OrderData,
    extinct: number,
    id: number,
    specificEpithet: string
  ) {
    if (extinct === 1) {
      genusData.extinct_species_count += 1;
      genusData.species.extinct_species.push({
        mdd_id: id,
        epithet: specificEpithet,
      });
      familyData.extinct_species_count += 1;
      orderData.extinct_species_count += 1;
    } else {
      genusData.living_species_count += 1;
      genusData.species.living_species.push({
        mdd_id: id,
        epithet: specificEpithet,
      });
      familyData.living_species_count += 1;
      orderData.living_species_count += 1;
    }
  }

  /**
   * Updates the genus counts for each order after the table has been built.
   */
  private updateOrderGenusCounts() {
    Object.values(this.taxonTable).forEach((orderData) => {
      orderData.genus_count = [
        ...new Set(
          orderData.family_list.flatMap((f) => f.genera.map((g) => g.genus))
        ),
      ].length;
    });
  }
}

const taxonTableBuilder = new TaxonTableBuilder();

/**
 * Builds the taxon table from a list of species data.
 * @param taxaList The list of species data.
 * @returns The taxon table.
 */
function buildTable(taxaList: SpeciesData[]) {
  return taxonTableBuilder.build(taxaList);
}

/**
 * Gets the complete taxon data in a hierarchical structure.
 * This function retrieves species data from the Mammal Diversity Database (MDD),
 * stored in the db directory: `db/data/ and parses it into a nested structure
 * of orders, families, genera, and species.
 * @returns The complete taxon table.
 * @throws An error if no taxa data is found.
 */
function getHierarchicalTaxonData(): Record<string, OrderData> {
  const taxa = getSpeciesData();
  if (!taxa || taxa.length === 0) {
    throw new Error("No taxa data found");
  }
  return buildTable(taxa);
}

/**
 * Gets the taxon table for a specific list of MDD IDs.
 * @param mddIds A list of MDD IDs.
 * @returns The taxon table for the specified MDD IDs.
 * @throws An error if no taxa data is found for the provided IDs.
 */
function getTaxonDataByMddIds(mddIds: number[]): Record<string, OrderData> {
  const taxonList = getSpeciesDataByIds(mddIds);
  if (!taxonList || taxonList.length === 0) {
    throw new Error(
      "No taxa data found for the provided MDD IDs: " + mddIds.join(", ")
    );
  }
  return buildTable(taxonList);
}

export type {
  Taxon,
  OrderData,
  FamilyData,
  GenusData,
  SpeciesListData,
  SpeciesIdData,
};

export { getHierarchicalTaxonData, getTaxonDataByMddIds };
