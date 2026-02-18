// Find channel names in IRC text — migrated from TheLounge

export type ChannelPart = {
  start: number;
  end: number;
  channel: string;
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeRegExpCharSet(raw: string): string {
  return escapeRegExp(raw).replace('-', '\\-');
}

export default function findChannels(
  text: string,
  channelPrefixes: string[] = ['#', '&'],
  userModes: string[] = ['@', '+', '%', '~', '&'],
): ChannelPart[] {
  const userModePattern = userModes.map(escapeRegExpCharSet).join('');
  const channelPrefixPattern = channelPrefixes.map(escapeRegExpCharSet).join('');
  const channelPattern = `(?:^|\\s)[${userModePattern}]*([${channelPrefixPattern}][^ \\u0007]+)`;
  const channelRegExp = new RegExp(channelPattern, 'g');

  const result: ChannelPart[] = [];
  let match: RegExpExecArray | null;

  while ((match = channelRegExp.exec(text))) {
    result.push({
      start: match.index + match[0].length - match[1].length,
      end: match.index + match[0].length,
      channel: match[1],
    });
  }

  return result;
}
