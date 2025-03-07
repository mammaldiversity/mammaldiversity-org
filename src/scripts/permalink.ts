const MDD_SPECIES_PERMALINK = "https://www.mammaldiversity.org/taxon/";

// The actual permanent link is generated by Astro
// based on the folder structure and the [id] slug in the file name.
// This function is only useful for generating the permalink
// for the section in the species page.
function getSpeciesPermalink(taxonId: number): string {
  return `${MDD_SPECIES_PERMALINK}${taxonId}`;
}

export default getSpeciesPermalink;
