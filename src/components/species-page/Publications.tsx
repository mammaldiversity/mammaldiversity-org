import { useEffect, useState } from "preact/hooks";
import {
  KIND_NAMES,
  countByKind,
  crossrefSearchUrl,
  fetchCrossrefWorks,
  groupByYear,
  splitOnName,
  workCitation,
  workKind,
  workSource,
  workTypeLabel,
  workUrl,
  type CrossrefWork,
  type WorkKind,
} from "../../libs/crossref";

/** Timeline entries shown before "Show all". */
const INITIAL_COUNT = 10;

// Text clears 4.5:1 on its background in both themes (WCAG 1.4.3).
const KIND_CLASSES: Record<WorkKind, string> = {
  article: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
  book: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  grayLiterature:
    "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
  data: "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100",
  other: "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100",
};

type Status =
  | { state: "loading" }
  | { state: "error" }
  | { state: "done"; works: CrossrefWork[] };

export default function Publications({ species }: { species: string }) {
  const [status, setStatus] = useState<Status>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus({ state: "loading" });
    fetchCrossrefWorks(species, controller.signal)
      .then((works) => setStatus({ state: "done", works }))
      .catch((error) => {
        if (!controller.signal.aborted) setStatus({ state: "error" });
        if (error?.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, [species, attempt]);

  return (
    <section
      className="rounded-2xl p-4 md:p-6 mt-4 border border-spectra-200 dark:border-spectra-700"
      aria-labelledby="publications-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="publications-heading"
          className="text-lg md:text-xl font-semibold"
        >
          Publications
        </h2>
        <a
          href={crossrefSearchUrl(species)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline text-spectra-700 dark:text-spectra-200"
        >
          Search Crossref
        </a>
      </div>
      <p className="text-xs text-spectra-800 dark:text-spectra-100 mb-4">
        Fetched automatically from Crossref and not curated by the MDD team.
        Only works with <i>{species}</i> in the title or abstract are shown.
      </p>
      {status.state === "loading" && (
        <p
          className="text-sm text-spectra-800 dark:text-spectra-200"
          role="status"
        >
          Searching Crossref…
        </p>
      )}
      {status.state === "error" && (
        <p
          className="text-sm text-spectra-800 dark:text-spectra-200"
          role="status"
        >
          Couldn't reach Crossref.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </button>
        </p>
      )}
      {status.state === "done" &&
        (status.works.length === 0 ? (
          <p className="text-sm text-spectra-800 dark:text-spectra-200">
            No publications with this species in the title or abstract found.
          </p>
        ) : (
          <WorkList works={status.works} species={species} />
        ))}
    </section>
  );
}

function WorkList({
  works,
  species,
}: {
  works: CrossrefWork[];
  species: string;
}) {
  const [filter, setFilter] = useState<WorkKind | null>(null);
  const [showAll, setShowAll] = useState(false);
  const years = works.flatMap((w) => (w.year === null ? [] : [w.year]));
  const filtered = filter
    ? works.filter((w) => workKind(w.type) === filter)
    : works;
  const visible = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const kinds = countByKind(works);

  const chip = (kind: WorkKind | null, label: string) => (
    <button
      type="button"
      aria-pressed={filter === kind}
      onClick={() => {
        setFilter(kind);
        setShowAll(false);
      }}
      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
        filter === kind
          ? "bg-spectra-800 text-spectra-50 border-spectra-800 dark:bg-spectra-200 dark:text-spectra-950 dark:border-spectra-200"
          : "border-spectra-300 dark:border-spectra-700 hover:bg-spectra-100 dark:hover:bg-spectra-800"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <dl className="grid grid-cols-3 gap-2 mb-4 max-w-md">
        <Stat label="Works" value={String(works.length)} />
        <Stat
          label="Latest"
          value={years.length ? String(Math.max(...years)) : "—"}
        />
        <Stat
          label="Earliest"
          value={years.length ? String(Math.min(...years)) : "—"}
        />
      </dl>
      {kinds.length > 1 && (
        <div
          className="flex flex-wrap gap-2 mb-4"
          role="group"
          aria-label="Filter by type"
        >
          {chip(null, `All ${works.length}`)}
          {kinds.map(([kind, count]) =>
            chip(kind, `${KIND_NAMES[kind]} ${count}`),
          )}
        </div>
      )}
      <ol>
        {groupByYear(visible).map(([year, group]) => (
          <li
            key={year ?? "nd"}
            className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-spectra-200 dark:border-spectra-800"
          >
            <div className="text-sm font-semibold text-spectra-700 dark:text-spectra-300 pt-3">
              {year ?? "n.d."}
            </div>
            <ul className="divide-y divide-spectra-200/60 dark:divide-spectra-800/60">
              {group.map((work) => (
                <Work key={work.doi} work={work} species={species} />
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {filtered.length > INITIAL_COUNT && (
        <button
          type="button"
          className="mt-3 text-sm underline text-spectra-700 dark:text-spectra-200"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show fewer" : `Show all ${filtered.length}`}
        </button>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-spectra-200 dark:border-spectra-700 px-3 py-2">
      <dt className="text-xs text-spectra-700 dark:text-spectra-200">
        {label}
      </dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}

function Work({ work, species }: { work: CrossrefWork; species: string }) {
  const [copied, setCopied] = useState(false);
  const label = workTypeLabel(work.type);
  const meta = [work.authors, workSource(work)].filter(Boolean).join(" · ");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(workCitation(work));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <li className="py-3">
      {label && (
        <span
          className={`inline-block text-xs px-1.5 py-0.5 rounded mb-1 ${KIND_CLASSES[workKind(work.type)]}`}
        >
          {label}
        </span>
      )}
      <p className="text-sm font-medium">
        {splitOnName(work.title, species).map((part, i) =>
          part.isName ? <i key={i}>{part.text}</i> : part.text,
        )}
      </p>
      {meta && (
        <p className="text-xs text-spectra-700 dark:text-spectra-200">{meta}</p>
      )}
      <div className="flex gap-4 mt-1 text-xs">
        <a
          href={workUrl(work)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-spectra-700 dark:text-spectra-200"
        >
          View
        </a>
        <button
          type="button"
          onClick={copy}
          className="underline text-spectra-700 dark:text-spectra-200"
        >
          {copied ? "Copied" : "Copy citation"}
        </button>
      </div>
    </li>
  );
}
