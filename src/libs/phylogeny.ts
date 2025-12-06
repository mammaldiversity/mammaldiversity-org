/**
 * Build phylogenetic tree for a given set of taxa.
 */

interface Phylo {
    id: number;
    parentId: number | null;
    name: string;
    children?: Phylo[];
}

function buildPhylogeneticTree(taxa: Phylo[]): Phylo[] {
    const taxonMap: Record<number, Phylo> = {};
    const roots: Phylo[] = [];

    // First, create a map of all taxa by their IDs
    taxa.forEach(taxon => {
        taxonMap[taxon.id] = { ...taxon, children: [] };
    });

    // Then, build the tree structure
    taxa.forEach(taxon => {
        if (taxon.parentId !== null) {
            const parent = taxonMap[taxon.parentId];
            if (parent) {
                parent.children!.push(taxonMap[taxon.id]);
            }
        } else {
            roots.push(taxonMap[taxon.id]);
        }
    });

    return roots;
}

