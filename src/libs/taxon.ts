// We change the "|" to " · " because it is more readable.
// The middle dot is used extensively in many websites,
// e.g., Youtube, Wikipedia, and Google.
// Some text contains commas, "," without the trailing space
// like a typical sentence. This cause issue with word breaks.
// We will add space after the comma if it is not present.
/**
 * Cleans up taxon data strings by replacing special characters and ensuring proper spacing.
 * @param {string} taxonData - The taxon data string to clean.
 * @returns {string} The cleaned taxon data string.
 */
function cleanTaxonData(taxonData: string): string {
  if (taxonData.includes("|")) {
    return taxonData.split("|").join(" · ");
  } else if (taxonData.includes(",")) {
    return taxonData
      .split(",")
      .map((part) => part.trim())
      .join(", ");
  }
  return taxonData;
}

// We will return true if text contains italic text.
// Italic text is defined as text that starts and ends with an underscore "_"
// and may contain a period and a space after the underscore.
// Examples of italic text:
// _G. Mus_, _Mus_, _M. Mus_, _G. word_,
// _G. Word_, _Word_, _G. word_.
/**
 * Checks if a string contains italic text, which is denoted by underscores.
 * @param {string} text - The text to check.
 * @returns {boolean} True if the text contains italic formatting, false otherwise.
 */
function isItalicText(text: string): boolean {
  return /_[^_]+_/.test(text);
}

/**
 * Creates a synonym name for a species.
 * @param {string} rootName - The root name of the species.
 * @param {string} species - The species name.
 * @param {string} [originalNameCombination] - An optional original name combination.
 * @returns {string} The full synonym name.
 */
function createSynonymName(
  rootName: string,
  species: string,
  originalNameCombination?: string
): string {
  return originalNameCombination
    ? originalNameCombination
    : `${species} ${rootName}`;
}

/**
 * Creates an authority citation string.
 * @param {string} authority - The authority's name.
 * @param {number} year - The year of the citation.
 * @param {boolean} withParentheses - Whether to enclose the citation in parentheses.
 * @returns {string} The formatted authority citation.
 */
function createAuthorityCitation(
  authority: string,
  year: number,
  withParentheses: boolean
): string {
  let citation = `${authority}, ${year}`;
  return withParentheses ? `(${citation})` : citation;
}

export {
  createSynonymName,
  cleanTaxonData,
  createAuthorityCitation,
  isItalicText,
};
