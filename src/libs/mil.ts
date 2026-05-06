/**
 * @file MIL (Mammal Images Library) helper functions.
 * This library provides utility functions for fetching and filtering MIL images and metadata.
 */

import {
  getLandscapeImages,
  getMilMetadataByMddId,
  parseMilJson,
} from "../../db/mil";
import type { MilMetadata } from "../../db/mil_model";

/**
 * Retrieves MIL (Mammal Images Library) images for a specific species.
 *
 * @param mddId - The MDD ID of the species.
 * @returns An array of MIL metadata for the species.
 */
function getSpeciesMilImages(mddId: number): MilMetadata[] {
  const milMetadata = getMilMetadataByMddId(mddId);
  return milMetadata;
}

/**
 * Retrieves the last ten unique MIL images, excluding those that contain "skeleton" in the description.
 * The images are sorted by their MIL ID in descending order.
 *
 * @returns An array of the ten most recent unique species MIL metadata.
 */
function getLastTenMilImages(): MilMetadata[] {
  // sort by milId descending
  const milMetadata = getLandscapeImages().sort((a, b) => b.milId - a.milId);
  const last100 = milMetadata.slice(0, 100).filter((item) => !isContainSkeleton(item.description));

  const seen = new Set<number>();
  const result: MilMetadata[] = [];

  for (const item of last100) {
    if (!seen.has(item.mddId)) {
      seen.add(item.mddId);
      result.push(item);
    }
    if (result.length === 10) break;
  }

  return result;
}

/**
 * Checks if the description contains the word "skeleton".
 *
 * @param description - The image description to check.
 * @returns True if the description contains "skeleton", false otherwise.
 */
function isContainSkeleton(description: string): boolean {
  const str = description.toLowerCase();
  return str.includes("skeleton");
}

export { getSpeciesMilImages, getLastTenMilImages };
