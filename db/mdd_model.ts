// MDD data structure

interface Taxonomy {
  id: number;
  sciName: string;
  mainCommonName: string;
  otherCommonNames: string;
  phylosort: number;
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
  authoritySpeciesAuthor: string;
  authoritySpeciesYear: number;
  authorityParentheses: number;
  originalNameCombination: string;
  authoritySpeciesCitation: string;
  authoritySpeciesLink: string;
  typeVoucher: string;
  typeKind: string;
  typeVoucherURIs: string;
  typeLocality: string;
  typeLocalityLatitude: string;
  typeLocalityLongitude: string;
  nominalNames: string;
  taxonomyNotes: string;
  taxonomyNotesCitation: string;
  distributionNotes: string;
  distributionNotesCitation: string;
  subregionDistribution: string;
  countryDistribution: string;
  continentDistribution: string;
  biogeographicRealm: string;
  iucnStatus: string;
  extinct: number;
  domestic: number;
  flagged: number;
  CMW_sciName: string;
  diffSinceCMW: number;
  MSW3_matchtype: string;
  MSW3_sciName: string;
  diffSinceMSW3: number;
}

interface Synonym {
  synId: number;
  hespId: number;
  speciesId: number;
  species: string;
  rootName: string;
  author: string;
  year: number;
  authorityParentheses: number;
  nomenclatureStatus: string;
  validity: string;
  originalCombination: string;
  originalRank: string;
  authorityCitation: string;
  uncheckedAuthorityCitation: string;
  sourcedUnverifiedCitations: string;
  citationGroup: string;
  citationKind: string;
  authorityPage: string;
  authorityLink: string;
  authorityPageLink: string;
  uncheckedAuthorityPageLink: string;
  oldTypeLocality: string;
  originalTypeLocality: string;
  uncheckedTypeLocality: string;
  emendedTypeLocality: string;
  typeLatitude: string;
  typeLongitude: string;
  typeCountry: string;
  typeSubregion: string;
  typeSubregion2: string;
  holotype: string;
  typeKind: string;
  typeSpecimenLink: string;
  taxonOrder: string;
  family: string;
  genus: string;
  specificEpithet: string;
  subspecificEpithet: string;
  variantOf: string;
  seniorHomonym: string;
  variantNameCitations: string;
  nameUsages: string;
  comments: string;
}

interface SpeciesData {
  mddId: number;
  speciesData: Taxonomy;
  synonyms: Synonym[];
}

interface MddData {
  metadata: Metadata;
  data: SpeciesData[];
  synonymOnly: Synonym[];
}

interface Metadata {
  version: string;
  releaseDate: string;
  speciesCount: number;
  synonymCount: number;
  recentlyExtinct: number;
  living: number;
  domestic: number;
  livingWild: number;
  genusCount: number;
  familyCount: number;
  orderCount: number;
  remark?: string;
  doi?: string;
}

interface SynonymName {
  name: string;
  citation: string;
}

export type { Taxonomy, Synonym, MddData, SpeciesData, SynonymName, Metadata };
