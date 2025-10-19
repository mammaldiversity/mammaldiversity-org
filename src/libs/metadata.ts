/**
 * Formats a date string into a more readable format (e.g., "October 19, 2025").
 * @param {string | undefined} dateString - The date string to format.
 * @returns {string | null} The formatted date string, or null if the input is empty.
 */
function formatDate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Removes the "v" prefix from a version string.
 * @param {string} version - The version string (e.g., "v1.2.3").
 * @returns {string} The version string without the "v" prefix (e.g., "1.2.3").
 */
function cleanVersion(version: string): string {
  return version.startsWith("v") ? version.slice(1) : version;
}

/**
 * Gets the current year.
 * @returns {number} The current year.
 */
function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Gets the current date in a readable format (e.g., "October 19, 2025").
 * @returns {string} The current date as a formatted string.
 */
function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export { formatDate, cleanVersion, getCurrentYear, getCurrentDate };