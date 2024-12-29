// Check if the taxon data contains "|" and replace it with  middle dot "·"
export function cleanTaxonData(taxonData: string): string {
  return taxonData.includes("|") ? taxonData.split("|").join(" · ") : taxonData;
}
