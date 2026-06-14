import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  splitCountryDistribution,
  countryListToJson,
  jsonToCountryList,
  countryNameToCode,
  countryNamesToCodes,
} from "../src/libs/species_map";
import { convertTopoToGeoJson } from "../src/libs/country_utils";

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

test("country distributions resolve to MDD country codes", () => {
  expect(countryNameToCode("Russia")).toBe("RU");
  expect(countryNameToCode("United States of America")).toBe("US");
  expect(countryNamesToCodes(["Russia", "United States of America"])).toEqual(
    new Set(["RU", "US"]),
  );
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

test("country map splits French Guiana from France", () => {
  const countriesPath = join(process.cwd(), "public/map/countries-50m.json");
  const topoData = JSON.parse(readFileSync(countriesPath, "utf8"));
  const geoData = convertTopoToGeoJson(topoData);

  const france = geoData.features.find(
    (feature) => feature.properties?.ISO_A2 === "FR",
  );
  const frenchGuiana = geoData.features.find(
    (feature) => feature.properties?.ISO_A2 === "GF",
  );

  expect(france?.properties?.mdd_name).toBe("France");
  expect(france?.geometry.type).toBe("MultiPolygon");
  expect(
    france?.geometry.type === "MultiPolygon"
      ? france.geometry.coordinates.length
      : 0,
  ).toBe(2);
  expect(frenchGuiana?.properties?.mdd_name).toBe("French Guiana");
  expect(frenchGuiana?.geometry.type).toBe("Polygon");
});

test("country map normalizes feature codes to MDD country codes", () => {
  const countriesPath = join(process.cwd(), "public/map/countries-50m.json");
  const topoData = JSON.parse(readFileSync(countriesPath, "utf8"));
  const geoData = convertTopoToGeoJson(topoData);

  const taiwan = geoData.features.find(
    (feature) => feature.properties?.ISO_A2 === "TW",
  );
  const naturalEarthTaiwan = geoData.features.find(
    (feature) => feature.properties?.ISO_A2 === "CN-TW",
  );

  expect(taiwan?.properties?.mdd_name).toBe("Taiwan");
  expect(taiwan?.geometry.type).toBe("Polygon");
  expect(naturalEarthTaiwan).toBeUndefined();
});

test("country map includes Russia under the database country code", () => {
  const countriesPath = join(process.cwd(), "public/map/countries-50m.json");
  const topoData = JSON.parse(readFileSync(countriesPath, "utf8"));
  const geoData = convertTopoToGeoJson(topoData);

  const russia = geoData.features.find(
    (feature) => feature.properties?.ISO_A2 === countryNameToCode("Russia"),
  );

  expect(russia?.properties?.NAME).toBe("Russia");
  expect(russia?.geometry.type).toBe("MultiPolygon");
});
