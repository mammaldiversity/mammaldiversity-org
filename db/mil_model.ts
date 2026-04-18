interface MilMetadata {
    milId: number;
    mddId: number;
    isUncertainIdentification: boolean;
    description: string;
    location: string;
    photographer: string;
    dateTaken: string;
    filePath: string;
}

export type { MilMetadata }