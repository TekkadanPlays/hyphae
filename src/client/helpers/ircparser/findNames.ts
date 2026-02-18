// Find nicknames in IRC text — migrated from TheLounge

export type NamePart = {
  start: number;
  end: number;
  nick: string;
};

const nickRegExp = /([\w[\]\\`^{|}-]+)/g;

export default function findNames(text: string, nicks: string[]): NamePart[] {
  const result: NamePart[] = [];

  if (nicks.length === 0) return result;

  let match: RegExpExecArray | null;
  nickRegExp.lastIndex = 0;

  while ((match = nickRegExp.exec(text))) {
    if (nicks.indexOf(match[1]) > -1) {
      result.push({
        start: match.index,
        end: match.index + match[1].length,
        nick: match[1],
      });
    }
  }

  return result;
}
