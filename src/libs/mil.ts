import { getMilMetadataByMddId } from "../../db/mil";
import type { MilMetadata } from "../../db/mil_model";

function getSpeciesMilImages(mddId: number): MilMetadata[] {
    const milMetadata = getMilMetadataByMddId(mddId);
    return milMetadata;
}

export { getSpeciesMilImages };