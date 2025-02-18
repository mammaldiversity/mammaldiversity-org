// We change the "|" to " · " because it is more readable.
// The middle dot is used extensively in many websites,
// e.g., Youtube, Wikipedia, and Google.
function cleanTaxonData(taxonData: string): string {
  return taxonData.includes("|") ? taxonData.split("|").join(" · ") : taxonData;
}

function createSynonymName(
  rootName: string,
  species: string,
  originalNameCombination?: string
): string {
  return originalNameCombination
    ? originalNameCombination
    : `${species} ${rootName}`;
}

function createAuthorityCitation(
  authority: string,
  year: number,
  withParentheses: boolean
): string {
  let citation = `${authority}, ${year}`;
  return withParentheses ? `(${citation})` : citation;
}

export { createSynonymName, cleanTaxonData, createAuthorityCitation };
