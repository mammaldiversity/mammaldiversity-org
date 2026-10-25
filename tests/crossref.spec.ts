import { test, expect } from "@playwright/test";
import {
  countByKind,
  crossrefWorksUrl,
  fetchCrossrefWorks,
  filterWorks,
  groupByYear,
  parseWork,
  splitOnName,
  workCitation,
  workKind,
  workSource,
  workTypeLabel,
  type CrossrefWork,
} from "../src/libs/crossref";

const leo = parseWork({
  DOI: "10.1/a",
  title: ["Diet of <i>Panthera leo</i> in Kenya"],
  author: [
    { family: "Smith", given: "Jane Ann" },
    { family: "Doe" },
    { family: "Roe" },
  ],
  issued: { "date-parts": [[2020, 5]] },
  "container-title": ["Journal of Mammalogy"],
  volume: "101",
  issue: "2",
  page: "12-20",
  type: "journal-article",
});

function work(year: number | null, type = "journal-article"): CrossrefWork {
  return { ...leo, year, type, doi: `${year}-${type}` };
}

test("crossrefWorksUrl asks only for fields Crossref accepts", () => {
  const url = new URL(crossrefWorksUrl("Panthera leo"));
  expect(url.searchParams.get("query.bibliographic")).toBe('"Panthera leo"');
  // `subtype` is not selectable; Crossref rejects the request with 400.
  expect(url.searchParams.get("select")?.split(",")).not.toContain("subtype");
  expect(url.searchParams.get("select")?.split(",")).toContain("type");
  expect(url.searchParams.get("select")?.split(",")).toContain("abstract");
});

test("parseWork", () => {
  expect(leo.title).toBe("Diet of Panthera leo in Kenya");
  expect(leo.authors).toBe("Smith et al.");
  expect(leo.year).toBe(2020);
  expect(workSource(leo)).toBe("Journal of Mammalogy, 101 (2), 12-20");
  expect(workCitation(leo)).toBe(
    "Smith, J. A., Doe, Roe. (2020). Diet of Panthera leo in Kenya. " +
      "Journal of Mammalogy, 101 (2), 12-20. https://doi.org/10.1/a",
  );
  expect(
    parseWork({
      DOI: "10.1/x",
      title: ["Capuchins ( &lt;i&gt;Cebus capucinus&lt;/i&gt; ) &amp; kin"],
    }).title,
  ).toBe("Capuchins (Cebus capucinus) & kin");
  expect(parseWork({ DOI: "10.1/y" }).year).toBeNull();
  expect(
    parseWork({
      DOI: "10.1/z",
      abstract:
        "<jats:p>We trapped <jats:italic>Panthera leo</jats:italic>.</jats:p>",
    }).abstract,
  ).toBe("We trapped Panthera leo.");
});

test("filterWorks keeps works naming the binomial in title or abstract", () => {
  const unrelated = { ...leo, title: "Unrelated lions", doi: "10.1/b" };
  const inAbstract = {
    ...unrelated,
    doi: "10.1/c",
    abstract: "Diets of Panthera leo prides.",
  };
  const noDoi = { ...leo, doi: "" };
  expect(
    filterWorks([leo, unrelated, inAbstract, noDoi], "panthera LEO"),
  ).toEqual([leo, inAbstract]);
});

test("workTypeLabel and workKind", () => {
  expect(workTypeLabel("journal-article")).toBe("Journal article");
  expect(workTypeLabel("posted-content")).toBe("Posted content");
  expect(workTypeLabel("dataset")).toBe("Dataset");
  expect(workTypeLabel("some-new-type")).toBe("Some new type");
  expect(workTypeLabel("")).toBe("");
  expect(workKind("journal-article")).toBe("article");
  expect(workKind("book-chapter")).toBe("book");
  expect(workKind("posted-content")).toBe("grayLiterature");
  expect(workKind("dataset")).toBe("data");
  expect(workKind("peer-review")).toBe("other");
});

test("groupByYear sorts newest first with undated works last", () => {
  const groups = groupByYear([
    work(2001),
    work(null),
    work(2020),
    work(2001, "dataset"),
  ]);
  expect(groups.map(([year]) => year)).toEqual([2020, 2001, null]);
  expect(groups[1][1]).toHaveLength(2);
});

test("countByKind follows the filter order and skips empty kinds", () => {
  expect(
    countByKind([
      work(1, "dataset"),
      work(2),
      work(3, "dataset"),
      work(4, "book"),
    ]),
  ).toEqual([
    ["article", 1],
    ["book", 1],
    ["data", 2],
  ]);
});

test("splitOnName", () => {
  expect(splitOnName("Diet of PANTHERA leo", "Panthera leo")).toEqual([
    { text: "Diet of ", isName: false },
    { text: "PANTHERA leo", isName: true },
  ]);
});

test("fetchCrossrefWorks retries once after a failed request", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("Failed to fetch");
    return new Response(
      JSON.stringify({
        message: { items: [{ DOI: "10.1/a", title: ["Panthera leo diet"] }] },
      }),
    );
  }) as typeof fetch;
  try {
    const works = await fetchCrossrefWorks("Panthera leo");
    expect(calls).toBe(2);
    expect(works.map((w) => w.doi)).toEqual(["10.1/a"]);
  } finally {
    globalThis.fetch = original;
  }
});
