// Lightweight URL finder for IRC messages — no external deps
// Replaces TheLounge's linkify-it dependency

export type LinkPart = {
  start: number;
  end: number;
  link: string;
};

// Match URLs with explicit schemes, or www. prefixed
const urlRegex = /(?:https?:\/\/|ftp:\/\/|ircs?:\/\/|ssh:\/\/|magnet:\?|www\.)[^\s<>"\u0000-\u001f]+/gi;

export default function findLinks(text: string): LinkPart[] {
  const result: LinkPart[] = [];
  let match: RegExpExecArray | null;

  // Reset lastIndex for global regex
  urlRegex.lastIndex = 0;

  while ((match = urlRegex.exec(text))) {
    let link = match[0];

    // Strip trailing punctuation that's likely not part of the URL
    while (/[.,;:!?)>\]}'"]$/.test(link)) {
      // But keep if balanced parens (common in Wikipedia URLs)
      if (link.endsWith(')') && (link.match(/\(/g) || []).length >= (link.match(/\)/g) || []).length) {
        break;
      }
      link = link.slice(0, -1);
    }

    // Prepend http:// for www. links
    const href = link.startsWith('www.') ? 'http://' + link : link;

    result.push({
      start: match.index,
      end: match.index + link.length,
      link: href,
    });
  }

  return result;
}
