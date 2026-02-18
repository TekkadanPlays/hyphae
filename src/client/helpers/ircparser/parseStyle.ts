// IRC styling control code parser — migrated from TheLounge
// Converts IRC text with control codes into styled fragments

const BOLD = "\x02";
const COLOR = "\x03";
const HEX_COLOR = "\x04";
const RESET = "\x0f";
const REVERSE = "\x16";
const ITALIC = "\x1d";
const UNDERLINE = "\x1f";
const STRIKETHROUGH = "\x1e";
const MONOSPACE = "\x11";

export type ParsedStyle = {
  bold?: boolean;
  textColor?: number;
  bgColor?: number;
  hexColor?: string;
  hexBgColor?: string;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  monospace?: boolean;
  text: string;
  start: number;
  end: number;
};

const colorRx = /^(\d{1,2})(?:,(\d{1,2}))?/;
const hexColorRx = /^([0-9a-f]{6})(?:,([0-9a-f]{6}))?/i;
const controlCodesRx = /[\u0000-\u0009\u000B-\u001F]/g;

function parseStyle(text: string): ParsedStyle[] {
  const result: ParsedStyle[] = [];
  let start = 0;
  let position = 0;

  let colorCodes: RegExpMatchArray | null,
    bold: boolean,
    textColor: number | undefined,
    bgColor: number | undefined,
    hexColor: string | undefined,
    hexBgColor: string | undefined,
    italic: boolean,
    underline: boolean,
    strikethrough: boolean,
    monospace: boolean;

  const resetStyle = () => {
    bold = false;
    textColor = undefined;
    bgColor = undefined;
    hexColor = undefined;
    hexBgColor = undefined;
    italic = false;
    underline = false;
    strikethrough = false;
    monospace = false;
  };

  resetStyle!();

  const emitFragment = () => {
    const textPart = text.slice(start, position);
    const processedText = textPart.replace(controlCodesRx, " ");

    if (processedText.length) {
      const fragmentStart = result.length ? result[result.length - 1].end : 0;
      result.push({
        bold: bold!,
        textColor: textColor!,
        bgColor: bgColor!,
        hexColor: hexColor!,
        hexBgColor: hexBgColor!,
        italic: italic!,
        underline: underline!,
        strikethrough: strikethrough!,
        monospace: monospace!,
        text: processedText,
        start: fragmentStart,
        end: fragmentStart + processedText.length,
      });
    }

    start = position + 1;
  };

  while (position < text.length) {
    switch (text[position]) {
      case RESET:
        emitFragment();
        resetStyle!();
        break;
      case BOLD:
        emitFragment();
        bold = !bold!;
        break;
      case COLOR:
        emitFragment();
        colorCodes = text.slice(position + 1).match(colorRx);
        if (colorCodes) {
          textColor = Number(colorCodes[1]);
          if (colorCodes[2]) bgColor = Number(colorCodes[2]);
          position += colorCodes[0].length;
          start = position + 1;
        } else {
          textColor = undefined;
          bgColor = undefined;
        }
        break;
      case HEX_COLOR:
        emitFragment();
        colorCodes = text.slice(position + 1).match(hexColorRx);
        if (colorCodes) {
          hexColor = colorCodes[1].toUpperCase();
          if (colorCodes[2]) hexBgColor = colorCodes[2].toUpperCase();
          position += colorCodes[0].length;
          start = position + 1;
        } else {
          hexColor = undefined;
          hexBgColor = undefined;
        }
        break;
      case REVERSE: {
        emitFragment();
        const tmp = bgColor;
        bgColor = textColor;
        textColor = tmp;
        break;
      }
      case ITALIC:
        emitFragment();
        italic = !italic!;
        break;
      case UNDERLINE:
        emitFragment();
        underline = !underline!;
        break;
      case STRIKETHROUGH:
        emitFragment();
        strikethrough = !strikethrough!;
        break;
      case MONOSPACE:
        emitFragment();
        monospace = !monospace!;
        break;
    }
    position += 1;
  }

  emitFragment();

  const properties = [
    "bold", "textColor", "bgColor", "hexColor", "hexBgColor",
    "italic", "underline", "strikethrough", "monospace",
  ] as const;

  // Optimize: merge adjacent fragments with identical styles
  return result.reduce<ParsedStyle[]>((prev, curr) => {
    if (prev.length) {
      const last = prev[prev.length - 1];
      if (properties.every((key) => (curr as any)[key] === (last as any)[key])) {
        last.text += curr.text;
        last.end += curr.text.length;
        return prev;
      }
    }
    return prev.concat([curr]);
  }, []);
}

export default parseStyle;
