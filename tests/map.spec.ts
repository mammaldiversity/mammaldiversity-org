import { test, expect } from "@playwright/test";
import {
  splitCountryDistribution,
  countryListToJson,
  jsonToCountryList,
} from "../src/libs/species_map";

test("splitCountryDistribution with NA", () => {
  expect(splitCountryDistribution("NA")).toEqual(
    expect.objectContaining({
      known: [],
      predicted: [],
    })
  );
});

test("splitCountryDistribution", () => {
  expect(splitCountryDistribution("Indonesia|United States")).toEqual(
    expect.objectContaining({
      known: ["Indonesia", "United States of America"],
      predicted: [],
    })
  );
});

test("countryListToJson", () => {
  expect(
    countryListToJson({ known: ["Indonesia", "United States of America"], predicted: [] })
  ).toEqual('{"known":["Indonesia","United States of America"],"predicted":[]}');
});

test("jsonToCountryList", () => {
  expect(
    jsonToCountryList('{"known":["Indonesia","United States of America"],"predicted":[]}')
  ).toEqual({
    known: ["Indonesia", "United States of America"],
    predicted: [],
  });
  expect(
    jsonToCountryList('{"known":["Indonesia"],"predicted":["United States of America"]}')
  ).toEqual({
    known: ["Indonesia"],
    predicted: ["United States of America"],
  });
});
