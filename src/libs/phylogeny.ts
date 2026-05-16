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
import type { Phylo } from "../../db/mdd_model";

export interface PhyloTree {
    root: PhyloNode;
}

export interface PhyloNode {
    rank: string;
    name: string;
    mddId?: number;
    children: PhyloNode[];
}

export interface TreeOptions {
    filterByRank?: string;
    filterByName?: string;
    maxDepth?: number;
}

export function buildPhylogeneticTree(options?: TreeOptions | string[]): PhyloTree {
    let opts: TreeOptions = {};
    if (options && !Array.isArray(options)) {
        opts = options;
    }

    let taxa = getMddTaxonomyColumns();
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

    let activeRanks = rankKeys
        .map((key) => {
            let rank = key.toLowerCase();
            if (key === "taxonOrder") rank = "order";
            if (key === "specificEpithet") rank = "species";
            return { key, rank };
        });

    if (opts.filterByRank && opts.filterByName) {
        const filterRankObj = activeRanks.find(r => r.rank === opts.filterByRank);
        if (filterRankObj) {
            const lowerTarget = opts.filterByName.toLowerCase();
            taxa = taxa.filter(taxon => {
                const val = taxon[filterRankObj.key as keyof typeof taxon];
                return typeof val === "string" && val.toLowerCase() === lowerTarget;
            });

            const startIndex = activeRanks.findIndex(r => r.rank === opts.filterByRank);
            if (startIndex !== -1) {
                activeRanks = activeRanks.slice(startIndex);
            }
        }
    }

    taxa.forEach((taxon) => {
        let currentNode = tree.root;
        let depth = 0;

        activeRanks.forEach(({ key, rank }) => {
            if (opts.maxDepth !== undefined && depth > opts.maxDepth) {
                return;
            }

            const taxonName = taxon[key as keyof typeof taxon];
            if (typeof taxonName === "string" && taxonName.trim() !== "" && taxonName !== "NA") {
                const nodeName = rank === "species" ? `${taxon.genus} ${taxonName}` : taxonName;

                let childNode = currentNode.children.find(
                    (child) => child.name === nodeName && child.rank === rank
                );

                if (!childNode) {
                    childNode = {
                        rank,
                        name: nodeName,
                        children: [],
                    };
                    if (rank === "species") {
                        childNode.mddId = taxon.id;
                    }
                    currentNode.children.push(childNode);
                }
                currentNode = childNode;
                depth++;
            }
        });
    });

    return tree;
}
