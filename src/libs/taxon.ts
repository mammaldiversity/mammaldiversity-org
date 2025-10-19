// We change the "|" to " · " because it is more readable.
// The middle dot is used extensively in many websites,
// e.g., Youtube, Wikipedia, and Google.
// Some text contains commas, "," without the trailing space
// like a typical sentence. This cause issue with word breaks.
// We will add space after the comma if it is not present.
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
function isItalicText(text: string): boolean {
  return /_[^_]+_/.test(text);
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

export {
  createSynonymName,
  cleanTaxonData,
  createAuthorityCitation,
  isItalicText,
};
