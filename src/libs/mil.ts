import {
  getLandscapeImages,
  getMilMetadataByMddId,
  parseMilJson,
} from "../../db/mil";
import type { MilMetadata } from "../../db/mil_model";

function getSpeciesMilImages(mddId: number): MilMetadata[] {
  const milMetadata = getMilMetadataByMddId(mddId);
  return milMetadata;
}

function getLastTenMilImages(): MilMetadata[] {
  // sort by milId descending
  const milMetadata = getLandscapeImages().sort((a, b) => b.milId - a.milId);

  const last50 = milMetadata.slice(0, 50);

  const seen = new Set<number>();
  const result: MilMetadata[] = [];

  for (const item of last50) {
    if (!seen.has(item.mddId)) {
      seen.add(item.mddId);
      result.push(item);
    }
    if (result.length === 10) break;
  }

  return result;
}

export { getSpeciesMilImages, getLastTenMilImages };
