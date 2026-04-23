// Parser for parsing the MIL json file
import type { MilMetadata } from "./mil_model";
import milRaw from "../db/data/mil.json";

const META_PARENT_DIR = "/mil-images";

function parseMilJson(): MilMetadata[] {
    return (milRaw as any[]).map((item) => ({
        milId: item.milId,
        mddId: Number.parseInt(item.mddId, 10),
        isUncertainIdentification: item.isUncertainIdentification ?? false,
        description: item.description?.replace(/\|/g, ", ") ?? "",
        location: item.location ?? "",
        distribution: item.distribution ?? "",
        photographer: item.photographer ?? "",
        dateTaken: item.dateTaken ?? "",
        filePath: `${META_PARENT_DIR}/${item.milId}.webp`,
    }));
}

function getMilMetadataByMddId(mddId: number): MilMetadata[] {
    const allMilImages = parseMilJson();
    return allMilImages.filter((mil) => mil.mddId === mddId);
}

export { getMilMetadataByMddId, parseMilJson };
