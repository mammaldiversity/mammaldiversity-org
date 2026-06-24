import { test, expect } from "@playwright/test";
import {
  cleanTaxonData,
  createAuthorityCitation,
  createStructuredTypeLocality,
  createSynonymName,
  isItalicText,
  shouldSeparateSynonymAuthorityWithColon,
} from "../src/libs/taxon";

test("cleanTaxonData", () => {
  expect(cleanTaxonData("Mammalia|Rodentia")).toBe("Mammalia · Rodentia");
  expect(cleanTaxonData("Mammalia")).toBe("Mammalia");
});

test("createSynonymName", () => {
  expect(createSynonymName("Mammalia", "Mus", "Mus musculus")).toBe(
    "Mus musculus",
  );
  expect(createSynonymName("Mammalia", "Mus")).toBe("Mus Mammalia");
});

test("synonym authority citation formatting", () => {
  expect(createAuthorityCitation("G. K. Shaw", 1799, false)).toBe(
    "G. K. Shaw, 1799",
  );
  expect(shouldSeparateSynonymAuthorityWithColon("name_combination")).toBe(
    true,
  );
  expect(
    shouldSeparateSynonymAuthorityWithColon("incorrect_subsequent_spelling"),
  ).toBe(true);
  expect(
    shouldSeparateSynonymAuthorityWithColon("name_combination | nomen_nudum"),
  ).toBe(true);
  expect(shouldSeparateSynonymAuthorityWithColon("variant")).toBe(true);
  expect(shouldSeparateSynonymAuthorityWithColon("unjustified_emendation")).toBe(
    true,
  );
  expect(shouldSeparateSynonymAuthorityWithColon("misidentification")).toBe(
    true,
  );
  expect(shouldSeparateSynonymAuthorityWithColon("justified_emendation")).toBe(
    true,
  );
  expect(shouldSeparateSynonymAuthorityWithColon("mandatory_change")).toBe(true);
  expect(shouldSeparateSynonymAuthorityWithColon("available")).toBe(false);
  expect(shouldSeparateSynonymAuthorityWithColon("")).toBe(false);
});

test("createStructuredTypeLocality", () => {
  expect(
    createStructuredTypeLocality("Canada", "Alberta", "NA", "50", "-110"),
  ).toBe("Canada: Alberta: 50°N, 110°W.");
  expect(
    createStructuredTypeLocality(
      "Canada",
      "Alberta",
      "NA",
      "50.5",
      "-110.25",
    ),
  ).toBe("Canada: Alberta: 50°30′N, 110°15′W.");
  expect(
    createStructuredTypeLocality(
      "Canada",
      "Alberta",
      "NA",
      "50.50833333333333",
      "-110.25833333333334",
    ),
  ).toBe("Canada: Alberta: 50°30′30″N, 110°15′30″W.");
  expect(createStructuredTypeLocality("Canada", "", "", "", "")).toBe(
    "Canada.",
  );
  expect(createStructuredTypeLocality("NA", "NA", "NA", "NA", "NA")).toBe("");
});

test("Italic text detection", () => {
  expect(isItalicText("_G. Mus_")).toBe(true);
  expect(isItalicText("_Mus_")).toBe(true);
  expect(isItalicText("Mus")).toBe(false);
  expect(isItalicText("_M. Mus_")).toBe(true);
  expect(isItalicText("Test _G. word_ have italic")).toBe(true);
  expect(isItalicText("not italic_")).toBe(false);
});
