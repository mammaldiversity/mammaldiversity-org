import { test, expect } from "@playwright/test";
import {
  generateSpeciesLink,
  generateSpeciesPermalink,
  generateCountryLink,
  generateCountryPermalink,
  generateStateLink,
  generateStatePermalink,
} from "../src/libs/permalink";

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

test("Country link is correct", () => {
  const permalink = generateCountryLink("US");
  expect(permalink).toBe("/country/US");
});

test("Country full permalink is correct", () => {
  const fullPermalink = generateCountryPermalink("US");
  expect(fullPermalink).toBe("https://mammaldiversity.org/country/US");
});

test("State link is correct", () => {
  const permalink = generateStateLink("US", "CA");
  expect(permalink).toBe("/country/US/CA");
});

test("State full permalink is correct", () => {
  const fullPermalink = generateStatePermalink("US", "CA");
  expect(fullPermalink).toBe("https://mammaldiversity.org/country/US/CA");
});

test("Country page (US) serves correctly", async ({ page }) => {
  const response = await page.goto("/country/US");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/United States/);
  await expect(page.locator("h1").first()).toContainText("United States");
});

test("State page (CA) serves correctly", async ({ page }) => {
  const response = await page.goto("/country/US/CA");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/California/);
  await expect(page.locator("h1").first()).toContainText("California");
});
