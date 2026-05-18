interface PhyloNode {
    rank: string;
    name: string;
    children: PhyloNode[];
}

interface PhyloTree {
    root: PhyloNode;
}

const taxa = [
    { subclass: "Theria", taxonOrder: "Rodentia", family: "Muridae", genus: "Mus", specificEpithet: "musculus" },
    { subclass: "Theria", taxonOrder: "Rodentia", family: "Muridae", genus: "Mus", specificEpithet: "pahari" }
];

const rankKeys = ["subclass", "taxonOrder", "family", "genus", "specificEpithet"];

const rankMapping: Record<string, string> = {
    taxonOrder: "order",
    specificEpithet: "species",
};

function buildPhylogeneticTree(filterRanks?: string[]): PhyloTree {
    const tree: PhyloTree = { root: { rank: "root", name: "root", children: [] } };
    
    const lowerFilterRanks = filterRanks?.map(r => r.toLowerCase());

    const activeRanks = rankKeys.map(key => ({
        key,
        rank: rankMapping[key] || key.toLowerCase()
    })).filter(r => !lowerFilterRanks || lowerFilterRanks.includes(r.rank));

    taxa.forEach(taxon => {
        let currentNode = tree.root;
        activeRanks.forEach(({ key, rank }) => {
            const taxonName = taxon[key as keyof typeof taxon];
            if (taxonName && taxonName.trim() !== "") {
                let childNode = currentNode.children.find(c => c.name === taxonName && c.rank === rank);
                if (!childNode) {
                    childNode = { rank, name: taxonName, children: [] };
                    currentNode.children.push(childNode);
                }
                currentNode = childNode;
            }
        });
    });
    return tree;
}

console.log(JSON.stringify(buildPhylogeneticTree(), null, 2));
console.log(JSON.stringify(buildPhylogeneticTree(["order", "genus"]), null, 2));
