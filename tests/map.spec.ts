import { test, expect } from "@playwright/test";
import {
  splitCountryDistribution,
  countryListToJson,
  jsonToCountryList,
} from "../src/scripts/species_map";

test("splitCountryDistribution with NA", () => {
  expect(splitCountryDistribution("NA")).toEqual(
    expect.objectContaining({
      known: [],
      predicted: [],
    })
  );
});

test("splitCountryDistribution", () => {
  expect(splitCountryDistribution("Indonesia|USA")).toEqual(
    expect.objectContaining({
      known: ["Indonesia", "USA"],
      predicted: [],
    })
  );
});

test("countryListToJson", () => {
  expect(
    countryListToJson({ known: ["Indonesia", "USA"], predicted: [] })
  ).toEqual('{"known":["Indonesia","USA"],"predicted":[]}');
});

test("jsonToCountryList", () => {
  expect(
    jsonToCountryList('{"known":["Indonesia","USA"],"predicted":[]}')
  ).toEqual({
    known: ["Indonesia", "USA"],
    predicted: [],
  });
  expect(
    jsonToCountryList('{"known":["Indonesia"],"predicted":["USA"]}')
  ).toEqual({
    known: ["Indonesia"],
    predicted: ["USA"],
  });
});
