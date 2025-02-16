import { test, expect } from "@playwright/test";
import { matchIUCNRedlistStatus } from "../src/scripts/iucn";

test("matchIUCNRedlistStatus", () => {
  expect(matchIUCNRedlistStatus("LC")).toBe("Least Concern");
  expect(matchIUCNRedlistStatus("NT")).toBe("Near Threatened");
  expect(matchIUCNRedlistStatus("VU")).toBe("Vulnerable");
  expect(matchIUCNRedlistStatus("EN")).toBe("Endangered");
  expect(matchIUCNRedlistStatus("CR")).toBe("Critically Endangered");
  expect(matchIUCNRedlistStatus("EW")).toBe("Extinct in the Wild");
  expect(matchIUCNRedlistStatus("EX")).toBe("Extinct");
  expect(matchIUCNRedlistStatus("NE")).toBe("Not Evaluated");
});
