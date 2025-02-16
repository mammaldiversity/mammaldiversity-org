import { test, expect } from "@playwright/test";

test("title match", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle("ASM Mammal Diversity Database");
});

test("clicking on a link", async ({ page }) => {
  await page.goto("/");

  // Click on a link.
  await page.click("text=About");

  // Expect a new URL.
  await expect(page).toHaveURL(/\/about/);
});
