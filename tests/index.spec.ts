import { test, expect, type Locator, type Page } from "@playwright/test";

const desktopNav = (page: Page): Locator =>
  page.locator('nav[aria-label="Global"] > div').nth(2);

const indicatorFor = (nav: Locator, path: string): Locator =>
  nav.locator(`a[href="${path}"]`).locator("xpath=following-sibling::div[1]");

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

test("navbar shows the active indicator on the home page", async ({ page }) => {
  await page.goto("/");

  const nav = desktopNav(page);
  const homeIndicator = indicatorFor(nav, "/");
  const exploreIndicator = indicatorFor(nav, "/explore");

  await expect(homeIndicator).toHaveCSS(
    "background-color",
    "rgb(84, 59, 51)",
  );
  await expect(homeIndicator).not.toHaveClass(/bg-transparent/);
  await expect(exploreIndicator).toHaveClass(/bg-transparent/);
});

test("navbar keeps the section indicator active on nested pages", async ({
  page,
}) => {
  await page.goto("/explore/tree");

  const exploreIndicator = indicatorFor(desktopNav(page), "/explore");

  await expect(exploreIndicator).toHaveCSS(
    "background-color",
    "rgb(84, 59, 51)",
  );
  await expect(exploreIndicator).not.toHaveClass(/bg-transparent/);
});

test("navbar treats a trailing slash as the current page", async ({ page }) => {
  await page.goto("/search/");

  const searchIndicator = indicatorFor(desktopNav(page), "/search");

  await expect(searchIndicator).toHaveCSS(
    "background-color",
    "rgb(84, 59, 51)",
  );
  await expect(searchIndicator).not.toHaveClass(/bg-transparent/);
});
