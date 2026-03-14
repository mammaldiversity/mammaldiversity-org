// Parser for parsing the MIL json file
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import type { MilMetadata } from "./mil_model";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIL_PATH = join(__dirname, "../db/data/mil.json");
const META_PARENT_DIR = "/src/assets/mil-images";

function parseMilJson(): MilMetadata[] {
    const rawData = readFileSync(MIL_PATH, "utf8");
    const jsonData = JSON.parse(rawData);
    return jsonData.map((item: any) => ({
        milId: item.milId,
        mddId: item.mddId,
        description: item.description,
        location: item.location,
        photographer: item.photographer,
        dateTaken: item.dateTaken,
        filePath: `${META_PARENT_DIR}/${item.milId}.webp`,
    }));
}

function getMilMetadataByMddId(mddId: number): MilMetadata[] {
    const allMilMetadata = parseMilJson();
    return allMilMetadata.filter((mil) => mil.mddId === mddId);
}

export { getMilMetadataByMddId, parseMilJson };