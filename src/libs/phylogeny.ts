/**
 * Build phylogenetic tree from MDD data structure.
 * 
 * Include all these ranks:
 * - subclass: string;
 * - infraclass: string;
 * - magnorder: string;
 * - superorder: string;
 * - taxonOrder: string;
 * - suborder: string;
 * - infraorder: string;
 * - parvorder: string;
 * - superfamily: string;
 * - family: string;
 * - subfamily: string;
 * - tribe: string;
 * - genus: string;
 * - subgenus: string;
 * - specificEpithet: string;
 * 
 * Ignore rank when it is empty or null.
 */

import { getMddTaxonomyColumns } from "../../db/mdd";

interface Phylo {
    id: number;
    subclass: string;
    infraclass: string;
    magnorder: string;
    superorder: string;
    taxonOrder: string;
    suborder: string;
    infraorder: string;
    parvorder: string;
    superfamily: string;
    family: string;
    subfamily: string;
    tribe: string;
    genus: string;
    subgenus: string;
    specificEpithet: string;
}

export interface PhyloTree {
    root: PhyloNode;
}

export interface PhyloNode {
    rank: string;
    name: string;
    children: PhyloNode[];
}

export function buildPhylogeneticTree(filterRanks?: string[]): PhyloTree {
    const taxa = getMddTaxonomyColumns();
    const tree: PhyloTree = {
        root: {
            rank: "root",
            name: "root",
            children: [],
        },
    };

    const rankKeys: (keyof Omit<Phylo, "id">)[] = [
        "subclass",
        "infraclass",
        "magnorder",
        "superorder",
        "taxonOrder",
        "suborder",
        "infraorder",
        "parvorder",
        "superfamily",
        "family",
        "subfamily",
        "tribe",
        "genus",
        "subgenus",
        "specificEpithet",
    ];

    const lowerFilterRanks = filterRanks?.map((r) => r.toLowerCase());

    const activeRanks = rankKeys
        .map((key) => {
            let rank = key.toLowerCase();
            if (key === "taxonOrder") rank = "order";
            if (key === "specificEpithet") rank = "species";
            return { key, rank };
        })
        .filter((r) => !lowerFilterRanks || lowerFilterRanks.includes(r.rank));

    taxa.forEach((taxon) => {
        let currentNode = tree.root;

        activeRanks.forEach(({ key, rank }) => {
            const taxonName = taxon[key as keyof typeof taxon];
            if (typeof taxonName === "string" && taxonName.trim() !== "" && taxonName !== "NA") {
                let childNode = currentNode.children.find(
                    (child) => child.name === taxonName && child.rank === rank
                );

                if (!childNode) {
                    childNode = {
                        rank,
                        name: taxonName,
                        children: [],
                    };
                    currentNode.children.push(childNode);
                }
                currentNode = childNode;
            }
        });
    });

    return tree;
}
