import type {
  UnitedStatesData,
  UnitedStatesStats,
} from "./country_stats_model";
import unitedStatsRaw from "./data/usa_states.json";

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

function parseStateSpeciesList(
  data: UnitedStatesData,
): Record<number, boolean> {
  const speciesList: Record<string, boolean> = {};
  if (!data.speciesList || data.speciesList.length === 0) {
    return speciesList;
  }
  data.speciesList.forEach((speciesId) => {
    const cleanId = speciesId.replace(/\?$/, "");
    speciesList[cleanId] = speciesId.endsWith("?");
  });
  return speciesList;
}

export { getUnitedStatesData, parseStateSpeciesList };
