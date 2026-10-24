import type { UnitedStatesData } from "./country_stats_model";
import unitedStatsRaw from "./data/usa_states.json";

/**
 * Get United States data.
 * @returns {Record<string, UnitedStatesData>} Object keyed by state code to UnitedStatesData.
 */
function getUnitedStatesData(): Record<string, UnitedStatesData> {
  const raw = unitedStatsRaw as any;
  const states = raw.state_data || raw.stateData || {};
  const result: Record<string, UnitedStatesData> = {};
  for (const key in states) {
    const s = states[key];
    result[key] = {
      stateCode: s.state_code ?? s.stateCode,
      totalOrder: s.total_order ?? s.totalOrder,
      totalFamily: s.total_family ?? s.totalFamily,
      totalGenus: s.total_genus ?? s.totalGenus,
      totalLivingSpecies: s.total_living_species ?? s.totalLivingSpecies,
      totalExtinctSpecies: s.total_extinct_species ?? s.totalExtinctSpecies,
      speciesList: s.species_list || s.speciesList || [],
    };
  }
  return result;
}

/**
 * Parse state species list from UnitedStatesData.
 * @param {UnitedStatesData} data - UnitedStatesData object.
 * @returns a tuple of [speciesId: string, isPredicted: boolean]
 */
function parseStateSpeciesList(data: UnitedStatesData): [number, boolean][] {
  const speciesList: [number, boolean][] = [];
  if (!data.speciesList || data.speciesList.length === 0) {
    return speciesList;
  }
  data.speciesList.forEach((speciesId: string) => {
    const cleanId = speciesId.replace(/\?$/, "");
    speciesList.push([Number(cleanId), speciesId.endsWith("?")]);
  });
  return speciesList;
}

export { getUnitedStatesData, parseStateSpeciesList };
