// Publications naming a species, fetched from Crossref in the browser.
// Species pages are static, so the list is not part of the build: fetching
// at build time would mean one Crossref request per species on every build.

export interface CrossrefWork {
  title: string;
  /** Short form for the list, e.g. "Smith et al.". */
  authors: string;
  /** Every author as "Family, G.", for the copied citation. */
  authorNames: string[];
  year: number | null;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  /** Crossref's work type id, e.g. `journal-article`. */
  type: string;
  /** Plain-text abstract; empty when Crossref has none, as for most works. */
  abstract: string;
}

export type WorkKind = "article" | "book" | "grayLiterature" | "data" | "other";

export const MAX_WORKS = 20;

/** Crossref's names for its work types, in sentence case. */
const TYPE_LABELS: Record<string, string> = {
  "journal-article": "Journal article",
  "book-chapter": "Book chapter",
  "book-section": "Book section",
  "book-part": "Book part",
  "edited-book": "Edited book",
  "reference-book": "Reference book",
  "reference-entry": "Reference entry",
  "proceedings-article": "Proceedings article",
  "posted-content": "Posted content",
  "peer-review": "Peer review",
  "report-component": "Report component",
};

const KIND_BY_TYPE: Record<string, WorkKind> = {
  "journal-article": "article",
  book: "book",
  "book-chapter": "book",
  "book-section": "book",
  "book-part": "book",
  "book-track": "book",
  "edited-book": "book",
  monograph: "book",
  "reference-book": "book",
  "reference-entry": "book",
  "posted-content": "grayLiterature",
  report: "grayLiterature",
  "report-component": "grayLiterature",
  dissertation: "grayLiterature",
  "proceedings-article": "grayLiterature",
  standard: "grayLiterature",
  dataset: "data",
  component: "data",
  database: "data",
};

/** Filter chip names, in display order. */
export const KIND_NAMES: Record<WorkKind, string> = {
  article: "Articles",
  book: "Books",
  grayLiterature: "Preprints and reports",
  data: "Datasets",
  other: "Other",
};

/** A readable label for a Crossref type; empty when there is none. */
export function workTypeLabel(type: string): string {
  if (!type) return "";
  const known = TYPE_LABELS[type];
  if (known) return known;
  const words = type.replaceAll("-", " ");
  return words[0].toUpperCase() + words.slice(1);
}

export function workKind(type: string): WorkKind {
  return KIND_BY_TYPE[type] ?? "other";
}

export function crossrefWorksUrl(species: string): string {
  const params = new URLSearchParams({
    "query.bibliographic": `"${species}"`,
    rows: "40",
    select:
      "DOI,title,author,issued,container-title,volume,issue,page,type,abstract",
  });
  return `https://api.crossref.org/works?${params}`;
}

export function crossrefSearchUrl(species: string): string {
  return `https://search.crossref.org/?${new URLSearchParams({ q: species })}`;
}

/** Wait before the one retry; Crossref's public pool allows 1 request/s. */
const RETRY_DELAY_MS = 1500;

export async function fetchCrossrefWorks(
  species: string,
  signal?: AbortSignal,
): Promise<CrossrefWork[]> {
  let response: Response;
  try {
    response = await fetch(crossrefWorksUrl(species), { signal });
    if (!response.ok) throw new Error(`Crossref returned ${response.status}`);
  } catch (error) {
    // A rate-limited reply has no CORS header, so the browser reports it as
    // a failed fetch rather than a 429. Retry once after a pause.
    if (signal?.aborted) throw error;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    signal?.throwIfAborted();
    response = await fetch(crossrefWorksUrl(species), { signal });
    if (!response.ok) throw new Error(`Crossref returned ${response.status}`);
  }
  const json = await response.json();
  const items: unknown[] = json?.message?.items ?? [];
  return filterWorks(items.map(parseWork), species);
}

/**
 * Crossref relevance matching is fuzzy; keep works whose title or abstract
 * mentions the species binomial.
 */
export function filterWorks(
  works: CrossrefWork[],
  species: string,
): CrossrefWork[] {
  const needle = species.toLowerCase();
  return works
    .filter(
      (w) =>
        w.doi &&
        (w.title.toLowerCase().includes(needle) ||
          w.abstract.toLowerCase().includes(needle)),
    )
    .slice(0, MAX_WORKS);
}

export function parseWork(raw: unknown): CrossrefWork {
  const json = (raw ?? {}) as Record<string, any>;
  const authorList: Record<string, any>[] = Array.isArray(json.author)
    ? json.author.filter((a: unknown) => a && typeof a === "object")
    : [];
  const familyOf = (a: Record<string, any>) =>
    String(a.family ?? a.name ?? "").trim();
  let authors = "";
  if (authorList.length > 0) {
    authors = familyOf(authorList[0]);
    if (authorList.length === 2) authors += ` & ${familyOf(authorList[1])}`;
    if (authorList.length > 2) authors += " et al.";
  }
  const authorNames = authorList
    .filter((a) => familyOf(a))
    .map((a) => withInitials(familyOf(a), String(a.given ?? "")));
  const year = json.issued?.["date-parts"]?.[0]?.[0];
  return {
    title: cleanMarkup(firstString(json.title)),
    authors,
    authorNames,
    year: typeof year === "number" ? year : null,
    journal: firstString(json["container-title"]),
    volume: firstString(json.volume),
    issue: firstString(json.issue),
    pages: firstString(json.page),
    doi: String(json.DOI ?? ""),
    type: String(json.type ?? "").trim(),
    // Abstracts arrive as JATS XML, e.g. `<jats:p>…</jats:p>`.
    abstract: cleanMarkup(
      typeof json.abstract === "string" ? json.abstract : "",
    ),
  };
}

export function workUrl(work: CrossrefWork): string {
  return `https://doi.org/${work.doi}`;
}

/** Journal, volume (issue), pages, e.g. "J. Mammal., 101 (2), 12-20". */
export function workSource(work: CrossrefWork): string {
  let text = work.journal;
  if (work.volume) text += `${text ? ", " : ""}${work.volume}`;
  if (work.issue) text += ` (${work.issue})`;
  if (work.pages) text += `, ${work.pages}`;
  return text;
}

/** A plain-text citation: authors, year, title, source, DOI. */
export function workCitation(work: CrossrefWork): string {
  const names =
    work.authorNames.length > 0 ? work.authorNames.join(", ") : work.authors;
  const source = workSource(work);
  return [
    names && `${names}.`,
    work.year !== null && `(${work.year}).`,
    work.title && `${work.title.replace(/\.$/, "")}.`,
    source && `${source}.`,
    workUrl(work),
  ]
    .filter(Boolean)
    .join(" ");
}

/** Groups works by year, newest first; works without a year come last. */
export function groupByYear(
  works: CrossrefWork[],
): [number | null, CrossrefWork[]][] {
  const grouped = new Map<number | null, CrossrefWork[]>();
  for (const work of works) {
    const group = grouped.get(work.year) ?? [];
    group.push(work);
    grouped.set(work.year, group);
  }
  return [...grouped.entries()].sort(([a], [b]) => {
    if (a === null) return b === null ? 0 : 1;
    if (b === null) return -1;
    return b - a;
  });
}

/** Works per kind, in [KIND_NAMES] order, leaving out kinds with none. */
export function countByKind(works: CrossrefWork[]): [WorkKind, number][] {
  const counts = new Map<WorkKind, number>();
  for (const work of works) {
    const kind = workKind(work.type);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return (Object.keys(KIND_NAMES) as WorkKind[])
    .filter((kind) => counts.has(kind))
    .map((kind) => [kind, counts.get(kind)!]);
}

/** Splits text around each case-insensitive match of [name]. */
export function splitOnName(
  text: string,
  name: string,
): { text: string; isName: boolean }[] {
  if (!name) return [{ text, isName: false }];
  const parts: { text: string; isName: boolean }[] = [];
  const lower = text.toLowerCase();
  const needle = name.toLowerCase();
  let start = 0;
  for (
    let index = lower.indexOf(needle);
    index >= 0;
    index = lower.indexOf(needle, start)
  ) {
    if (index > start)
      parts.push({ text: text.slice(start, index), isName: false });
    parts.push({ text: text.slice(index, index + name.length), isName: true });
    start = index + name.length;
  }
  if (start < text.length)
    parts.push({ text: text.slice(start), isName: false });
  return parts;
}

function withInitials(family: string, given: string): string {
  const initials = given
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");
  return initials ? `${family}, ${initials}` : family;
}

/** Drops publisher markup, which some deposits escape (`&lt;i&gt;`). */
function cleanMarkup(raw: string): string {
  const entities: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };
  let title = raw;
  for (const [entity, char] of Object.entries(entities)) {
    title = title.replaceAll(entity, char);
  }
  return title
    .replaceAll("&amp;", "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function firstString(value: unknown): string {
  if (Array.isArray(value) && value.length > 0) return String(value[0]).trim();
  if (typeof value === "string") return value.trim();
  return "";
}
