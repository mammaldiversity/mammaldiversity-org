import { db, Synonym, Taxonomy } from "astro:db";
import fs from "fs";
import type { MddData } from "./model";

export default async function seed() {
  const rawData = fs.readFileSync("./db/data/test_data.json", "utf8");
  const jsonData: MddData = JSON.parse(rawData);

  const taxonomyData = jsonData.data;
  const synonymData = jsonData.synonyms;

  if (taxonomyData && taxonomyData.length > 0) {
    await db.insert(Taxonomy).values(taxonomyData);
  }

  if (synonymData && synonymData.length > 0) {
    await db.insert(Synonym).values(synonymData);
  }
}
