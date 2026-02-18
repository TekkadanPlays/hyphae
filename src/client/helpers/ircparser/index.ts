// IRC message parser — combines style parsing, link/channel/nick detection
// Migrated from TheLounge and adapted for InfernoJS createElement

import parseStyle from './parseStyle';
import findChannels from './findChannels';
import findLinks from './findLinks';
import findNames from './findNames';
import merge, { type MergedPart } from './merge';

export type { MergedPart } from './merge';
export { default as parseStyle } from './parseStyle';

export function parseMessage(
  text: string,
  users: string[] = [],
  channelPrefixes: string[] = ['#', '&'],
): MergedPart[] {
  const styleFragments = parseStyle(text);
  const cleanText = styleFragments.map((f) => f.text).join('');

  const channelParts = findChannels(cleanText, channelPrefixes);
  const linkParts = findLinks(cleanText);
  const nameParts = findNames(cleanText, users);

  const parts = [
    ...channelParts,
    ...linkParts,
    ...nameParts,
  ];

  return merge(parts, styleFragments, cleanText);
}
