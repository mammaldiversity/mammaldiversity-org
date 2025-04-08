interface CountryDistribution {
  known: string[];
  predicted: string[];
}

function splitCountryDistribution(
  countryDistribution: string
): CountryDistribution {
  // If countryDistribution is NA.
  // Return empty known and predicted lists.
  if (countryDistribution === "NA") {
    return { known: [], predicted: [] };
  }

  let countryList = countryDistribution.split("|");
  // If ends with "?", it is a predicted distribution
  let known = countryList.filter((country: string) => !country.endsWith("?"));

  // If known distribution contains one info
  // listed domesticated (case insensitive),
  // then we do not feed the list to the map.
  if (known.length === 1 && known[0].toLowerCase().includes("domesticated")) {
    return { known: [], predicted: [] };
  }

  let predicted = countryList
    .filter((country: string) => country.endsWith("?"))
    .map((country: string) => country.slice(0, -1));

  return { known, predicted };
}

function countryListToJson(countryList: CountryDistribution): string {
  return JSON.stringify(countryList);
}

function jsonToCountryList(jsonString: string): CountryDistribution {
  return JSON.parse(jsonString);
}

export type { CountryDistribution };
export { splitCountryDistribution, countryListToJson, jsonToCountryList };
