import { test, expect } from "@playwright/test";
import {
  generateSpeciesLink,
  generateSpeciesPermalink,
} from "../src/scripts/permalink";

test("Species link is correct", () => {
  const taxonId = 12345;
  const permalink = generateSpeciesLink(taxonId);
  expect(permalink).toBe("/taxon/12345");
});

test("Species full permalink is correct", () => {
  const taxonId = 12345;
  const fullPermalink = generateSpeciesPermalink(taxonId);
  expect(fullPermalink).toBe("https://mammaldiversity.org/taxon/12345");
});
