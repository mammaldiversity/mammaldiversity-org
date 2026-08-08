interface TaxonomyChange {
  oldName: string;
  newName: string;
  comments: string;
  category: string;
  reference: string;
}

interface ReleaseTaxonomyChange extends TaxonomyChange {
  version: string;
  releaseDate: string | undefined;
}

interface FieldChange {
  speciesId: number;
  oldName: string;
  newName: string;
  category: string;
  column: string;
  oldValue: string;
  newValue: string;
}

interface DiffRelease {
  version: string;
  prevVersion: string;
  releaseDate?: string;
  releaseNotes?: string;
  taxonomyChanges: TaxonomyChange[];
  allChanges: FieldChange[];
}

interface ReleaseChangeTrend {
  version: string;
  releaseDate: string | undefined;
  deNovo: number;
  genus: number;
  lump: number;
  split: number;
}

export type {
  DiffRelease,
  FieldChange,
  ReleaseTaxonomyChange,
  ReleaseChangeTrend,
  TaxonomyChange,
};
