import { test, expect } from "@playwright/test";
import {
  splitCountryDistribution,
  countryListToJson,
  jsonToCountryList,
} from "../src/scripts/map";

test("splitCountryDistribution", () => {
  expect(splitCountryDistribution("India|China")).toEqual(["India", "China"]);
});

test("countryListToJson", () => {
  expect(countryListToJson(["India", "China"])).toBe('["India","China"]');
});

test("jsonToCountryList", () => {
  expect(jsonToCountryList('["India","China"]')).toEqual({
    known: ["India", "China"],
    potential: [],
  });
  expect(jsonToCountryList('["India","China?"]')).toEqual({
    known: ["India"],
    potential: ["China"],
  });
});
