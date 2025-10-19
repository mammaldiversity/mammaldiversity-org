function formatDate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function cleanVersion(version: string): string {
  return version.startsWith("v") ? version.slice(1) : version;
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export { formatDate, cleanVersion, getCurrentYear, getCurrentDate };