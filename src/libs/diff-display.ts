export interface DiffReferenceTextToken {
  type: "text";
  text: string;
}

export interface DiffReferenceLinkToken {
  type: "link";
  text: string;
  href: string;
}

export interface DiffReferenceItalicToken {
  type: "italic";
  text: string;
}

export type DiffReferenceToken =
  | DiffReferenceTextToken
  | DiffReferenceLinkToken
  | DiffReferenceItalicToken;

const TOKEN_PATTERN =
  /https?:\/\/[^\s<>"|]+|(?:\bdoi\s*:?\s*10\.\d{4,9}\/[^\s<>"|]+|\b10\.\d{4,9}\/[^\s<>"|]+|\ba#\d+)|_[^_]+_/gi;
const DOI_URL_PATTERN = /^https?:\/\/(?:dx\.)?doi\.org\/(10\.\d{4,9}\/[^\s<>"|]+)$/i;
const DOI_LABEL_PATTERN = /^(doi\s*:?\s*)(10\.\d{4,9}\/[^\s<>"|]+)$/i;
const DOI_PATTERN = /^10\.\d{4,9}\/[^\s<>"|]+$/i;
const HESPEROMYS_PATTERN = /^a#(\d+)$/i;

function stripTrailingCitationPunctuation(value: string): string {
  let end = value.length;

  while (end > 0 && /[.,;:!?]/.test(value[end - 1]!)) {
    end -= 1;
  }

  for (const [closing, opening] of [
    [")", "("],
    ["]", "["],
    ["}", "{"],
  ]) {
    if (value[end - 1] === closing && !value.slice(0, end).includes(opening)) {
      end -= 1;
    }
  }

  return value.slice(0, end);
}

function getDoiTarget(value: string): string | undefined {
  const doiUrlMatch = value.match(DOI_URL_PATTERN);
  if (doiUrlMatch) {
    return stripTrailingCitationPunctuation(doiUrlMatch[1]!);
  }

  const doiLabelMatch = value.match(DOI_LABEL_PATTERN);
  if (doiLabelMatch) {
    return stripTrailingCitationPunctuation(doiLabelMatch[2]!);
  }

  const doiMatch = value.match(DOI_PATTERN);
  return doiMatch ? stripTrailingCitationPunctuation(doiMatch[0]) : undefined;
}

function normalizeDiffText(value: string): string {
  return value.replaceAll("|", " · ");
}

function makeLinkToken(rawMatch: string): DiffReferenceLinkToken | undefined {
  const text = stripTrailingCitationPunctuation(rawMatch);
  if (!text) return undefined;

  const doi = getDoiTarget(text);
  const hesperomysMatch = text.match(HESPEROMYS_PATTERN);
  return {
    type: "link",
    text,
    href: doi
      ? "https://doi.org/" + doi
      : hesperomysMatch
        ? "https://hesperomys.com/a/" + hesperomysMatch[1]
        : text,
  };
}

function appendTextToken(tokens: DiffReferenceToken[], text: string): void {
  if (!text) return;

  const normalizedText = normalizeDiffText(text);
  const previous = tokens[tokens.length - 1];
  if (previous?.type === "text") {
    previous.text += normalizedText;
  } else {
    tokens.push({ type: "text", text: normalizedText });
  }
}

export function formatDiffName(value: string): string {
  return value.replaceAll("_", " ");
}

export function tokenizeDiffText(value: string): DiffReferenceToken[] {
  const tokens: DiffReferenceToken[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    const rawMatch = match[0];
    const isItalic = rawMatch.startsWith("_") && rawMatch.endsWith("_");
    const link = isItalic ? undefined : makeLinkToken(rawMatch);

    if (index > lastIndex) {
      appendTextToken(tokens, value.slice(lastIndex, index));
    }

    if (isItalic) {
      tokens.push({
        type: "italic",
        text: normalizeDiffText(rawMatch.slice(1, -1)),
      });
    } else if (link) {
      tokens.push(link);
    }

    lastIndex = index + rawMatch.length;

    // Citation punctuation trimmed from the link belongs in the following text.
    if (link && link.text.length < rawMatch.length) {
      appendTextToken(tokens, rawMatch.slice(link.text.length));
      lastIndex = index + rawMatch.length;
    }
  }

  if (lastIndex < value.length) {
    appendTextToken(tokens, value.slice(lastIndex));
  }

  return tokens;
}

export function tokenizeDiffReference(value: string): DiffReferenceToken[] {
  return tokenizeDiffText(value);
}
