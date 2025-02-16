import type { MddData } from "../db/model";
import { test, expect } from "@playwright/test";
import fs from "fs";

const TEST_PATH = "./db/data/test.json";
const MDD_PATH = "./db/data/mdd.json";

function parseMDDJson(): MddData {
  const test_path = getSpeciesDataPath();
  const rawData = fs.readFileSync(test_path, "utf8");
  const jsonData: MddData = JSON.parse(rawData);
  return jsonData;
}

function getSpeciesDataPath(): string {
  // check if the TEST_PATH exists and use it, otherwise use MDD_PATH
  if (fs.existsSync(TEST_PATH)) {
    return TEST_PATH;
  } else {
    return MDD_PATH;
  }
}

test("MDD data is valid JSON", () => {
  const jsonData = parseMDDJson();
  expect(jsonData).not.toBeNull();
  expect(jsonData.data.length).toBe(50);
});
