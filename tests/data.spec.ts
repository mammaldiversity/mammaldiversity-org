import type { MddData } from "../db/model";
import { test, expect } from "@playwright/test";
import fs from "fs";

const TEST_PATH = "./db/data/test.json";

function parseMDDJson(): MddData {
  const rawData = fs.readFileSync(TEST_PATH, "utf8");
  const jsonData: MddData = JSON.parse(rawData);
  return jsonData;
}

test("MDD data is valid JSON", () => {
  const jsonData = parseMDDJson();
  expect(jsonData).not.toBeNull();
  expect(jsonData.data.length).toBe(50);
});
