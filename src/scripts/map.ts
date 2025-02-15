interface CountryDistribution {
  known: string[];
  potential: string[];
}

function splitCountryDistribution(countryDistribution: string): string[] {
  return countryDistribution.split("|");
}

function countryListToJson(countryList: string[]): string {
  return JSON.stringify(countryList);
}

function jsonToCountryList(jsonString: string): CountryDistribution {
  let countryList = JSON.parse(jsonString);
  // If ends with "?", it is a potential distribution
  let known = countryList.filter((country: string) => !country.endsWith("?"));

  let potential = countryList
    .filter((country: string) => country.endsWith("?"))
    .map((country: string) => country.slice(0, -1));

  return { known, potential };
}

export type { CountryDistribution };
export { splitCountryDistribution, countryListToJson, jsonToCountryList };
