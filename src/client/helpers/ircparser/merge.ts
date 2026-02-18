// Merge style fragments with text parts — migrated from TheLounge

import type { ParsedStyle } from './parseStyle';
import type { ChannelPart } from './findChannels';
import type { LinkPart } from './findLinks';
import type { NamePart } from './findNames';

export type Part = {
  start: number;
  end: number;
};

export type MergedPart = Part & {
  fragments: ParsedStyle[];
  link?: string;
  channel?: string;
  nick?: string;
};

function anyIntersection(a: Part, b: Part): boolean {
  return (
    (a.start <= b.start && b.start < a.end) ||
    (a.start < b.end && b.end <= a.end) ||
    (b.start <= a.start && a.start < b.end) ||
    (b.start < a.end && a.end <= b.end)
  );
}

function fill(existingEntries: Part[], textLength: number): Part[] {
  let position = 0;
  const result = existingEntries.reduce<Part[]>((acc, seg) => {
    if (seg.start > position) {
      acc.push({ start: position, end: seg.start });
    }
    position = seg.end;
    return acc;
  }, []);

  if (position < textLength) {
    result.push({ start: position, end: textLength });
  }

  return result;
}

function assign(textPart: Part, fragment: ParsedStyle): ParsedStyle {
  const fragStart = fragment.start;
  const start = Math.max(fragment.start, textPart.start);
  const end = Math.min(fragment.end, textPart.end);
  const text = fragment.text.slice(start - fragStart, end - fragStart);
  return { ...fragment, start, end, text };
}

function sortParts(a: Part, b: Part): number {
  return a.start - b.start || b.end - a.end;
}

type InputPart = ChannelPart | LinkPart | NamePart | Part;

export default function merge(
  parts: InputPart[],
  styleFragments: ParsedStyle[],
  cleanText: string,
): MergedPart[] {
  // Remove overlapping parts
  const deduped = parts.sort(sortParts).reduce<InputPart[]>((prev, curr) => {
    if (prev.some((p) => anyIntersection(p, curr))) return prev;
    return prev.concat([curr]);
  }, []);

  // Fill gaps with plain text parts
  const filled = fill(deduped, cleanText.length);
  const allParts: InputPart[] = [...deduped, ...filled].sort(sortParts);

  // Distribute style fragments within text parts
  return allParts.map((part: any) => {
    const merged: MergedPart = {
      start: part.start,
      end: part.end,
      fragments: styleFragments
        .filter((frag) => anyIntersection(part, frag))
        .map((frag) => assign(part, frag)),
    };

    if (part.link) merged.link = part.link;
    if (part.channel) merged.channel = part.channel;
    if (part.nick) merged.nick = part.nick;

    return merged;
  });
}
