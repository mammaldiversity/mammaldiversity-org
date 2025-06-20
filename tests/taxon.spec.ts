import { test, expect } from "@playwright/test";
import {
  cleanTaxonData,
  createSynonymName,
  isItalicText,
} from "../src/scripts/taxon";

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

test("Italic text detection", () => {
  expect(isItalicText("_G. Mus_")).toBe(true);
  expect(isItalicText("_Mus_")).toBe(true);
  expect(isItalicText("Mus")).toBe(false);
  expect(isItalicText("_M. Mus_")).toBe(true);
  expect(isItalicText("Test _G. word_ have italic")).toBe(true);
  expect(isItalicText("not italic_")).toBe(false);
});
