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
      known: ["INDONESIA", "USA"],
      predicted: [],
    })
  );
});

test("countryListToJson", () => {
  expect(
    countryListToJson({ known: ["INDONESIA", "USA"], predicted: [] })
  ).toEqual('{"known":["INDONESIA","USA"],"predicted":[]}');
});

test("jsonToCountryList", () => {
  expect(
    jsonToCountryList('{"known":["INDONESIA","USA"],"predicted":[]}')
  ).toEqual({
    known: ["INDONESIA", "USA"],
    predicted: [],
  });
  expect(
    jsonToCountryList('{"known":["INDONESIA"],"predicted":["USA"]}')
  ).toEqual({
    known: ["INDONESIA"],
    predicted: ["USA"],
  });
});
