import { getSpeciesData } from "../../db/mdd";

const taxa = getSpeciesData();

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

const exploreTaxonTable: Record<string, OrderData> = {};

class ExploreTaxonTable {
  constructor() {
    this.buildTable();
  }

  private buildTable() {
    taxa.forEach((taxon) => {
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

      if (!exploreTaxonTable[order]) {
        exploreTaxonTable[order] = {
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

      const orderData = exploreTaxonTable[order];

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

      if (extinct === 1) {
        genusData.extinct_species_count += 1;
        genusData.species.extinct_species.push({
          mdd_id: (taxon as any).mddId,
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

      // Update counts
      familyData.genus_count = familyData.genera.length;
      orderData.family_count = orderData.family_list.length;
      orderData.genus_count = [
        ...new Set(
          orderData.family_list.flatMap((f) => f.genera.map((g) => g.genus))
        ),
      ].length;
    });
  }

  public getTaxonTable(): Record<string, OrderData> {
    return exploreTaxonTable;
  }
}

export const taxonTableInstance = new ExploreTaxonTable();
export type {
  Taxon,
  OrderData,
  FamilyData,
  GenusData,
  SpeciesListData,
  SpeciesIdData,
};
