interface CountryData {
  countryName: string;
  totalOrders: number;
  totalFamilies: number;
  totalGenera: number;
  totalLivingSpecies: number;
  totalExtinctSpecies: number;
  /**
   * List of MDD species IDs distributed in the country.
   * Includes both living and extinct species.
   * predicted distribution suffix with '?'.
   */
  speciesList: string[];
}

interface CountryMDDStats {
  totalCountries: number;
  domesticated: number[];
  widespread: number[];
  /**
   * Map of country code (e.g., "US") to CountryData.
   */
  countryData: Record<string, CountryData>;
}

export type { CountryData, CountryMDDStats };
