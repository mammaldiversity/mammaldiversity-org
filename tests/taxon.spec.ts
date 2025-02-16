import { test, expect } from "@playwright/test";
import { cleanTaxonData, createSynonymName } from "../src/scripts/taxon";

test("cleanTaxonData", () => {
  expect(cleanTaxonData("Mammalia|Rodentia")).toBe("Mammalia · Rodentia");
  expect(cleanTaxonData("Mammalia")).toBe("Mammalia");
});

test("createSynonymName", () => {
  expect(createSynonymName("Mammalia", "Mus", "Mus musculus")).toBe(
    "Mus musculus"
  );
  expect(createSynonymName("Mammalia", "Mus")).toBe("Mus Mammalia");
});
