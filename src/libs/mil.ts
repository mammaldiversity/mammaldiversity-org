/**
 * @file MIL (Mammal Images Library) helper functions.
 * This library provides utility functions for fetching and filtering MIL images and metadata.
 */

import { getLandscapeImages, getMilMetadataByMddId } from "../../db/mil";
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
 * Retrieves MIL (Mammal Images Library) images that do not contain "skeleton" in the description.
 * The images are sorted by their MIL ID in descending order.
 * 
 * @returns An array of MIL metadata that do not contain "skull" or "skeleton" in the description.
 */
function getNonSkullSkeletonMilImage(): MilMetadata[] {
  return getLandscapeImages().filter((item) => !isContainSkullSkeleton(item.description));
}

/**
 * Checks if the description contains the word "skull" or "skeleton".
 *
 * @param description - The image description to check.
 * @returns True if the description contains "skull" or "skeleton", false otherwise.
 */
function isContainSkullSkeleton(description: string): boolean {
  const str = description.toLowerCase();
  return str.includes("skeleton") || str.includes("skull");
}

/**
 * Retrieves the last ten unique MIL images, excluding those that contain "skeleton" in the description.
 * The images are sorted by their MIL ID in descending order.
 *
 * @returns An array of the ten most recent unique species MIL metadata.
 */
function getLastTenMilImages(): MilMetadata[] {
  const milMetadata = getNonSkullSkeletonMilImage().sort((a, b) => b.milId - a.milId);
  const last100 = milMetadata.slice(0, 100);

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

export { getSpeciesMilImages, getLastTenMilImages };
