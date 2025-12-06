/**
 * Matches an IUCN Red List status code to its full name.
 * @param {string} status - The two-letter IUCN Red List status code (e.g., "LC", "NT").
 * @returns {string} The full name of the IUCN Red List status (e.g., "Least Concern", "Near Threatened").
 */
export function matchIUCNRedlistStatus(status: string) {
  switch (status) {
    case "LC":
      return "Least Concern";
    case "NT":
      return "Near Threatened";
    case "VU":
      return "Vulnerable";
    case "EN":
      return "Endangered";
    case "CR":
      return "Critically Endangered";
    case "EW":
      return "Extinct in the Wild";
    case "EX":
      return "Extinct";
    default:
      return "Not Evaluated";
  }
}
