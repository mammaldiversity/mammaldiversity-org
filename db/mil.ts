// Parser for parsing the MDD json file
import fs from "fs";
import type { MilMetadata } from "./mil_model";

const MDD_PATH = "./db/data/mil.json";
const META_PARENT_DIR = "/src/assets/mil-images/"; // Parent directory for MIL images

function parseMilJson(): MilMetadata[] {
    const rawData = fs.readFileSync(MDD_PATH, "utf8");
    const jsonData = JSON.parse(rawData);
    return jsonData.map((item: any) => ({
        milId: item.milId,
        mddId: item.mddId,
        description: item.description,
        location: item.location,
        photographer: item.photographer,
        dateTaken: item.dateTaken,
        filePath: `${META_PARENT_DIR}${item.milId}.webp`,
    }));
}

function getMilMetadataByMddId(mddId: number): MilMetadata[] {
    const allMilMetadata = parseMilJson();
    return allMilMetadata.filter((mil) => mil.mddId === mddId);
}

export { getMilMetadataByMddId, parseMilJson };