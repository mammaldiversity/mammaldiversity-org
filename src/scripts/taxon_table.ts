import { getSpeciesData, getSpeciesDataByIds } from "../../db/mdd";
import type { SpeciesData } from "../../db/mdd_model";

interface Taxon {
  id: number;
  family: string;
  genus: string;
  specificEpithet: string;
  authorityYear: string;
  commonName: string;
  synonyms: string[];
}

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

interface FamilyData {
  family: string;
  genus_count: number;
  living_species_count: number;
  extinct_species_count: number;
  genera: GenusData[];
}

interface GenusData {
  genus: string;
  living_species_count: number;
  extinct_species_count: number;
  species: SpeciesListData;
}

interface SpeciesListData {
  living_species: SpeciesIdData[];
  extinct_species: SpeciesIdData[];
}

interface SpeciesIdData {
  mdd_id: number;
  epithet: string;
}

class TaxonTableBuilder {
  private taxonTable: Record<string, OrderData> = {};

  build(taxaList: SpeciesData[]): Record<string, OrderData> {
    this.taxonTable = {};
    taxaList.forEach((taxon) => this.processTaxon(taxon));
    this.updateOrderGenusCounts();
    return this.taxonTable;
  }

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
  }

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

function buildTable(taxaList: SpeciesData[]) {
  return taxonTableBuilder.build(taxaList);
}

function getTaxonTable(): Record<string, OrderData> {
  const taxa = getSpeciesData();
  if (!taxa || taxa.length === 0) {
    throw new Error("No taxa data found");
  }
  return buildTable(taxa);
}

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

export { getTaxonTable, getTaxonDataByMddIds };
